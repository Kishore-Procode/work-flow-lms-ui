import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../../services/api';
import { queryKeys } from '../../lib/react-query';
import { useAuth } from '../useAuth';
import {
  AdminDashboardData,
  AdminDashboardStats,
  CollegeData,
  State,
  District,
  DashboardStats,
  RecentActivity,
  DepartmentData,
  StudentWithMissingUpload,
} from '../../types/dashboard';

// Types for API responses
interface ApiError {
  message: string;
  status?: number;
}

interface DashboardFilters {
  stateId?: string;
  districtId?: string;
}

// ===== ADMIN DASHBOARD HOOKS =====

/**
 * Hook to fetch admin dashboard states
 */
export const useAdminStates = () => {
  return useQuery<State[], ApiError>({
    queryKey: queryKeys.dashboard.states,
    queryFn: async (): Promise<State[]> => {
      const response = await ApiService.getAdminStates();
      return response.data || [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

/**
 * Hook to fetch admin dashboard districts by state
 */
export const useAdminDistricts = (stateId?: string) => {
  return useQuery<District[], ApiError>({
    queryKey: queryKeys.dashboard.districts(stateId),
    queryFn: async (): Promise<District[]> => {
      if (!stateId) return [];
      const response = await ApiService.getAdminDistricts(stateId);
      return response.data || [];
    },
    enabled: !!stateId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

/**
 * Hook to fetch admin dashboard college ranking data
 */
export const useAdminCollegeRanking = (filters: DashboardFilters = {}) => {
  return useQuery<AdminDashboardData, ApiError>({
    queryKey: queryKeys.dashboard.collegeRanking(filters),
    queryFn: async (): Promise<AdminDashboardData> => {
      const response = await ApiService.getAdminCollegeRanking(filters);
      return response.data || { stats: {}, colleges: [], filters: {}, lastUpdated: '' };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
};

/**
 * Hook to fetch admin dashboard statistics
 */
export const useAdminDashboardStats = (filters: DashboardFilters = {}) => {
  return useQuery<AdminDashboardStats, ApiError>({
    queryKey: queryKeys.dashboard.adminStats(filters),
    queryFn: async (): Promise<AdminDashboardStats> => {
      const response = await ApiService.getAdminDashboardStats(filters);
      return response.data || {
        totalColleges: 0,
        totalStudents: 0,
        totalresourcesAssigned: 0,
        totalDepartments: 0,
        averageParticipationRate: 0,
        topPerformingCollege: null,
        recentActivity: [],
      };
    },
    staleTime: 1000 * 60 * 3, // 3 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

// ===== ROLE-BASED DASHBOARD HOOKS =====

/**
 * Hook to fetch dashboard data based on user role
 */
export const useDashboardData = () => {
  const { user } = useAuth();

  return useQuery<DashboardStats, ApiError>({
    queryKey: queryKeys.dashboard.roleBasedStats(user?.role),
    queryFn: async (): Promise<DashboardStats> => {
      let response;
      
      switch (user?.role) {
        case 'admin':
          response = await ApiService.getAdminDashboardStats();
          break;
        case 'principal':
          response = await ApiService.getPrincipalDashboardData();
          break;
        case 'hod':
          response = await ApiService.getHODDashboardData();
          break;
        case 'faculty':
          response = await ApiService.getStaffDashboardData();
          break;
        case 'student':
          response = await ApiService.getStudentDashboardData();
          break;
        default:
          throw new Error('Invalid user role');
      }

      return response.data || {
        totalUsers: 0,
        totalColleges: 0,
        totalDepartments: 0,
        totalResources: 0,
        totalStaff: 0,
        totalStudents: 0,
        pendingInvitations: 0,
        pendingRequests: 0,
        activeUsers: 0,
        departmentStaff: 0,
        departmentStudents: 0,
        activeClasses: 0,
        assignedResources: 0,
        availableResources: 0,
        participationRate: 0,
      };
    },
    enabled: !!user?.role,
    staleTime: 1000 * 60 * 3, // 3 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

/**
 * Hook to fetch recent activity data
 */
export const useRecentActivity = () => {
  const { user } = useAuth();

  return useQuery<RecentActivity[], ApiError>({
    queryKey: queryKeys.dashboard.recentActivity(user?.role),
    queryFn: async (): Promise<RecentActivity[]> => {
      const response = await ApiService.getRecentActivity();
      return response.data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

/**
 * Hook to fetch department performance data
 */
export const useDepartmentPerformance = () => {
  const { user } = useAuth();

  return useQuery<DepartmentData[], ApiError>({
    queryKey: queryKeys.dashboard.departmentPerformance(user?.collegeId),
    queryFn: async (): Promise<DepartmentData[]> => {
      const response = await ApiService.getDepartmentPerformance();
      return response.data || [];
    },
    enabled: !!user?.collegeId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
};

/**
 * Hook to fetch students with missing uploads
 */
export const useStudentsWithMissingUploads = () => {
  const { user } = useAuth();

  return useQuery<StudentWithMissingUpload[], ApiError>({
    queryKey: queryKeys.dashboard.missingUploads(user?.departmentId),
    queryFn: async (): Promise<StudentWithMissingUpload[]> => {
      const response = await ApiService.getStudentsWithMissingUploads();
      return response.data || [];
    },
    enabled: !!user && ['hod', 'faculty'].includes(user.role),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
};

// ===== DASHBOARD MUTATIONS =====

/**
 * Hook to refresh dashboard data
 */
export const useRefreshDashboard = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      // Invalidate all dashboard-related queries
      await queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.all,
      });
    },
    onSuccess: () => {
      console.log('Dashboard data refreshed successfully');
    },
    onError: (error: ApiError) => {
      console.error('Failed to refresh dashboard data:', error);
    },
  });
};

// ===== COMBINED DASHBOARD HOOK =====

/**
 * Comprehensive dashboard hook that provides all dashboard data and actions
 */
export const useComprehensiveDashboard = (filters: DashboardFilters = {}) => {
  const { user } = useAuth();
  
  // Queries
  const statesQuery = useAdminStates();
  const districtsQuery = useAdminDistricts(filters.stateId);
  const collegeRankingQuery = useAdminCollegeRanking(filters);
  const adminStatsQuery = useAdminDashboardStats(filters);
  const dashboardDataQuery = useDashboardData();
  const recentActivityQuery = useRecentActivity();
  const departmentPerformanceQuery = useDepartmentPerformance();
  const missingUploadsQuery = useStudentsWithMissingUploads();
  
  // Mutations
  const refreshMutation = useRefreshDashboard();

  // Computed loading states
  const isLoading = 
    statesQuery.isLoading ||
    districtsQuery.isLoading ||
    collegeRankingQuery.isLoading ||
    adminStatsQuery.isLoading ||
    dashboardDataQuery.isLoading ||
    recentActivityQuery.isLoading ||
    departmentPerformanceQuery.isLoading ||
    missingUploadsQuery.isLoading;

  // Computed error state
  const error = 
    statesQuery.error ||
    districtsQuery.error ||
    collegeRankingQuery.error ||
    adminStatsQuery.error ||
    dashboardDataQuery.error ||
    recentActivityQuery.error ||
    departmentPerformanceQuery.error ||
    missingUploadsQuery.error;

  return {
    // Data
    states: statesQuery.data || [],
    districts: districtsQuery.data || [],
    collegeRanking: collegeRankingQuery.data || [],
    adminStats: adminStatsQuery.data,
    dashboardData: dashboardDataQuery.data,
    recentActivity: recentActivityQuery.data || [],
    departmentPerformance: departmentPerformanceQuery.data || [],
    studentsWithMissingUploads: missingUploadsQuery.data || [],
    
    // Loading states
    isLoading,
    statesLoading: statesQuery.isLoading,
    districtsLoading: districtsQuery.isLoading,
    collegeRankingLoading: collegeRankingQuery.isLoading,
    adminStatsLoading: adminStatsQuery.isLoading,
    dashboardDataLoading: dashboardDataQuery.isLoading,
    recentActivityLoading: recentActivityQuery.isLoading,
    departmentPerformanceLoading: departmentPerformanceQuery.isLoading,
    missingUploadsLoading: missingUploadsQuery.isLoading,
    
    // Error states
    error,
    statesError: statesQuery.error,
    districtsError: districtsQuery.error,
    collegeRankingError: collegeRankingQuery.error,
    adminStatsError: adminStatsQuery.error,
    dashboardDataError: dashboardDataQuery.error,
    recentActivityError: recentActivityQuery.error,
    departmentPerformanceError: departmentPerformanceQuery.error,
    missingUploadsError: missingUploadsQuery.error,
    
    // Actions
    refresh: refreshMutation.mutate,
    refreshAsync: refreshMutation.mutateAsync,
    isRefreshing: refreshMutation.isPending,
    
    // Query objects for advanced usage
    queries: {
      states: statesQuery,
      districts: districtsQuery,
      collegeRanking: collegeRankingQuery,
      adminStats: adminStatsQuery,
      dashboardData: dashboardDataQuery,
      recentActivity: recentActivityQuery,
      departmentPerformance: departmentPerformanceQuery,
      missingUploads: missingUploadsQuery,
    },
  };
};
