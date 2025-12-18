/**
 * College Management React Query Hooks
 * 
 * This file contains React Query hooks for college operations
 * following MNC enterprise standards for error handling and type safety.
 * 
 * @author Student - ACT Team
 * @version 1.0.0
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../../services/api';
import { queryKeys, invalidateQueries } from '../../lib/react-query';
import type {
  College,
  CreateCollegeRequest,
  UpdateCollegeRequest,
  ApiResponse,
  ApiError,
} from '../../types/api';

/**
 * Hook to fetch all colleges
 * 
 * @returns {Object} Query object with colleges data and state
 * 
 * @example
 * ```tsx
 * const { data: colleges, isLoading, error } = useColleges();
 * 
 * if (isLoading) return <div>Loading colleges...</div>;
 * if (error) return <div>Error loading colleges</div>;
 * 
 * return (
 *   <div>
 *     {colleges?.map(college => (
 *       <CollegeCard key={college.id} college={college} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export const useColleges = () => {
  return useQuery<College[], ApiError>({
    queryKey: queryKeys.colleges.lists(),
    queryFn: async (): Promise<College[]> => {
      const response = await ApiService.getColleges();
      
      if (!response || !Array.isArray(response)) {
        throw new Error('Invalid colleges response format');
      }
      
      return response;
    },
    staleTime: 1000 * 60 * 10, // Consider fresh for 10 minutes (colleges don't change often)
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });
};

/**
 * Hook to fetch a single college by ID
 * 
 * @param collegeId - The ID of the college to fetch
 * @returns {Object} Query object with college data and state
 * 
 * @example
 * ```tsx
 * const { data: college, isLoading, error } = useCollege(collegeId);
 * 
 * if (isLoading) return <div>Loading college...</div>;
 * if (error) return <div>Error loading college</div>;
 * if (!college) return <div>College not found</div>;
 * 
 * return <CollegeDetails college={college} />;
 * ```
 */
export const useCollege = (collegeId: string) => {
  return useQuery<College, ApiError>({
    queryKey: queryKeys.colleges.detail(collegeId),
    queryFn: async (): Promise<College> => {
      const response = await ApiService.getCollege?.(collegeId);
      
      if (!response) {
        throw new Error('College API not available');
      }
      
      return response;
    },
    enabled: !!collegeId,
    staleTime: 1000 * 60 * 10, // Consider fresh for 10 minutes
  });
};

/**
 * Hook for creating new colleges
 * 
 * @returns {Object} Mutation object with create college function and state
 * 
 * @example
 * ```tsx
 * const createCollegeMutation = useCreateCollege();
 * 
 * const handleCreateCollege = async (data: CreateCollegeRequest) => {
 *   try {
 *     const result = await createCollegeMutation.mutateAsync(data);
 *     toast.success(`College ${result.name} created successfully`);
 *   } catch (error) {
 *     toast.error('Failed to create college');
 *   }
 * };
 * ```
 */
export const useCreateCollege = () => {
  const queryClient = useQueryClient();

  return useMutation<College, ApiError, CreateCollegeRequest>({
    mutationFn: async (data: CreateCollegeRequest): Promise<College> => {
      const response = await ApiService.createCollege?.(data);
      
      if (!response) {
        throw new Error('Create college API not available');
      }
      
      return response;
    },
    onSuccess: (newCollege) => {
      // Add the new college to the cache
      queryClient.setQueryData(queryKeys.colleges.detail(newCollege.id), newCollege);
      
      // Invalidate and refetch colleges list
      invalidateQueries(queryClient, [
        queryKeys.colleges.lists(),
        queryKeys.dashboard.stats,
      ]);
      
      console.log('College created successfully:', newCollege);
    },
    onError: (error) => {
      console.error('Failed to create college:', error);
    },
  });
};

/**
 * Hook for updating colleges
 * 
 * @returns {Object} Mutation object with update college function and state
 * 
 * @example
 * ```tsx
 * const updateCollegeMutation = useUpdateCollege();
 * 
 * const handleUpdateCollege = async (collegeId: string, data: UpdateCollegeRequest) => {
 *   try {
 *     const result = await updateCollegeMutation.mutateAsync({ collegeId, data });
 *     toast.success('College updated successfully');
 *   } catch (error) {
 *     toast.error('Failed to update college');
 *   }
 * };
 * ```
 */
export const useUpdateCollege = () => {
  const queryClient = useQueryClient();

  return useMutation<College, ApiError, { collegeId: string; data: UpdateCollegeRequest }>({
    mutationFn: async ({ collegeId, data }): Promise<College> => {
      const response = await ApiService.updateCollege?.(collegeId, data);
      
      if (!response) {
        throw new Error('Update college API not available');
      }
      
      return response;
    },
    onSuccess: (updatedCollege) => {
      // Update the college in cache
      queryClient.setQueryData(queryKeys.colleges.detail(updatedCollege.id), updatedCollege);
      
      // Invalidate colleges list to reflect changes
      invalidateQueries(queryClient, [
        queryKeys.colleges.lists(),
      ]);
      
      console.log('College updated successfully:', updatedCollege);
    },
    onError: (error) => {
      console.error('Failed to update college:', error);
    },
  });
};

/**
 * Hook for deleting colleges
 * 
 * @returns {Object} Mutation object with delete college function and state
 * 
 * @example
 * ```tsx
 * const deleteCollegeMutation = useDeleteCollege();
 * 
 * const handleDeleteCollege = async (collegeId: string) => {
 *   if (confirm('Are you sure you want to delete this college?')) {
 *     try {
 *       await deleteCollegeMutation.mutateAsync(collegeId);
 *       toast.success('College deleted successfully');
 *     } catch (error) {
 *       toast.error('Failed to delete college');
 *     }
 *   }
 * };
 * ```
 */
export const useDeleteCollege = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: async (collegeId: string): Promise<void> => {
      await ApiService.deleteCollege?.(collegeId);
    },
    onSuccess: (_, collegeId) => {
      // Remove the college from cache
      queryClient.removeQueries({
        queryKey: queryKeys.colleges.detail(collegeId),
      });
      
      // Invalidate colleges list
      invalidateQueries(queryClient, [
        queryKeys.colleges.lists(),
        queryKeys.dashboard.stats,
      ]);
      
      // Invalidate related data that might reference this college
      invalidateQueries(queryClient, [
        queryKeys.departments.lists(),
        queryKeys.users.lists(),
      ]);
      
      console.log('College deleted successfully:', collegeId);
    },
    onError: (error) => {
      console.error('Failed to delete college:', error);
    },
  });
};
