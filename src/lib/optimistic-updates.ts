import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './react-query';

/**
 * Optimistic update utilities for Student-ACT LMS
 * These functions provide immediate UI feedback while API calls are in progress,
 * improving perceived performance and user experience.
 */

export interface OptimisticUpdateContext {
  queryClient: QueryClient;
  queryKey: any[];
  rollbackData?: any;
}

/**
 * Generic optimistic update function
 */
export const performOptimisticUpdate = async <T>(
  queryClient: QueryClient,
  queryKey: any[],
  updater: (oldData: T | undefined) => T,
  rollbackOnError: boolean = true
): Promise<OptimisticUpdateContext> => {
  // Cancel any outgoing refetches
  await queryClient.cancelQueries({ queryKey });

  // Snapshot the previous value
  const previousData = queryClient.getQueryData<T>(queryKey);

  // Optimistically update to the new value
  queryClient.setQueryData<T>(queryKey, updater);

  return {
    queryClient,
    queryKey,
    rollbackData: rollbackOnError ? previousData : undefined,
  };
};

/**
 * Rollback optimistic update on error
 */
export const rollbackOptimisticUpdate = (context: OptimisticUpdateContext) => {
  if (context.rollbackData !== undefined) {
    context.queryClient.setQueryData(context.queryKey, context.rollbackData);
  }
};

/**
 * Optimistic user creation
 */
export const optimisticCreateUser = async (
  queryClient: QueryClient,
  newUser: any,
  filters: any = {}
) => {
  const queryKey = queryKeys.users.list(filters);
  
  return performOptimisticUpdate(
    queryClient,
    queryKey,
    (oldData: any) => {
      if (!oldData) return { data: [newUser], pagination: { total: 1 } };
      
      return {
        ...oldData,
        data: [newUser, ...oldData.data],
        pagination: {
          ...oldData.pagination,
          total: oldData.pagination.total + 1,
        },
      };
    }
  );
};

/**
 * Optimistic user update
 */
export const optimisticUpdateUser = async (
  queryClient: QueryClient,
  userId: string,
  updatedUser: any,
  filters: any = {}
) => {
  const listQueryKey = queryKeys.users.list(filters);
  const detailQueryKey = queryKeys.users.detail(userId);
  
  // Update user in list
  const listContext = await performOptimisticUpdate(
    queryClient,
    listQueryKey,
    (oldData: any) => {
      if (!oldData?.data) return oldData;
      
      return {
        ...oldData,
        data: oldData.data.map((user: any) =>
          user.id === userId ? { ...user, ...updatedUser } : user
        ),
      };
    }
  );

  // Update user detail
  const detailContext = await performOptimisticUpdate(
    queryClient,
    detailQueryKey,
    (oldData: any) => {
      if (!oldData) return updatedUser;
      return { ...oldData, ...updatedUser };
    }
  );

  return [listContext, detailContext];
};

/**
 * Optimistic user deletion
 */
export const optimisticDeleteUser = async (
  queryClient: QueryClient,
  userId: string,
  filters: any = {}
) => {
  const queryKey = queryKeys.users.list(filters);
  
  return performOptimisticUpdate(
    queryClient,
    queryKey,
    (oldData: any) => {
      if (!oldData?.data) return oldData;
      
      return {
        ...oldData,
        data: oldData.data.filter((user: any) => user.id !== userId),
        pagination: {
          ...oldData.pagination,
          total: Math.max(0, oldData.pagination.total - 1),
        },
      };
    }
  );
};

/**
 * Optimistic learning resource assignment
 */
export const optimisticAssignLearningResource = async (
  queryClient: QueryClient,
  resourceId: string,
  studentId: string,
  assignmentData: any
) => {
  const resourceQueryKey = queryKeys.trees.detail(resourceId);
  const studentResourcesKey = queryKeys.trees.list({ assignedStudentId: studentId });
  
  // Update resource assignment count
  const resourceContext = await performOptimisticUpdate(
    queryClient,
    resourceQueryKey,
    (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        assignedCount: (oldData.assignedCount || 0) + 1,
        isAssigned: true,
      };
    }
  );

  // Add to student's assigned resources
  const studentContext = await performOptimisticUpdate(
    queryClient,
    studentResourcesKey,
    (oldData: any) => {
      if (!oldData) return { data: [assignmentData] };
      
      return {
        ...oldData,
        data: [assignmentData, ...oldData.data],
      };
    }
  );

  return [resourceContext, studentContext];
};

/**
 * Optimistic learning resource progress update
 */
export const optimisticUpdateProgress = async (
  queryClient: QueryClient,
  resourceId: string,
  studentId: string,
  progressData: any
) => {
  const studentResourcesKey = queryKeys.trees.list({ assignedStudentId: studentId });
  
  return performOptimisticUpdate(
    queryClient,
    studentResourcesKey,
    (oldData: any) => {
      if (!oldData?.data) return oldData;
      
      return {
        ...oldData,
        data: oldData.data.map((resource: any) =>
          resource.id === resourceId || resource.resourceId === resourceId
            ? { ...resource, ...progressData }
            : resource
        ),
      };
    }
  );
};

/**
 * Optimistic college creation
 */
export const optimisticCreateCollege = async (
  queryClient: QueryClient,
  newCollege: any
) => {
  const queryKey = queryKeys.colleges.all;
  
  return performOptimisticUpdate(
    queryClient,
    queryKey,
    (oldData: any) => {
      if (!oldData) return { data: [newCollege] };
      return {
        ...oldData,
        data: [newCollege, ...oldData.data],
      };
    }
  );
};

/**
 * Optimistic department creation
 */
export const optimisticCreateDepartment = async (
  queryClient: QueryClient,
  newDepartment: any
) => {
  const queryKey = queryKeys.departments.all;
  
  return performOptimisticUpdate(
    queryClient,
    queryKey,
    (oldData: any) => {
      if (!oldData) return { data: [newDepartment] };
      return {
        ...oldData,
        data: [newDepartment, ...oldData.data],
      };
    }
  );
};

/**
 * Optimistic invitation status update
 */
export const optimisticUpdateInvitationStatus = async (
  queryClient: QueryClient,
  invitationId: string,
  status: string
) => {
  const queryKey = queryKeys.invitations.all;
  
  return performOptimisticUpdate(
    queryClient,
    queryKey,
    (oldData: any) => {
      if (!oldData?.data) return oldData;
      
      return {
        ...oldData,
        data: oldData.data.map((invitation: any) =>
          invitation.id === invitationId
            ? { ...invitation, status, updatedAt: new Date().toISOString() }
            : invitation
        ),
      };
    }
  );
};

/**
 * Optimistic dashboard stats update
 */
export const optimisticUpdateDashboardStats = async (
  queryClient: QueryClient,
  userRole: string,
  statUpdates: any
) => {
  const queryKey = queryKeys.dashboard.roleBasedStats(userRole);
  
  return performOptimisticUpdate(
    queryClient,
    queryKey,
    (oldData: any) => {
      if (!oldData) return statUpdates;
      return { ...oldData, ...statUpdates };
    }
  );
};

/**
 * Batch optimistic updates
 * Useful when multiple related updates need to happen together
 */
export const batchOptimisticUpdates = async (
  updates: Array<() => Promise<OptimisticUpdateContext | OptimisticUpdateContext[]>>
): Promise<OptimisticUpdateContext[]> => {
  const contexts: OptimisticUpdateContext[] = [];
  
  for (const update of updates) {
    try {
      const result = await update();
      if (Array.isArray(result)) {
        contexts.push(...result);
      } else {
        contexts.push(result);
      }
    } catch (error) {
      // Rollback all previous updates on error
      contexts.forEach(rollbackOptimisticUpdate);
      throw error;
    }
  }
  
  return contexts;
};

/**
 * Smart optimistic update with automatic rollback
 * Wraps mutation with optimistic updates and handles rollback on error
 */
export const withOptimisticUpdate = <TData, TError, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  optimisticUpdateFn: (variables: TVariables) => Promise<OptimisticUpdateContext | OptimisticUpdateContext[]>
) => {
  return async (variables: TVariables): Promise<TData> => {
    let contexts: OptimisticUpdateContext[] = [];
    
    try {
      // Perform optimistic update
      const result = await optimisticUpdateFn(variables);
      contexts = Array.isArray(result) ? result : [result];
      
      // Execute actual mutation
      const data = await mutationFn(variables);
      
      // Invalidate queries to ensure fresh data
      contexts.forEach(context => {
        context.queryClient.invalidateQueries({ queryKey: context.queryKey });
      });
      
      return data;
    } catch (error) {
      // Rollback optimistic updates on error
      contexts.forEach(rollbackOptimisticUpdate);
      throw error;
    }
  };
};
