/**
 * React Query (TanStack Query) configuration and setup
 * 
 * This file contains the QueryClient configuration with enterprise-level
 * settings for caching, error handling, and retry logic.
 * 
 * @author Student-ACT LMS Team
 * @version 1.0.0
 */

import { QueryClient, DefaultOptions } from '@tanstack/react-query';

/**
 * Default query options for all queries
 * Following MNC enterprise standards for reliability and performance
 */
const queryConfig: DefaultOptions = {
  queries: {
    // Cache data for 5 minutes by default
    staleTime: 1000 * 60 * 5,

    // Keep data in cache for 10 minutes after component unmount
    gcTime: 1000 * 60 * 10,

    // Retry failed requests 3 times with exponential backoff
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },

    // Retry delay with exponential backoff
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Don't refetch on window focus - prevents video interruption
    refetchOnWindowFocus: false,

    // Refetch on reconnect after network issues
    refetchOnReconnect: true,

    // Don't refetch on mount if data exists - prevents unnecessary requests
    refetchOnMount: false,

    // Disable background refetching by default
    refetchInterval: false, // Can be enabled per query as needed

    // Network mode - online only by default
    networkMode: 'online',
  },
  mutations: {
    // Retry mutations once on failure
    retry: 1,
    
    // Retry delay for mutations
    retryDelay: 1000,
    
    // Network mode for mutations
    networkMode: 'online',
  },
};

/**
 * Create and configure the QueryClient instance
 * 
 * @returns {QueryClient} Configured QueryClient instance
 */
export const createQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: queryConfig,
    logger: {
      log: console.log,
      warn: console.warn,
      error: (error) => {
        // In production, you might want to send errors to a logging service
        console.error('React Query Error:', error);
      },
    },
  });
};

/**
 * Global QueryClient instance
 * Use this instance throughout the application
 */
export const queryClient = createQueryClient();

/**
 * Query key factory for consistent key management
 * This ensures proper cache invalidation and prevents key conflicts
 */
export const queryKeys = {
  // Authentication
  auth: {
    user: ['auth', 'user'] as const,
    login: ['auth', 'login'] as const,
  },
  
  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.users.lists(), { filters }] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    byDepartment: (departmentId: string) => [...queryKeys.users.all, 'department', departmentId] as const,
    byCollege: (collegeId: string) => [...queryKeys.users.all, 'college', collegeId] as const,
  },
  
  // Invitations
  invitations: {
    all: ['invitations'] as const,
    lists: () => [...queryKeys.invitations.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.invitations.lists(), { filters }] as const,
    details: () => [...queryKeys.invitations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.invitations.details(), id] as const,
    validate: (token: string) => [...queryKeys.invitations.all, 'validate', token] as const,
  },
  
  // Colleges
  colleges: {
    all: ['colleges'] as const,
    lists: () => [...queryKeys.colleges.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.colleges.lists(), { filters }] as const,
    details: () => [...queryKeys.colleges.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.colleges.details(), id] as const,
  },
  
  // Departments
  departments: {
    all: ['departments'] as const,
    lists: () => [...queryKeys.departments.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.departments.lists(), { filters }] as const,
    details: () => [...queryKeys.departments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.departments.details(), id] as const,
    byCollege: (collegeId: string) => [...queryKeys.departments.all, 'college', collegeId] as const,
  },
  
  // Trees
  trees: {
    all: ['trees'] as const,
    lists: () => [...queryKeys.trees.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.trees.lists(), { filters }] as const,
    details: () => [...queryKeys.trees.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.trees.details(), id] as const,
    byStudent: (studentId: string) => [...queryKeys.trees.all, 'student', studentId] as const,
    images: (treeId: string) => [...queryKeys.trees.detail(treeId), 'images'] as const,
  },
  
  // Tree Selection
  treeSelection: {
    all: ['tree-selection'] as const,
    mySelection: ['tree-selection', 'my-selection'] as const,
    available: ['tree-selection', 'available'] as const,
  },
  
  // Registration Requests
  registrationRequests: {
    all: ['registration-requests'] as const,
    lists: () => [...queryKeys.registrationRequests.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.registrationRequests.lists(), { filters }] as const,
    details: () => [...queryKeys.registrationRequests.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.registrationRequests.details(), id] as const,
  },
  
  // Content Management
  content: {
    guidelines: ['content', 'guidelines'] as const,
    resources: ['content', 'resources'] as const,
  },
  
  // Dashboard Data
  dashboard: {
    all: ['dashboard'] as const,
    stats: ['dashboard', 'stats'] as const,
    activity: ['dashboard', 'activity'] as const,

    // Admin dashboard specific
    states: ['dashboard', 'admin', 'states'] as const,
    districts: (stateId?: string) => ['dashboard', 'admin', 'districts', stateId] as const,
    collegeRanking: (filters?: any) => ['dashboard', 'admin', 'college-ranking', filters] as const,
    adminStats: (filters?: any) => ['dashboard', 'admin', 'stats', filters] as const,

    // Role-based dashboard
    roleBasedStats: (role?: string) => ['dashboard', 'role-stats', role] as const,
    recentActivity: (role?: string) => ['dashboard', 'recent-activity', role] as const,
    departmentPerformance: (collegeId?: string) => ['dashboard', 'department-performance', collegeId] as const,
    missingUploads: (departmentId?: string) => ['dashboard', 'missing-uploads', departmentId] as const,
  },

  // Content Mapping
  contentMapping: {
    all: ['content-mapping'] as const,
    dropdownData: (params?: any) => [...queryKeys.contentMapping.all, 'dropdown-data', params] as const,
    semesters: (masterId: string) => [...queryKeys.contentMapping.all, 'semesters', masterId] as const,
    subjects: (semesterDetailsId: string) => [...queryKeys.contentMapping.all, 'subjects', semesterDetailsId] as const,
    learningResources: () => [...queryKeys.contentMapping.all, 'learning-resources'] as const,
  },
} as const;

/**
 * Utility function to invalidate related queries
 * Use this after mutations to ensure data consistency
 * 
 * @param queryClient - The QueryClient instance
 * @param keys - Array of query keys to invalidate
 */
export const invalidateQueries = async (
  queryClient: QueryClient,
  keys: readonly (readonly unknown[])[]
): Promise<void> => {
  await Promise.all(
    keys.map((key) => queryClient.invalidateQueries({ queryKey: key }))
  );
};

/**
 * Utility function to remove queries from cache
 * Use this for cleanup or when data should be completely refreshed
 * 
 * @param queryClient - The QueryClient instance
 * @param keys - Array of query keys to remove
 */
export const removeQueries = (
  queryClient: QueryClient,
  keys: readonly (readonly unknown[])[]
): void => {
  keys.forEach((key) => {
    queryClient.removeQueries({ queryKey: key });
  });
};
