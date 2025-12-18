/**
 * Department Management React Query Hooks
 * 
 * This file contains React Query hooks for department operations
 * following MNC enterprise standards for error handling and type safety.
 * 
 * @author Student - ACT Team
 * @version 1.0.0
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../../services/api';
import { queryKeys, invalidateQueries } from '../../lib/react-query';
import type {
  Department,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  ApiResponse,
  ApiError,
} from '../../types/api';

/**
 * Hook to fetch all departments
 * 
 * @returns {Object} Query object with departments data and state
 * 
 * @example
 * ```tsx
 * const { data: departments, isLoading, error } = useDepartments();
 * 
 * if (isLoading) return <div>Loading departments...</div>;
 * if (error) return <div>Error loading departments</div>;
 * 
 * return (
 *   <div>
 *     {departments?.map(department => (
 *       <DepartmentCard key={department.id} department={department} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export const useDepartments = () => {
  return useQuery<Department[], ApiError>({
    queryKey: queryKeys.departments.lists(),
    queryFn: async (): Promise<Department[]> => {
      const response = await ApiService.getDepartments();
      
      if (!response || !Array.isArray(response)) {
        throw new Error('Invalid departments response format');
      }
      
      return response;
    },
    staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes
    gcTime: 1000 * 60 * 20, // Keep in cache for 20 minutes
  });
};

/**
 * Hook to fetch a single department by ID
 * 
 * @param departmentId - The ID of the department to fetch
 * @returns {Object} Query object with department data and state
 * 
 * @example
 * ```tsx
 * const { data: department, isLoading, error } = useDepartment(departmentId);
 * 
 * if (isLoading) return <div>Loading department...</div>;
 * if (error) return <div>Error loading department</div>;
 * if (!department) return <div>Department not found</div>;
 * 
 * return <DepartmentDetails department={department} />;
 * ```
 */
export const useDepartment = (departmentId: string) => {
  return useQuery<Department, ApiError>({
    queryKey: queryKeys.departments.detail(departmentId),
    queryFn: async (): Promise<Department> => {
      const response = await ApiService.getDepartment?.(departmentId);
      
      if (!response) {
        throw new Error('Department API not available');
      }
      
      return response;
    },
    enabled: !!departmentId,
    staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes
  });
};

/**
 * Hook to fetch departments by college
 * 
 * @param collegeId - The ID of the college
 * @returns {Object} Query object with departments data and state
 * 
 * @example
 * ```tsx
 * const { data: departments, isLoading, error } = useDepartmentsByCollege(collegeId);
 * 
 * if (isLoading) return <div>Loading college departments...</div>;
 * if (error) return <div>Error loading departments</div>;
 * 
 * return (
 *   <div>
 *     <h3>College Departments ({departments?.length || 0})</h3>
 *     {departments?.map(department => (
 *       <DepartmentCard key={department.id} department={department} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export const useDepartmentsByCollege = (collegeId: string) => {
  return useQuery<Department[], ApiError>({
    queryKey: queryKeys.departments.byCollege(collegeId),
    queryFn: async (): Promise<Department[]> => {
      const response = await ApiService.getDepartmentsByCollege?.(collegeId);
      
      if (!response) {
        // Fallback to filtering all departments
        const allDepartments = await ApiService.getDepartments();
        if (!Array.isArray(allDepartments)) {
          throw new Error('Invalid departments response format');
        }
        return allDepartments.filter(dept => dept.collegeId === collegeId);
      }
      
      if (!Array.isArray(response)) {
        throw new Error('Invalid departments by college response format');
      }
      
      return response;
    },
    enabled: !!collegeId,
    staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes
  });
};

/**
 * Hook for creating new departments
 * 
 * @returns {Object} Mutation object with create department function and state
 * 
 * @example
 * ```tsx
 * const createDepartmentMutation = useCreateDepartment();
 * 
 * const handleCreateDepartment = async (data: CreateDepartmentRequest) => {
 *   try {
 *     const result = await createDepartmentMutation.mutateAsync(data);
 *     toast.success(`Department ${result.name} created successfully`);
 *   } catch (error) {
 *     toast.error('Failed to create department');
 *   }
 * };
 * ```
 */
export const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation<Department, ApiError, CreateDepartmentRequest>({
    mutationFn: async (data: CreateDepartmentRequest): Promise<Department> => {
      const response = await ApiService.createDepartment?.(data);
      
      if (!response) {
        throw new Error('Create department API not available');
      }
      
      return response;
    },
    onSuccess: (newDepartment) => {
      // Add the new department to the cache
      queryClient.setQueryData(queryKeys.departments.detail(newDepartment.id), newDepartment);
      
      // Invalidate and refetch departments lists
      invalidateQueries(queryClient, [
        queryKeys.departments.lists(),
        queryKeys.dashboard.stats,
      ]);
      
      // Invalidate college-specific departments if applicable
      if (newDepartment.collegeId) {
        invalidateQueries(queryClient, [
          queryKeys.departments.byCollege(newDepartment.collegeId),
        ]);
      }
      
      console.log('Department created successfully:', newDepartment);
    },
    onError: (error) => {
      console.error('Failed to create department:', error);
    },
  });
};

/**
 * Hook for updating departments
 * 
 * @returns {Object} Mutation object with update department function and state
 * 
 * @example
 * ```tsx
 * const updateDepartmentMutation = useUpdateDepartment();
 * 
 * const handleUpdateDepartment = async (departmentId: string, data: UpdateDepartmentRequest) => {
 *   try {
 *     const result = await updateDepartmentMutation.mutateAsync({ departmentId, data });
 *     toast.success('Department updated successfully');
 *   } catch (error) {
 *     toast.error('Failed to update department');
 *   }
 * };
 * ```
 */
export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation<Department, ApiError, { departmentId: string; data: UpdateDepartmentRequest }>({
    mutationFn: async ({ departmentId, data }): Promise<Department> => {
      const response = await ApiService.updateDepartment?.(departmentId, data);
      
      if (!response) {
        throw new Error('Update department API not available');
      }
      
      return response;
    },
    onSuccess: (updatedDepartment) => {
      // Update the department in cache
      queryClient.setQueryData(queryKeys.departments.detail(updatedDepartment.id), updatedDepartment);
      
      // Invalidate departments lists to reflect changes
      invalidateQueries(queryClient, [
        queryKeys.departments.lists(),
      ]);
      
      // Invalidate college-specific departments if applicable
      if (updatedDepartment.collegeId) {
        invalidateQueries(queryClient, [
          queryKeys.departments.byCollege(updatedDepartment.collegeId),
        ]);
      }
      
      console.log('Department updated successfully:', updatedDepartment);
    },
    onError: (error) => {
      console.error('Failed to update department:', error);
    },
  });
};

/**
 * Hook for deleting departments
 * 
 * @returns {Object} Mutation object with delete department function and state
 * 
 * @example
 * ```tsx
 * const deleteDepartmentMutation = useDeleteDepartment();
 * 
 * const handleDeleteDepartment = async (departmentId: string) => {
 *   if (confirm('Are you sure you want to delete this department?')) {
 *     try {
 *       await deleteDepartmentMutation.mutateAsync(departmentId);
 *       toast.success('Department deleted successfully');
 *     } catch (error) {
 *       toast.error('Failed to delete department');
 *     }
 *   }
 * };
 * ```
 */
export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: async (departmentId: string): Promise<void> => {
      await ApiService.deleteDepartment?.(departmentId);
    },
    onSuccess: (_, departmentId) => {
      // Remove the department from cache
      queryClient.removeQueries({
        queryKey: queryKeys.departments.detail(departmentId),
      });
      
      // Invalidate departments lists
      invalidateQueries(queryClient, [
        queryKeys.departments.lists(),
        queryKeys.dashboard.stats,
      ]);
      
      // Invalidate all college-specific department queries since we don't know
      // which college the deleted department belonged to
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return key.includes('departments') && key.includes('college');
        },
      });
      
      // Invalidate related data that might reference this department
      invalidateQueries(queryClient, [
        queryKeys.users.lists(),
        queryKeys.invitations.lists(),
      ]);
      
      console.log('Department deleted successfully:', departmentId);
    },
    onError: (error) => {
      console.error('Failed to delete department:', error);
    },
  });
};
