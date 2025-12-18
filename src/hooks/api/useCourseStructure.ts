/**
 * React Query Hook for Course Structure
 * 
 * Fetches hierarchical course structure from the backend API
 * Structure: Syllabus → Lessons → Sessions → Content Blocks
 * 
 * @author Student-ACT LMS Team
 * @version 1.0.0
 */

import { useQuery } from '@tanstack/react-query';
import { ApiService } from '../../services/api';

// ==================== TYPES ====================

export interface ContentBlock {
  id: string;
  type: string;
  title: string;
  order: number;
  estimatedTime: string | null;
  isRequired: boolean;
}

export interface Session {
  id: string;
  title: string;
  description: string | null;
  objectives: string | null;
  duration: number | null;
  contentBlocks: ContentBlock[];
}

export interface Lesson {
  id: string;
  moduleName: string;
  title: string;
  duration: number | null;
  numberOfSessions: number;
  pdfUrl: string | null;
  sessions: Session[];
}

export interface CourseStructure {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  syllabus: {
    id: string | null;
    title: string | null;
    pdfUrl: string | null;
  };
  lessons: Lesson[];
  totalSessions: number;
  totalContentBlocks: number;
}

// ==================== QUERY KEYS ====================

export const courseStructureKeys = {
  all: ['course-structure'] as const,
  bySubject: (subjectId: string) => [...courseStructureKeys.all, subjectId] as const,
};

// ==================== HOOKS ====================

/**
 * Hook to fetch course structure for a subject
 * @param subjectId - The subject ID to fetch structure for
 */
export function useCourseStructure(subjectId: string | undefined) {
  return useQuery({
    queryKey: courseStructureKeys.bySubject(subjectId || ''),
    queryFn: async () => {
      if (!subjectId) {
        throw new Error('Subject ID is required');
      }

      const response = await ApiService.get<CourseStructure>(
        `/play-session/subject/${subjectId}/course-structure`
      );

      return response.data;
    },
    enabled: !!subjectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * Hook to get a specific lesson from course structure
 * @param subjectId - The subject ID
 * @param lessonId - The lesson ID to find
 */
export function useLesson(subjectId: string | undefined, lessonId: string | undefined) {
  const { data: courseStructure, ...rest } = useCourseStructure(subjectId);

  const lesson = courseStructure?.lessons.find(l => l.id === lessonId);

  return {
    lesson,
    courseStructure,
    ...rest,
  };
}

/**
 * Hook to get a specific session from course structure
 * @param subjectId - The subject ID
 * @param sessionId - The session ID to find
 */
export function useSession(subjectId: string | undefined, sessionId: string | undefined) {
  const { data: courseStructure, ...rest } = useCourseStructure(subjectId);

  let foundSession: Session | undefined;
  let parentLesson: Lesson | undefined;

  if (courseStructure) {
    for (const lesson of courseStructure.lessons) {
      const session = lesson.sessions.find(s => s.id === sessionId);
      if (session) {
        foundSession = session;
        parentLesson = lesson;
        break;
      }
    }
  }

  return {
    session: foundSession,
    lesson: parentLesson,
    courseStructure,
    ...rest,
  };
}

/**
 * Hook to get course statistics
 * @param subjectId - The subject ID
 */
export function useCourseStats(subjectId: string | undefined) {
  const { data: courseStructure, ...rest } = useCourseStructure(subjectId);

  const stats = courseStructure
    ? {
        totalLessons: courseStructure.lessons.length,
        totalSessions: courseStructure.totalSessions,
        totalContentBlocks: courseStructure.totalContentBlocks,
        averageSessionsPerLesson: courseStructure.lessons.length > 0
          ? Math.round(courseStructure.totalSessions / courseStructure.lessons.length)
          : 0,
        averageBlocksPerSession: courseStructure.totalSessions > 0
          ? Math.round(courseStructure.totalContentBlocks / courseStructure.totalSessions)
          : 0,
      }
    : null;

  return {
    stats,
    courseStructure,
    ...rest,
  };
}

export default {
  useCourseStructure,
  useLesson,
  useSession,
  useCourseStats,
};

