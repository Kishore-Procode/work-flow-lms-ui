/**
 * Profile Management Hooks
 * 
 * React Query hooks for managing user profile data including
 * fetching, updating, and password changes with real data.
 * 
 * @author Student - ACT Team
 * @version 2.0.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../../services/api';
import { User } from '../../types/api';

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  profileImageUrl?: string;
  class?: string;
  semester?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProfileWithDetails extends User {
  collegeName?: string;
  departmentName?: string;
  hodName?: string;
  batchYear?: string;
  assignedTreesCount?: number;
}

/**
 * Hook to fetch current user profile with complete details
 */
export const useProfile = () => {
  return useQuery<ProfileWithDetails>({
    queryKey: ['profile'],
    queryFn: async () => {
      const profile = await ApiService.getProfile();
      
      // Fetch additional details if needed
      let collegeName = '';
      let departmentName = '';
      let hodName = '';
      let assignedTreesCount = 0;

      try {
        // Fetch college name if collegeId exists
        if (profile.collegeId) {
          const college = await ApiService.getCollegeById(profile.collegeId);
          collegeName = college.name;
        }

        // Fetch department name if departmentId exists
        if (profile.departmentId) {
          const department = await ApiService.getDepartmentById(profile.departmentId);
          departmentName = department.name;
          
          // Get HOD name from department
          if (department.hodId) {
            const hod = await ApiService.getUserById(department.hodId);
            hodName = hod.name;
          }
        }

        // Fetch assigned trees count for students
        if (profile.role === 'student') {
          const trees = await ApiService.getTreesByStudent(profile.id);
          assignedTreesCount = trees.length;
        }
      } catch (error) {
        console.warn('Failed to fetch additional profile details:', error);
      }

      return {
        ...profile,
        collegeName,
        departmentName,
        hodName,
        assignedTreesCount,
        batchYear: profile.class ? `Batch ${new Date().getFullYear() + (4 - parseInt(profile.class.charAt(0)))}` : undefined,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to update user profile
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<User, Error, UpdateProfileRequest>({
    mutationFn: async (data: UpdateProfileRequest) => {
      return await ApiService.updateProfile(data);
    },
    onSuccess: (updatedUser) => {
      // Update the profile cache
      queryClient.setQueryData(['profile'], (oldData: ProfileWithDetails | undefined) => {
        if (!oldData) return updatedUser;
        return {
          ...oldData,
          ...updatedUser,
        };
      });

      // Update auth user cache if it exists
      queryClient.setQueryData(['auth', 'user'], updatedUser);
      
      // Update localStorage
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const userData = JSON.parse(currentUser);
        localStorage.setItem('currentUser', JSON.stringify({
          ...userData,
          ...updatedUser,
        }));
      }

      console.log('Profile updated successfully');
    },
    onError: (error) => {
      console.error('Profile update failed:', error);
    },
  });
};

/**
 * Hook to change user password
 */
export const useChangePassword = () => {
  return useMutation<void, Error, ChangePasswordRequest>({
    mutationFn: async (data: ChangePasswordRequest) => {
      if (data.newPassword !== data.confirmPassword) {
        throw new Error('New passwords do not match');
      }

      if (data.newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters long');
      }

      // Check password strength
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
      if (!passwordRegex.test(data.newPassword)) {
        throw new Error('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
      }

      await ApiService.changePassword(data.currentPassword, data.newPassword);
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
 * Hook to get profile statistics (for students)
 */
export const useProfileStats = () => {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['profile', 'stats', profile?.id],
    queryFn: async () => {
      if (!profile || profile.role !== 'student') {
        return null;
      }

      try {
        const [trees, activities] = await Promise.all([
          ApiService.getTreesByStudent(profile.id),
          ApiService.getActivitiesByStudent(profile.id),
        ]);

        const healthyTrees = trees.filter(tree => tree.status === 'healthy').length;
        const recentActivities = activities.filter(activity => {
          const activityDate = new Date(activity.createdAt);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return activityDate >= thirtyDaysAgo;
        }).length;

        return {
          totalTrees: trees.length,
          healthyTrees,
          recentActivities,
          completionRate: trees.length > 0 ? Math.round((healthyTrees / trees.length) * 100) : 0,
        };
      } catch (error) {
        console.error('Failed to fetch profile stats:', error);
        return {
          totalTrees: 0,
          healthyTrees: 0,
          recentActivities: 0,
          completionRate: 0,
        };
      }
    },
    enabled: !!profile && profile.role === 'student',
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to upload profile image
 */
export const useUploadProfileImage = () => {
  const queryClient = useQueryClient();

  return useMutation<string, Error, File>({
    mutationFn: async (file: File) => {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Image size must be less than 5MB');
      }

      // Create form data
      const formData = new FormData();
      formData.append('profileImage', file);

      // Upload image (this would need to be implemented in ApiService)
      const response = await fetch('/api/v1/auth/upload-profile-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      return data.data.imageUrl;
    },
    onSuccess: (imageUrl) => {
      // Update profile with new image URL
      queryClient.setQueryData(['profile'], (oldData: ProfileWithDetails | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          profileImageUrl: imageUrl,
        };
      });

      console.log('Profile image uploaded successfully');
    },
    onError: (error) => {
      console.error('Profile image upload failed:', error);
    },
  });
};

export default {
  useProfile,
  useUpdateProfile,
  useChangePassword,
  useProfileStats,
  useUploadProfileImage,
};
