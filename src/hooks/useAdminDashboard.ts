import { useState, useCallback } from 'react';
import { useAdminStates, useAdminDistricts, useAdminCollegeRanking } from './api/useDashboard';
import { State, District, AdminDashboardData } from '../types/dashboard';

interface UseAdminDashboardReturn {
  // Data
  states: State[];
  districts: District[];
  dashboardData: AdminDashboardData | null;
  colleges: any[];
  
  // Loading states
  statesLoading: boolean;
  districtsLoading: boolean;
  dashboardLoading: boolean;
  
  // Error states
  statesError: string | null;
  districtsError: string | null;
  dashboardError: string | null;
  
  // Filters
  selectedStateId: string | null;
  selectedDistrictId: string | null;
  
  // Actions
  setSelectedStateId: (stateId: string | null) => void;
  setSelectedDistrictId: (districtId: string | null) => void;
  refreshDashboard: () => Promise<void>;
  clearFilters: () => void;
}

export const useAdminDashboard = (): UseAdminDashboardReturn => {
  // Filter states
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);

  // React Query hooks
  const statesQuery = useAdminStates();
  const districtsQuery = useAdminDistricts(selectedStateId);
  const dashboardQuery = useAdminCollegeRanking({
    stateId: selectedStateId,
    districtId: selectedDistrictId
  });

  // Extract data from queries
  const states = statesQuery.data || [];
  const districts = districtsQuery.data || [];
  const dashboardData = dashboardQuery.data || null;

  // Extract colleges array for backward compatibility
  const colleges = dashboardData?.colleges || [];

  // Handle state selection
  const handleStateSelection = useCallback((stateId: string | null) => {
    setSelectedStateId(stateId);
    setSelectedDistrictId(null); // Reset district when state changes
  }, []);

  // Handle district selection
  const handleDistrictSelection = useCallback((districtId: string | null) => {
    setSelectedDistrictId(districtId);
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSelectedStateId(null);
    setSelectedDistrictId(null);
  }, []);

  // Refresh dashboard data
  const refreshDashboard = useCallback(async () => {
    await Promise.all([
      statesQuery.refetch(),
      districtsQuery.refetch(),
      dashboardQuery.refetch()
    ]);
  }, [statesQuery, districtsQuery, dashboardQuery]);

  return {
    // Data
    states,
    districts,
    dashboardData,
    colleges,

    // Loading states
    statesLoading: statesQuery.isLoading,
    districtsLoading: districtsQuery.isLoading,
    dashboardLoading: dashboardQuery.isLoading,

    // Error states
    statesError: statesQuery.error?.message || null,
    districtsError: districtsQuery.error?.message || null,
    dashboardError: dashboardQuery.error?.message || null,

    // Filters
    selectedStateId,
    selectedDistrictId,

    // Actions
    setSelectedStateId: handleStateSelection,
    setSelectedDistrictId: handleDistrictSelection,
    refreshDashboard,
    clearFilters,
  };
};
