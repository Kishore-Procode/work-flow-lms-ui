/**
 * React Query hooks for Approval Management
 * Provides comprehensive approval workflow management with pagination
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ApiService } from '../../services/api';

export interface ApprovalFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: string;
  type?: string;
}

// Query Keys
export const approvalKeys = {
  all: ['approvals'] as const,
  lists: () => [...approvalKeys.all, 'list'] as const,
  list: (filters: ApprovalFilters) => [...approvalKeys.lists(), filters] as const,
  details: () => [...approvalKeys.all, 'detail'] as const,
  detail: (id: string) => [...approvalKeys.details(), id] as const,
};

// Fetch approvals with pagination
export const useApprovals = (filters: ApprovalFilters = {}) => {
  return useQuery({
    queryKey: approvalKeys.list(filters),
    queryFn: () => ApiService.getPendingApprovals(filters),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Approve request mutation
export const useApproveRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ApiService.approveRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries(approvalKeys.all);
      toast.success('Request approved successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve request');
    },
  });
};

// Reject request mutation
export const useRejectRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => 
      ApiService.rejectRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(approvalKeys.all);
      toast.success('Request rejected successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject request');
    },
  });
};

// Bulk approve requests mutation
export const useBulkApproveRequests = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => ApiService.bulkApproveRequests(ids),
    onSuccess: (data) => {
      queryClient.invalidateQueries(approvalKeys.all);
      toast.success(`${data.approved} requests approved successfully`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve requests');
    },
  });
};

// Bulk reject requests mutation
export const useBulkRejectRequests = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, reason }: { ids: string[]; reason: string }) => 
      ApiService.bulkRejectRequests(ids, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries(approvalKeys.all);
      toast.success(`${data.rejected} requests rejected successfully`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject requests');
    },
  });
};
