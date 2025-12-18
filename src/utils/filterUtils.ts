/**
 * Utility functions for handling API filters
 */

/**
 * Cleans filter object by removing empty string, null, and undefined values
 * This prevents backend validation errors when optional fields are sent as empty strings
 */
export const cleanFilters = (filters: Record<string, any>): Record<string, any> => {
  return Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => {
      // Keep values that are not empty strings, null, or undefined
      // But keep boolean false and number 0 as they are valid values
      return value !== '' && value !== null && value !== undefined;
    })
  );
};

/**
 * Applies role-based filtering to the base filters
 */
export const applyRoleBasedFilters = (
  baseFilters: Record<string, any>,
  user: any
): Record<string, any> => {
  const cleanedFilters = cleanFilters(baseFilters);
  
  return {
    ...cleanedFilters,
    // Apply role-based filtering
    ...(user?.role === 'principal' && user?.collegeId && { collegeId: user.collegeId }),
    ...(user?.role === 'hod' && user?.departmentId && { departmentId: user.departmentId }),
    ...(user?.role === 'staff' && user?.departmentId && {
      departmentId: user.departmentId,
      ...(user?.classInCharge && { class: user.classInCharge })
    }),
  };
};

/**
 * Creates pagination info with default values
 */
export const createPaginationInfo = (response: any) => {
  return response?.pagination || {
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };
};

/**
 * Extracts data array from API response, handling both direct arrays and paginated responses
 */
export const extractDataArray = (response: any): any[] => {
  return Array.isArray(response) ? response : response?.data || [];
};
