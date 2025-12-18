/**
 * User Management React Query Hooks
 * 
 * This file contains React Query hooks for user operations
 * following MNC enterprise standards for error handling and type safety.
 * 
 * @author Student-ACT LMS Team
 * @version 1.0.0
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../../services/api';
import { queryKeys, invalidateQueries } from '../../lib/react-query';
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserFilters,
  ApiResponse,
  ApiError,
} from '../../types/api';

/**
 * Hook to fetch all users with optional filtering
 * 
 * @param filters - Optional filters to apply to the user list
 * @returns {Object} Query object with users data and state
 * 
 * @example
 * ```tsx
 * const { data: users, isLoading, error } = useUsers({
 *   role: 'student',
 *   status: 'active',
 *   departmentId: 'dept-123'
 * });
 * 
 * if (isLoading) return <div>Loading users...</div>;
 * if (error) return <div>Error loading users</div>;
 * 
 * return (
 *   <div>
 *     {users?.map(user => (
 *       <UserCard key={user.id} user={user} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export const useUsers = (filters: UserFilters = {}) => {
  return useQuery<User[], ApiError>({
    queryKey: queryKeys.users.list(filters),
    queryFn: async (): Promise<User[]> => {
      const response = await ApiService.getUsers();
      
      if (!response || !Array.isArray(response)) {
        throw new Error('Invalid users response format');
      }
      
      // Apply client-side filtering if needed
      let filteredUsers = response;
      
      if (filters.role) {
        filteredUsers = filteredUsers.filter(user => user.role === filters.role);
      }
      
      if (filters.status) {
        filteredUsers = filteredUsers.filter(user => user.status === filters.status);
      }
      
      if (filters.collegeId) {
        filteredUsers = filteredUsers.filter(user => user.collegeId === filters.collegeId);
      }
      
      if (filters.departmentId) {
        filteredUsers = filteredUsers.filter(user => user.departmentId === filters.departmentId);
      }
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredUsers = filteredUsers.filter(user =>
          user.name.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm) ||
          user.rollNumber?.toLowerCase().includes(searchTerm)
        );
      }
      
      return filteredUsers;
    },
    staleTime: 1000 * 60 * 3, // Consider fresh for 3 minutes
    gcTime: 1000 * 60 * 15, // Keep in cache for 15 minutes
  });
};

/**
 * Hook to fetch a single user by ID
 * 
 * @param userId - The ID of the user to fetch
 * @returns {Object} Query object with user data and state
 * 
 * @example
 * ```tsx
 * const { data: user, isLoading, error } = useUser(userId);
 * 
 * if (isLoading) return <div>Loading user...</div>;
 * if (error) return <div>Error loading user</div>;
 * if (!user) return <div>User not found</div>;
 * 
 * return <UserProfile user={user} />;
 * ```
 */
export const useUser = (userId: string) => {
  return useQuery<User, ApiError>({
    queryKey: queryKeys.users.detail(userId),
    queryFn: async (): Promise<User> => {
      const response = await ApiService.getUser?.(userId);
      
      if (!response) {
        throw new Error('User API not available');
      }
      
      return response;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes
  });
};

/**
 * Hook to fetch users by department
 * 
 * @param departmentId - The ID of the department
 * @returns {Object} Query object with users data and state
 * 
 * @example
 * ```tsx
 * const { data: users, isLoading, error } = useUsersByDepartment(departmentId);
 * 
 * if (isLoading) return <div>Loading department users...</div>;
 * if (error) return <div>Error loading users</div>;
 * 
 * return (
 *   <div>
 *     <h3>Department Users ({users?.length || 0})</h3>
 *     {users?.map(user => (
 *       <UserCard key={user.id} user={user} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export const useUsersByDepartment = (departmentId: string) => {
  return useQuery<User[], ApiError>({
    queryKey: queryKeys.users.byDepartment(departmentId),
    queryFn: async (): Promise<User[]> => {
      const response = await ApiService.getUsersByDepartment(departmentId);
      
      if (!response || !Array.isArray(response)) {
        throw new Error('Invalid users by department response format');
      }
      
      return response;
    },
    enabled: !!departmentId,
    staleTime: 1000 * 60 * 3, // Consider fresh for 3 minutes
  });
};

/**
 * Hook to fetch users by college
 * 
 * @param collegeId - The ID of the college
 * @returns {Object} Query object with users data and state
 * 
 * @example
 * ```tsx
 * const { data: users, isLoading, error } = useUsersByCollege(collegeId);
 * 
 * if (isLoading) return <div>Loading college users...</div>;
 * if (error) return <div>Error loading users</div>;
 * 
 * return (
 *   <div>
 *     <h3>College Users ({users?.length || 0})</h3>
 *     {users?.map(user => (
 *       <UserCard key={user.id} user={user} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export const useUsersByCollege = (collegeId: string) => {
  return useQuery<User[], ApiError>({
    queryKey: queryKeys.users.byCollege(collegeId),
    queryFn: async (): Promise<User[]> => {
      const response = await ApiService.getUsersByCollege?.(collegeId);
      
      if (!response) {
        throw new Error('Users by college API not available');
      }
      
      if (!Array.isArray(response)) {
        throw new Error('Invalid users by college response format');
      }
      
      return response;
    },
    enabled: !!collegeId,
    staleTime: 1000 * 60 * 3, // Consider fresh for 3 minutes
  });
};

/**
 * Hook for creating new users
 * 
 * @returns {Object} Mutation object with create user function and state
 * 
 * @example
 * ```tsx
 * const createUserMutation = useCreateUser();
 * 
 * const handleCreateUser = async (data: CreateUserRequest) => {
 *   try {
 *     const result = await createUserMutation.mutateAsync(data);
 *     toast.success(`User ${result.name} created successfully`);
 *   } catch (error) {
 *     toast.error('Failed to create user');
 *   }
 * };
 * ```
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<User, ApiError, CreateUserRequest>({
    mutationFn: async (data: CreateUserRequest): Promise<User> => {
      const response = await ApiService.createUser?.(data);
      
      if (!response) {
        throw new Error('Create user API not available');
      }
      
      return response;
    },
    onSuccess: (newUser) => {
      // Add the new user to the cache
      queryClient.setQueryData(queryKeys.users.detail(newUser.id), newUser);
      
      // Invalidate and refetch users lists
      invalidateQueries(queryClient, [
        queryKeys.users.lists(),
        queryKeys.dashboard.stats,
      ]);
      
      // Invalidate department and college specific queries if applicable
      if (newUser.departmentId) {
        invalidateQueries(queryClient, [
          queryKeys.users.byDepartment(newUser.departmentId),
        ]);
      }
      
      if (newUser.collegeId) {
        invalidateQueries(queryClient, [
          queryKeys.users.byCollege(newUser.collegeId),
        ]);
      }
      
      console.log('User created successfully:', newUser);
    },
    onError: (error) => {
      console.error('Failed to create user:', error);
    },
  });
};

/**
 * Hook for updating users
 * 
 * @returns {Object} Mutation object with update user function and state
 * 
 * @example
 * ```tsx
 * const updateUserMutation = useUpdateUser();
 * 
 * const handleUpdateUser = async (userId: string, data: UpdateUserRequest) => {
 *   try {
 *     const result = await updateUserMutation.mutateAsync({ userId, data });
 *     toast.success('User updated successfully');
 *   } catch (error) {
 *     toast.error('Failed to update user');
 *   }
 * };
 * ```
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation<User, ApiError, { userId: string; data: UpdateUserRequest }>({
    mutationFn: async ({ userId, data }): Promise<User> => {
      const response = await ApiService.updateUser?.(userId, data);
      
      if (!response) {
        throw new Error('Update user API not available');
      }
      
      return response;
    },
    onSuccess: (updatedUser) => {
      // Update the user in cache
      queryClient.setQueryData(queryKeys.users.detail(updatedUser.id), updatedUser);
      
      // Invalidate users lists to reflect changes
      invalidateQueries(queryClient, [
        queryKeys.users.lists(),
      ]);
      
      // Invalidate department and college specific queries if applicable
      if (updatedUser.departmentId) {
        invalidateQueries(queryClient, [
          queryKeys.users.byDepartment(updatedUser.departmentId),
        ]);
      }
      
      if (updatedUser.collegeId) {
        invalidateQueries(queryClient, [
          queryKeys.users.byCollege(updatedUser.collegeId),
        ]);
      }
      
      console.log('User updated successfully:', updatedUser);
    },
    onError: (error) => {
      console.error('Failed to update user:', error);
    },
  });
};

/**
 * Hook for deleting users
 * 
 * @returns {Object} Mutation object with delete user function and state
 * 
 * @example
 * ```tsx
 * const deleteUserMutation = useDeleteUser();
 * 
 * const handleDeleteUser = async (userId: string) => {
 *   if (confirm('Are you sure you want to delete this user?')) {
 *     try {
 *       await deleteUserMutation.mutateAsync(userId);
 *       toast.success('User deleted successfully');
 *     } catch (error) {
 *       toast.error('Failed to delete user');
 *     }
 *   }
 * };
 * ```
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: async (userId: string): Promise<void> => {
      await ApiService.deleteUser?.(userId);
    },
    onSuccess: (_, userId) => {
      // Remove the user from cache
      queryClient.removeQueries({
        queryKey: queryKeys.users.detail(userId),
      });
      
      // Invalidate users lists
      invalidateQueries(queryClient, [
        queryKeys.users.lists(),
        queryKeys.dashboard.stats,
      ]);
      
      // Invalidate all department and college queries since we don't know
      // which ones the deleted user belonged to
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            key.includes('users') &&
            (key.includes('department') || key.includes('college'))
          );
        },
      });
      
      console.log('User deleted successfully:', userId);
    },
    onError: (error) => {
      console.error('Failed to delete user:', error);
    },
  });
};
