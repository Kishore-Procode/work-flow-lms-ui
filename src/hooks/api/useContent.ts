/**
 * React Query hooks for Content Management
 * Provides comprehensive content management with pagination
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ApiService } from '../../services/api';

export interface ContentFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  type?: string;
  status?: string;
}

// Query Keys
export const contentKeys = {
  all: ['content'] as const,
  guidelines: () => [...contentKeys.all, 'guidelines'] as const,
  resources: () => [...contentKeys.all, 'resources'] as const,
  guideline: (filters: ContentFilters) => [...contentKeys.guidelines(), filters] as const,
  resource: (filters: ContentFilters) => [...contentKeys.resources(), filters] as const,
};

// Fetch guidelines with pagination
export const useGuidelines = (filters: ContentFilters = {}) => {
  return useQuery({
    queryKey: contentKeys.guideline(filters),
    queryFn: () => ApiService.getGuidelines(filters),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Fetch resources with pagination
export const useResources = (filters: ContentFilters = {}) => {
  return useQuery({
    queryKey: contentKeys.resource(filters),
    queryFn: () => ApiService.getResources(filters),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Create guideline mutation
export const useCreateGuideline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => ApiService.createGuideline(data),
    onSuccess: () => {
      queryClient.invalidateQueries(contentKeys.guidelines());
      toast.success('Guideline created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create guideline');
    },
  });
};

// Update guideline mutation
export const useUpdateGuideline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      ApiService.updateGuideline(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(contentKeys.guidelines());
      toast.success('Guideline updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update guideline');
    },
  });
};

// Delete guideline mutation
export const useDeleteGuideline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ApiService.deleteGuideline(id),
    onSuccess: () => {
      queryClient.invalidateQueries(contentKeys.guidelines());
      toast.success('Guideline deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete guideline');
    },
  });
};

// Create resource mutation
export const useCreateResource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => ApiService.createResource(data),
    onSuccess: () => {
      queryClient.invalidateQueries(contentKeys.resources());
      toast.success('Resource created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create resource');
    },
  });
};

// Update resource mutation
export const useUpdateResource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      ApiService.updateResource(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(contentKeys.resources());
      toast.success('Resource updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update resource');
    },
  });
};

// Delete resource mutation
export const useDeleteResource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ApiService.deleteResource(id),
    onSuccess: () => {
      queryClient.invalidateQueries(contentKeys.resources());
      toast.success('Resource deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete resource');
    },
  });
};
