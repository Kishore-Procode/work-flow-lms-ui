/**
 * Authentication React Query Hooks
 * 
 * This file contains React Query hooks for authentication operations
 * following MNC enterprise standards for error handling and type safety.
 * 
 * @author Student - ACT Team
 * @version 1.0.0
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../../services/api';
import { queryKeys, invalidateQueries } from '../../lib/react-query';
import type {
  LoginRequest,
  LoginResponse,
  AuthUser,
  ApiResponse,
  ApiError,
} from '../../types/api';

/**
 * Hook for user login mutation
 * 
 * @returns {Object} Mutation object with login function and state
 * 
 * @example
 * ```tsx
 * const loginMutation = useLogin();
 * 
 * const handleLogin = async (credentials: LoginRequest) => {
 *   try {
 *     const result = await loginMutation.mutateAsync(credentials);
 *     console.log('Login successful:', result.user);
 *   } catch (error) {
 *     console.error('Login failed:', error);
 *   }
 * };
 * ```
 */
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<LoginResponse>, ApiError, LoginRequest>({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await ApiService.login(credentials.email, credentials.password,credentials.selectedRole);
      return response;
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        // Store user data in cache
        queryClient.setQueryData(queryKeys.auth.user, data.data.user);
        
        // Store auth token
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.data.user));
        
        // Invalidate and refetch user-related queries
        invalidateQueries(queryClient, [
          queryKeys.auth.user,
          queryKeys.dashboard.all,
        ]);
      }
    },
    onError: (error) => {
      // Clear any existing auth data on login failure
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      queryClient.removeQueries({ queryKey: queryKeys.auth.user });
      
      console.error('Login failed:', error);
    },
    retry: false, // Don't retry login attempts
  });
};

/**
 * Hook for user logout mutation
 * 
 * @returns {Object} Mutation object with logout function and state
 * 
 * @example
 * ```tsx
 * const logoutMutation = useLogout();
 * 
 * const handleLogout = () => {
 *   logoutMutation.mutate();
 * };
 * ```
 */
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      // Call logout API if available
      try {
        await ApiService.logout?.();
      } catch (error) {
        // Ignore logout API errors, still clear local data
        console.warn('Logout API call failed, but continuing with local cleanup:', error);
      }
    },
    onSuccess: () => {
      // Clear all auth-related data
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      
      // Clear all cached data
      queryClient.clear();
      
      // Redirect to login page
      window.location.href = '/';
    },
    onError: (error) => {
      console.error('Logout failed:', error);
      
      // Even if logout fails, clear local data
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      queryClient.clear();
      window.location.href = '/';
    },
  });
};

/**
 * Hook to get current authenticated user
 * 
 * @returns {Object} Query object with current user data and state
 * 
 * @example
 * ```tsx
 * const { data: user, isLoading, error } = useCurrentUser();
 * 
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error loading user</div>;
 * if (!user) return <div>Not authenticated</div>;
 * 
 * return <div>Welcome, {user.name}!</div>;
 * ```
 */
export const useCurrentUser = () => {
  return useQuery<AuthUser | null, ApiError>({
    queryKey: queryKeys.auth.user,
    queryFn: async (): Promise<AuthUser | null> => {
      // First check localStorage for cached user
      const storedUser = localStorage.getItem('currentUser');
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        return null;
      }
      
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser) as AuthUser;
          // Validate that the stored user has required fields
          if (user.id && user.email && user.name && user.role) {
            return user;
          }
        } catch (error) {
          console.warn('Failed to parse stored user data:', error);
        }
      }
      
      // If no valid stored user, fetch from API
      try {
        const response = await ApiService.getCurrentUser?.();
        if (response?.success && response.data) {
          // Update localStorage with fresh data
          localStorage.setItem('currentUser', JSON.stringify(response.data));
          return response.data;
        }
      } catch (error) {
        // If API call fails, clear invalid auth data
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        throw error;
      }
      
      return null;
    },
    staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (unauthorized) errors
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

/**
 * Hook to check if user is authenticated
 *
 * @returns {Object} Object with authentication status and user data
 *
 * @example
 * ```tsx
 * const { isAuthenticated, user, isLoading } = useAuthStatus();
 *
 * if (isLoading) return <div>Checking authentication...</div>;
 *
 * if (!isAuthenticated) {
 *   return <LoginForm />;
 * }
 *
 * return <Dashboard user={user} />;
 * ```
 */
export const useAuthStatus = () => {
  const { data: user, isLoading, error } = useCurrentUser();

  return {
    user,
    isAuthenticated: !!user && !error,
    isLoading,
    error,
  };
};

/**
 * Hook for password change mutation
 * 
 * @returns {Object} Mutation object with password change function and state
 * 
 * @example
 * ```tsx
 * const changePasswordMutation = useChangePassword();
 * 
 * const handlePasswordChange = async (data: ChangePasswordRequest) => {
 *   try {
 *     await changePasswordMutation.mutateAsync(data);
 *     toast.success('Password changed successfully');
 *   } catch (error) {
 *     toast.error('Failed to change password');
 *   }
 * };
 * ```
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const useChangePassword = () => {
  return useMutation<ApiResponse<void>, ApiError, ChangePasswordRequest>({
    mutationFn: async (data: ChangePasswordRequest) => {
      if (data.newPassword !== data.confirmPassword) {
        throw new Error('New passwords do not match');
      }
      
      const response = await ApiService.changePassword?.(
        data.currentPassword,
        data.newPassword
      );
      
      if (!response) {
        throw new Error('Password change API not available');
      }
      
      return response;
    },
    onSuccess: () => {
      console.log('Password changed successfully');
    },
    onError: (error) => {
      console.error('Password change failed:', error);
    },
  });
};

/**
 * Hook for profile update mutation
 * 
 * @returns {Object} Mutation object with profile update function and state
 * 
 * @example
 * ```tsx
 * const updateProfileMutation = useUpdateProfile();
 * 
 * const handleProfileUpdate = async (data: UpdateProfileRequest) => {
 *   try {
 *     const result = await updateProfileMutation.mutateAsync(data);
 *     toast.success('Profile updated successfully');
 *   } catch (error) {
 *     toast.error('Failed to update profile');
 *   }
 * };
 * ```
 */
export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  email?: string;
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<AuthUser>, ApiError, UpdateProfileRequest>({
    mutationFn: async (data: UpdateProfileRequest) => {
      const response = await ApiService.updateProfile?.(data);
      
      if (!response) {
        throw new Error('Profile update API not available');
      }
      
      return response;
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        // Update cached user data
        queryClient.setQueryData(queryKeys.auth.user, data.data);
        
        // Update localStorage
        localStorage.setItem('currentUser', JSON.stringify(data.data));
        
        console.log('Profile updated successfully');
      }
    },
    onError: (error) => {
      console.error('Profile update failed:', error);
    },
  });
};
