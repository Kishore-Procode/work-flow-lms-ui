import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../../services/api';
import { queryKeys } from '../../lib/react-query';
import {
  optimisticCreateUser,
  optimisticUpdateUser,
  optimisticDeleteUser,
  rollbackOptimisticUpdate,
  withOptimisticUpdate,
} from '../../lib/optimistic-updates';

/**
 * Enhanced user management hooks with optimistic updates
 * These hooks provide immediate UI feedback while API calls are in progress
 */

export const useOptimisticCreateUser = (filters: any = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: withOptimisticUpdate(
      (userData: any) => ApiService.createUser(userData),
      async (userData: any) => {
        // Generate optimistic user data
        const optimisticUser = {
          id: `temp-${Date.now()}`,
          ...userData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active',
        };

        return optimisticCreateUser(queryClient, optimisticUser, filters);
      }
    ),
    onSuccess: (data, variables) => {
      // Invalidate and refetch users list to get the real data
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      
      // Show success notification
      console.log('User created successfully:', data);
    },
    onError: (error, variables, context) => {
      console.error('Failed to create user:', error);
      // Optimistic rollback is handled by withOptimisticUpdate
    },
  });
};

export const useOptimisticUpdateUser = (filters: any = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: withOptimisticUpdate(
      ({ userId, userData }: { userId: string; userData: any }) => 
        ApiService.updateUser(userId, userData),
      async ({ userId, userData }: { userId: string; userData: any }) => {
        const optimisticData = {
          ...userData,
          updatedAt: new Date().toISOString(),
        };

        return optimisticUpdateUser(queryClient, userId, optimisticData, filters);
      }
    ),
    onSuccess: (data, { userId }) => {
      // Invalidate specific user queries
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      
      console.log('User updated successfully:', data);
    },
    onError: (error, variables, context) => {
      console.error('Failed to update user:', error);
    },
  });
};

export const useOptimisticDeleteUser = (filters: any = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: withOptimisticUpdate(
      (userId: string) => ApiService.deleteUser(userId),
      async (userId: string) => {
        return optimisticDeleteUser(queryClient, userId, filters);
      }
    ),
    onSuccess: (data, userId) => {
      // Remove user from cache
      queryClient.removeQueries({ queryKey: queryKeys.users.detail(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      
      console.log('User deleted successfully');
    },
    onError: (error, variables, context) => {
      console.error('Failed to delete user:', error);
    },
  });
};

export const useOptimisticBulkUserActions = (filters: any = {}) => {
  const queryClient = useQueryClient();

  const bulkDelete = useMutation({
    mutationFn: async (userIds: string[]) => {
      // Perform optimistic updates for all users
      const contexts = await Promise.all(
        userIds.map(userId => optimisticDeleteUser(queryClient, userId, filters))
      );

      try {
        // Execute bulk delete API call
        const result = await ApiService.bulkDeleteUsers(userIds);
        
        // Invalidate queries to get fresh data
        queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
        
        return result;
      } catch (error) {
        // Rollback all optimistic updates on error
        contexts.forEach(rollbackOptimisticUpdate);
        throw error;
      }
    },
    onSuccess: (data, userIds) => {
      // Remove users from cache
      userIds.forEach(userId => {
        queryClient.removeQueries({ queryKey: queryKeys.users.detail(userId) });
      });
      
      console.log(`Successfully deleted ${userIds.length} users`);
    },
    onError: (error) => {
      console.error('Failed to bulk delete users:', error);
    },
  });

  const bulkUpdate = useMutation({
    mutationFn: async ({ userIds, updateData }: { userIds: string[]; updateData: any }) => {
      // Perform optimistic updates for all users
      const contexts = await Promise.all(
        userIds.map(userId => 
          optimisticUpdateUser(queryClient, userId, updateData, filters)
        )
      );

      try {
        // Execute bulk update API call
        const result = await ApiService.bulkUpdateUsers(userIds, updateData);
        
        // Invalidate queries to get fresh data
        queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
        
        return result;
      } catch (error) {
        // Rollback all optimistic updates on error
        contexts.flat().forEach(rollbackOptimisticUpdate);
        throw error;
      }
    },
    onSuccess: (data, { userIds }) => {
      // Invalidate specific user queries
      userIds.forEach(userId => {
        queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
      });
      
      console.log(`Successfully updated ${userIds.length} users`);
    },
    onError: (error) => {
      console.error('Failed to bulk update users:', error);
    },
  });

  return {
    bulkDelete,
    bulkUpdate,
  };
};

export const useOptimisticUserStatusToggle = (filters: any = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: withOptimisticUpdate(
      ({ userId, status }: { userId: string; status: 'active' | 'inactive' }) =>
        ApiService.updateUserStatus(userId, status),
      async ({ userId, status }: { userId: string; status: 'active' | 'inactive' }) => {
        const optimisticData = {
          status,
          updatedAt: new Date().toISOString(),
        };

        return optimisticUpdateUser(queryClient, userId, optimisticData, filters);
      }
    ),
    onSuccess: (data, { userId, status }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
      console.log(`User status changed to ${status}`);
    },
    onError: (error, variables, context) => {
      console.error('Failed to update user status:', error);
    },
  });
};

export const useOptimisticUserRoleChange = (filters: any = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: withOptimisticUpdate(
      ({ userId, role }: { userId: string; role: string }) =>
        ApiService.updateUserRole(userId, role),
      async ({ userId, role }: { userId: string; role: string }) => {
        const optimisticData = {
          role,
          updatedAt: new Date().toISOString(),
        };

        return optimisticUpdateUser(queryClient, userId, optimisticData, filters);
      }
    ),
    onSuccess: (data, { userId, role }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      console.log(`User role changed to ${role}`);
    },
    onError: (error, variables, context) => {
      console.error('Failed to update user role:', error);
    },
  });
};

/**
 * Combined hook that provides all optimistic user operations
 */
export const useOptimisticUserOperations = (filters: any = {}) => {
  const createUser = useOptimisticCreateUser(filters);
  const updateUser = useOptimisticUpdateUser(filters);
  const deleteUser = useOptimisticDeleteUser(filters);
  const bulkOperations = useOptimisticBulkUserActions(filters);
  const toggleStatus = useOptimisticUserStatusToggle(filters);
  const changeRole = useOptimisticUserRoleChange(filters);

  return {
    // Single user operations
    createUser,
    updateUser,
    deleteUser,
    toggleStatus,
    changeRole,
    
    // Bulk operations
    bulkDelete: bulkOperations.bulkDelete,
    bulkUpdate: bulkOperations.bulkUpdate,
    
    // Loading states
    isCreating: createUser.isPending,
    isUpdating: updateUser.isPending,
    isDeleting: deleteUser.isPending,
    isBulkDeleting: bulkOperations.bulkDelete.isPending,
    isBulkUpdating: bulkOperations.bulkUpdate.isPending,
    isTogglingStatus: toggleStatus.isPending,
    isChangingRole: changeRole.isPending,
    
    // Error states
    createError: createUser.error,
    updateError: updateUser.error,
    deleteError: deleteUser.error,
    bulkDeleteError: bulkOperations.bulkDelete.error,
    bulkUpdateError: bulkOperations.bulkUpdate.error,
    statusToggleError: toggleStatus.error,
    roleChangeError: changeRole.error,
    
    // Success states
    createSuccess: createUser.isSuccess,
    updateSuccess: updateUser.isSuccess,
    deleteSuccess: deleteUser.isSuccess,
    bulkDeleteSuccess: bulkOperations.bulkDelete.isSuccess,
    bulkUpdateSuccess: bulkOperations.bulkUpdate.isSuccess,
    statusToggleSuccess: toggleStatus.isSuccess,
    roleChangeSuccess: changeRole.isSuccess,
  };
};
