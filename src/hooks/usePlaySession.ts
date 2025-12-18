/**
 * usePlaySession Hook
 * 
 * React Query hooks for Play Session functionality.
 * Provides data fetching, caching, and mutations for Play Session.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { playSessionService } from '../services/playSessionService';
import {
  UpdateProgressRequest,
  CreateCommentRequest,
  SubmitQuizAttemptRequest,
  MapSubjectToSessionRequest,
} from '../types/playSession';

/**
 * Query Keys
 */
export const playSessionKeys = {
  all: ['playSession'] as const,
  session: (subjectId: string) => [...playSessionKeys.all, 'session', subjectId] as const,
  contentBlocks: (sessionId: string) => [...playSessionKeys.all, 'contentBlocks', sessionId] as const,
  progress: (sessionId: string) => [...playSessionKeys.all, 'progress', sessionId] as const,
  bulkProgress: (subjectId: string) => [...playSessionKeys.all, 'bulkProgress', subjectId] as const,
  comments: (blockId: string) => [...playSessionKeys.all, 'comments', blockId] as const,
  quizQuestions: (blockId: string) => [...playSessionKeys.all, 'quizQuestions', blockId] as const,
};

/**
 * Get session by subject ID
 */
export const useSessionBySubject = (subjectId: string, enrollmentId?: string) => {
  return useQuery({
    queryKey: playSessionKeys.session(subjectId),
    queryFn: () => playSessionService.getSessionBySubject(subjectId, enrollmentId),
    enabled: !!subjectId,
    staleTime: 10 * 60 * 1000, // 10 minutes (session data rarely changes)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

/**
 * Get session content blocks
 */
export const useSessionContentBlocks = (sessionId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: playSessionKeys.contentBlocks(sessionId),
    queryFn: () => playSessionService.getSessionContentBlocks(sessionId),
    enabled: options?.enabled !== undefined ? options.enabled : !!sessionId,
    staleTime: 10 * 60 * 1000, // 10 minutes (content blocks rarely change)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

/**
 * Get user progress
 * Aggressive caching to prevent video flickering
 */
export const useUserProgress = (sessionId: string, enrollmentId?: string) => {
  return useQuery({
    queryKey: playSessionKeys.progress(sessionId),
    queryFn: () => playSessionService.getUserProgress(sessionId, enrollmentId),
    enabled: !!sessionId,
    staleTime: Infinity, // Never consider data stale - rely on optimistic updates
    gcTime: Infinity, // Never garbage collect - keep data in cache forever
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch on component mount
    refetchInterval: false, // Disable automatic polling
    refetchOnReconnect: false, // Don't refetch on network reconnect
    notifyOnChangeProps: ['data', 'error'], // Only notify on data/error changes, not loading states
  });
};

/**
 * Get bulk user progress for ALL sessions in a subject/course
 * Optimized for Course Player - loads all progress in one call
 * Aggressive caching to prevent UI flickering
 */
export const useBulkUserProgress = (subjectId: string) => {
  return useQuery({
    queryKey: playSessionKeys.bulkProgress(subjectId),
    queryFn: () => playSessionService.getBulkUserProgress(subjectId),
    enabled: !!subjectId,
    staleTime: Infinity, // Never consider data stale - rely on optimistic updates
    gcTime: Infinity, // Never garbage collect - keep data in cache forever
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch on component mount
    refetchInterval: false, // Disable automatic polling
    refetchOnReconnect: false, // Don't refetch on network reconnect
    notifyOnChangeProps: ['data', 'error'], // Only notify on data/error changes, not loading states
  });
};

/**
 * Update progress mutation with optimistic updates for bulk progress cache
 * Optimized for Course Player - updates the bulk progress cache directly
 */
export const useUpdateProgress = (sessionId?: string, subjectId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateProgressRequest) =>
      playSessionService.updateProgress(request),

    // Optimistic update - update UI immediately before server responds
    onMutate: async (newProgress) => {
      // If we have subjectId, update the bulk progress cache (Course Player)
      if (subjectId) {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: playSessionKeys.bulkProgress(subjectId) });

        // Snapshot the previous value
        const previousBulkProgress = queryClient.getQueryData(playSessionKeys.bulkProgress(subjectId));

        // Optimistically update the bulk progress cache
        queryClient.setQueryData(playSessionKeys.bulkProgress(subjectId), (old: any) => {
          if (!old || !old.progress) return old;

          // Update the specific content block progress in the progress array
          const updatedProgressArray = old.progress.map((item: any) => {
            if (item.contentBlockId === newProgress.contentBlockId) {
              return {
                ...item,
                isCompleted: newProgress.isCompleted,
                timeSpent: (item.timeSpent || 0) + (newProgress.timeSpent || 0),
                completedAt: newProgress.isCompleted ? new Date().toISOString() : null,
              };
            }
            return item;
          });

          // If content block doesn't exist yet, add it
          const exists = old.progress.some((item: any) => item.contentBlockId === newProgress.contentBlockId);
          if (!exists) {
            updatedProgressArray.push({
              contentBlockId: newProgress.contentBlockId,
              sessionId: newProgress.sessionId,
              contentBlockTitle: '', // Will be updated on server response
              contentBlockType: '',
              isCompleted: newProgress.isCompleted,
              timeSpent: newProgress.timeSpent || 0,
              completionData: newProgress.completionData || null,
              completedAt: newProgress.isCompleted ? new Date().toISOString() : null,
            });
          }

          // Recalculate overall statistics
          const totalBlocks = old.overallStatistics.totalBlocks;
          const completedBlocks = updatedProgressArray.filter((p: any) => p.isCompleted).length;
          const completionPercentage = totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0;
          const totalTimeSpent = updatedProgressArray.reduce((sum: number, p: any) => sum + (p.timeSpent || 0), 0);

          return {
            ...old,
            progress: updatedProgressArray,
            overallStatistics: {
              ...old.overallStatistics,
              completedBlocks,
              completionPercentage,
              totalTimeSpent,
            },
          };
        });

        return { previousBulkProgress };
      }

      // Fallback: update per-session progress cache (legacy PlaySession)
      if (sessionId) {
        await queryClient.cancelQueries({ queryKey: playSessionKeys.progress(sessionId) });
        const previousProgress = queryClient.getQueryData(playSessionKeys.progress(sessionId));

        queryClient.setQueryData(playSessionKeys.progress(sessionId), (old: any) => {
          if (!old || !old.progress) return old;

          const updatedProgressArray = old.progress.map((item: any) => {
            if (item.contentBlockId === newProgress.contentBlockId) {
              return {
                ...item,
                isCompleted: newProgress.isCompleted,
                timeSpent: (item.timeSpent || 0) + (newProgress.timeSpent || 0),
                completedAt: newProgress.isCompleted ? new Date().toISOString() : null,
              };
            }
            return item;
          });

          const exists = old.progress.some((item: any) => item.contentBlockId === newProgress.contentBlockId);
          if (!exists && newProgress.isCompleted) {
            updatedProgressArray.push({
              contentBlockId: newProgress.contentBlockId,
              isCompleted: newProgress.isCompleted,
              timeSpent: newProgress.timeSpent || 0,
              completedAt: new Date().toISOString(),
            });
          }

          return {
            ...old,
            progress: updatedProgressArray,
          };
        });

        return { previousProgress };
      }
    },

    // On error, rollback to previous value
    onError: (err, newProgress, context: any) => {
      // Rollback bulk progress cache if available
      if (subjectId && context?.previousBulkProgress) {
        queryClient.setQueryData(playSessionKeys.bulkProgress(subjectId), context.previousBulkProgress);
      }
      // Rollback per-session progress cache if available
      if (sessionId && context?.previousProgress) {
        queryClient.setQueryData(playSessionKeys.progress(sessionId), context.previousProgress);
      }
      console.error('❌ Failed to update progress:', err);
    },

    // On success, invalidate enrollment cache to update progress percentage
    onSuccess: () => {
      // Invalidate enrollment cache so it refetches with updated progress
      queryClient.invalidateQueries({ queryKey: ['student-enrollment', 'enrolled-subjects'] });
    },

    // NO onSettled callback
    // Relying purely on optimistic updates to prevent automatic refetching
    // which causes video flickering
  });
};

/**
 * Get comments for a content block
 */
export const useComments = (blockId: string) => {
  return useQuery({
    queryKey: playSessionKeys.comments(blockId),
    queryFn: () => playSessionService.getComments(blockId),
    enabled: !!blockId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Create comment mutation
 */
export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateCommentRequest) => 
      playSessionService.createComment(request),
    onSuccess: (data, variables) => {
      // Invalidate comments for this block
      queryClient.invalidateQueries({ 
        queryKey: playSessionKeys.comments(variables.contentBlockId) 
      });
    },
  });
};

/**
 * Get quiz questions
 */
export const useQuizQuestions = (blockId: string) => {
  return useQuery({
    queryKey: playSessionKeys.quizQuestions(blockId),
    queryFn: () => playSessionService.getQuizQuestions(blockId),
    enabled: !!blockId,
    staleTime: 10 * 60 * 1000, // 10 minutes (questions don't change often)
  });
};

/**
 * Submit quiz attempt mutation
 */
export const useSubmitQuizAttempt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SubmitQuizAttemptRequest) => 
      playSessionService.submitQuizAttempt(request),
    onSuccess: (data, variables) => {
      // Invalidate progress (quiz completion updates progress)
      queryClient.invalidateQueries({ queryKey: playSessionKeys.all });
    },
  });
};

/**
 * Map subject to session mutation (Admin/Staff only)
 */
export const useMapSubjectToSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: MapSubjectToSessionRequest) => 
      playSessionService.mapSubjectToSession(request),
    onSuccess: () => {
      // Invalidate all session queries
      queryClient.invalidateQueries({ queryKey: playSessionKeys.all });
    },
  });
};

