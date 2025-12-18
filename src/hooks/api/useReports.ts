/**
 * React Query hooks for Reports Management
 * Provides comprehensive reporting with pagination and filtering
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ApiService } from '../../services/api';

export interface ReportFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  collegeId?: string;
  departmentId?: string;
  reportType?: string;
  status?: string;
}

// Query Keys
export const reportKeys = {
  all: ['reports'] as const,
  lists: () => [...reportKeys.all, 'list'] as const,
  list: (filters: ReportFilters) => [...reportKeys.lists(), filters] as const,
  analytics: () => [...reportKeys.all, 'analytics'] as const,
  analytic: (filters: ReportFilters) => [...reportKeys.analytics(), filters] as const,
  export: (filters: ReportFilters) => [...reportKeys.all, 'export', filters] as const,
};

// Fetch reports with pagination
export const useReports = (filters: ReportFilters = {}) => {
  return useQuery({
    queryKey: reportKeys.list(filters),
    queryFn: () => ApiService.getReports(filters),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Fetch analytics data
export const useReportAnalytics = (filters: ReportFilters = {}) => {
  return useQuery({
    queryKey: reportKeys.analytic(filters),
    queryFn: () => ApiService.getReportAnalytics(filters),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Generate report mutation
export const useGenerateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: any) => ApiService.generateReport(config),
    onSuccess: () => {
      queryClient.invalidateQueries(reportKeys.all);
      toast.success('Report generated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate report');
    },
  });
};

// Export report mutation
export const useExportReport = () => {
  return useMutation({
    mutationFn: ({ filters, format }: { filters: ReportFilters; format: string }) => 
      ApiService.exportReport(filters, format),
    onSuccess: () => {
      toast.success('Report exported successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to export report');
    },
  });
};

// Delete report mutation
export const useDeleteReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ApiService.deleteReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries(reportKeys.all);
      toast.success('Report deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete report');
    },
  });
};

// Schedule report mutation
export const useScheduleReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: any) => ApiService.scheduleReport(config),
    onSuccess: () => {
      queryClient.invalidateQueries(reportKeys.all);
      toast.success('Report scheduled successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to schedule report');
    },
  });
};
