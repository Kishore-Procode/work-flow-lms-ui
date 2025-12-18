import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './react-query';
import { ApiService } from '../services/api';

/**
 * Prefetching utilities for Student-ACT LMS
 * These functions prefetch data that users are likely to need,
 * improving perceived performance and user experience.
 */

/**
 * Prefetch dashboard data based on user role
 */
export const prefetchDashboardData = async (
  queryClient: QueryClient,
  userRole: string,
  userId?: string
) => {
  const prefetchPromises: Promise<void>[] = [];

  // Common data that all roles need
  prefetchPromises.push(
    queryClient.prefetchQuery({
      queryKey: queryKeys.dashboard.recentActivity(userRole),
      queryFn: () => ApiService.getRecentActivity(),
      staleTime: 1000 * 60 * 2, // 2 minutes
    })
  );

  // Role-specific prefetching
  switch (userRole) {
    case 'admin':
      // Prefetch admin dashboard data
      prefetchPromises.push(
        queryClient.prefetchQuery({
          queryKey: queryKeys.dashboard.adminStats(),
          queryFn: () => ApiService.getAdminDashboardStats(),
          staleTime: 1000 * 60 * 3,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.dashboard.collegeRanking(),
          queryFn: () => ApiService.getAdminCollegeRanking(),
          staleTime: 1000 * 60 * 5,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.dashboard.states,
          queryFn: () => ApiService.getAdminStates(),
          staleTime: 1000 * 60 * 10,
        })
      );
      break;

    case 'principal':
      prefetchPromises.push(
        queryClient.prefetchQuery({
          queryKey: queryKeys.dashboard.roleBasedStats(userRole),
          queryFn: () => ApiService.getPrincipalDashboardData(),
          staleTime: 1000 * 60 * 3,
        })
      );
      break;

    case 'hod':
      prefetchPromises.push(
        queryClient.prefetchQuery({
          queryKey: queryKeys.dashboard.roleBasedStats(userRole),
          queryFn: () => ApiService.getHODDashboardData(),
          staleTime: 1000 * 60 * 3,
        })
      );
      break;

    case 'faculty':
      prefetchPromises.push(
        queryClient.prefetchQuery({
          queryKey: queryKeys.dashboard.roleBasedStats(userRole),
          queryFn: () => ApiService.getStaffDashboardData(),
          staleTime: 1000 * 60 * 3,
        })
      );
      break;

    case 'student':
      if (userId) {
        prefetchPromises.push(
          queryClient.prefetchQuery({
            queryKey: queryKeys.trees.list({ assignedStudentId: userId }),
            queryFn: () => ApiService.getLearningResources({ assignedStudentId: userId }),
            staleTime: 1000 * 60 * 5,
          }),
          queryClient.prefetchQuery({
            queryKey: queryKeys.dashboard.roleBasedStats(userRole),
            queryFn: () => ApiService.getStudentDashboardData(),
            staleTime: 1000 * 60 * 3,
          })
        );
      }
      break;
  }

  // Wait for all prefetch operations to complete
  await Promise.allSettled(prefetchPromises);
};

/**
 * Prefetch user management data
 */
export const prefetchUserManagement = async (
  queryClient: QueryClient,
  userRole: string,
  collegeId?: string,
  departmentId?: string
) => {
  const prefetchPromises: Promise<void>[] = [];

  // Prefetch users list
  prefetchPromises.push(
    queryClient.prefetchQuery({
      queryKey: queryKeys.users.list({}),
      queryFn: () => ApiService.getUsers(),
      staleTime: 1000 * 60 * 5,
    })
  );

  // Prefetch colleges and departments
  prefetchPromises.push(
    queryClient.prefetchQuery({
      queryKey: queryKeys.colleges.all,
      queryFn: () => ApiService.getColleges(),
      staleTime: 1000 * 60 * 10,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.departments.all,
      queryFn: () => ApiService.getDepartments(),
      staleTime: 1000 * 60 * 10,
    })
  );

  // Role-specific prefetching
  if (userRole === 'admin') {
    prefetchPromises.push(
      queryClient.prefetchQuery({
        queryKey: queryKeys.invitations.all,
        queryFn: () => ApiService.getInvitations(),
        staleTime: 1000 * 60 * 3,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.registrationRequests.all,
        queryFn: () => ApiService.getRegistrationRequests(),
        staleTime: 1000 * 60 * 3,
      })
    );
  }

  await Promise.allSettled(prefetchPromises);
};

/**
 * Prefetch learning resources data
 */
export const prefetchLearningResources = async (
  queryClient: QueryClient,
  filters: any = {}
) => {
  const prefetchPromises: Promise<void>[] = [];

  // Prefetch learning resources
  prefetchPromises.push(
    queryClient.prefetchQuery({
      queryKey: queryKeys.trees.list(filters),
      queryFn: () => ApiService.getLearningResources(filters),
      staleTime: 1000 * 60 * 5,
    })
  );

  // Prefetch related data
  prefetchPromises.push(
    queryClient.prefetchQuery({
      queryKey: queryKeys.colleges.all,
      queryFn: () => ApiService.getColleges(),
      staleTime: 1000 * 60 * 10,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.departments.all,
      queryFn: () => ApiService.getDepartments(),
      staleTime: 1000 * 60 * 10,
    })
  );

  await Promise.allSettled(prefetchPromises);
};

/**
 * Prefetch navigation-related data
 * This is called when user hovers over navigation items
 */
export const prefetchNavigationData = async (
  queryClient: QueryClient,
  route: string,
  userRole: string,
  userId?: string
) => {
  switch (route) {
    case 'users':
      await prefetchUserManagement(queryClient, userRole);
      break;

    case 'learning-resources':
      await prefetchLearningResources(queryClient);
      break;

    case 'dashboard':
      await prefetchDashboardData(queryClient, userRole, userId);
      break;

    case 'colleges':
      await queryClient.prefetchQuery({
        queryKey: queryKeys.colleges.all,
        queryFn: () => ApiService.getColleges(),
        staleTime: 1000 * 60 * 10,
      });
      break;

    case 'departments':
      await queryClient.prefetchQuery({
        queryKey: queryKeys.departments.all,
        queryFn: () => ApiService.getDepartments(),
        staleTime: 1000 * 60 * 10,
      });
      break;

    default:
      // No prefetching for unknown routes
      break;
  }
};

/**
 * Prefetch data on app initialization
 */
export const prefetchInitialData = async (
  queryClient: QueryClient,
  userRole: string,
  userId?: string,
  collegeId?: string,
  departmentId?: string
) => {
  const prefetchPromises: Promise<void>[] = [];

  // Always prefetch dashboard data
  prefetchPromises.push(
    prefetchDashboardData(queryClient, userRole, userId)
  );

  // Prefetch common reference data
  prefetchPromises.push(
    queryClient.prefetchQuery({
      queryKey: queryKeys.colleges.all,
      queryFn: () => ApiService.getColleges(),
      staleTime: 1000 * 60 * 15, // 15 minutes for reference data
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.departments.all,
      queryFn: () => ApiService.getDepartments(),
      staleTime: 1000 * 60 * 15,
    })
  );

  // Role-specific initial prefetching
  if (['admin', 'principal', 'hod'].includes(userRole)) {
    prefetchPromises.push(
      prefetchUserManagement(queryClient, userRole, collegeId, departmentId)
    );
  }

  if (userRole === 'student' && userId) {
    prefetchPromises.push(
      prefetchLearningResources(queryClient, { assignedStudentId: userId })
    );
  }

  await Promise.allSettled(prefetchPromises);
};

/**
 * Background refresh utility
 * Refreshes stale data in the background without affecting UI
 */
export const backgroundRefresh = async (
  queryClient: QueryClient,
  userRole: string
) => {
  // Invalidate and refetch dashboard data
  await queryClient.invalidateQueries({
    queryKey: queryKeys.dashboard.all,
    refetchType: 'none', // Don't refetch immediately
  });

  // Refetch in background
  queryClient.refetchQueries({
    queryKey: queryKeys.dashboard.all,
    type: 'active',
  });

  // Role-specific background refresh
  switch (userRole) {
    case 'admin':
      queryClient.refetchQueries({
        queryKey: queryKeys.users.all,
        type: 'active',
      });
      queryClient.refetchQueries({
        queryKey: queryKeys.invitations.all,
        type: 'active',
      });
      break;

    case 'student':
      queryClient.refetchQueries({
        queryKey: queryKeys.trees.all,
        type: 'active',
      });
      break;
  }
};
