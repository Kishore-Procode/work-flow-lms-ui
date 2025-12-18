/**
 * Content Mapping Service
 * 
 * API service for LMS Content Mapping functionality.
 * Handles all HTTP requests related to content mapping operations.
 * 
 * @author Student-ACT LMS Team
 * @version 1.0.0
 */

import axios from 'axios';
import { API_BASE_URL } from '../config/environment';
import type {
  ApiResponse,
  GetDropdownDataRequest,
  GetDropdownDataResponse,
  LoadSemestersRequest,
  LoadSemestersResponse,
  GetSubjectsRequest,
  GetSubjectsResponse,
  AssignSubjectsRequest,
  AssignSubjectsResponse,
  DropdownOption
} from '../types/contentMapping';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

/**
 * Content Mapping API Service Class
 */
export class ContentMappingService {
  private static readonly BASE_PATH = '/content-mapping';

  /**
   * Get dropdown data for content mapping form
   */
  static async getDropdownData(params?: GetDropdownDataRequest): Promise<GetDropdownDataResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.courseType) {
        queryParams.append('courseType', params.courseType);
      }
      if (params?.lmsCourseId) {
        queryParams.append('lmsCourseId', params.lmsCourseId);
      }
      if (params?.lmsDepartmentId) {
        queryParams.append('lmsDepartmentId', params.lmsDepartmentId);
      }
      if (params?.actDepartmentId) {
        queryParams.append('actDepartmentId', params.actDepartmentId);
      }

      const queryString = queryParams.toString();
      const url = `${this.BASE_PATH}/dropdown-data${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<ApiResponse<GetDropdownDataResponse>>(url);

      console.log('🔍 ContentMapping API Response:', {
        url,
        success: response.data.success,
        hasData: !!response.data.data,
        lmsDepartmentsCount: response.data.data?.lmsDepartments?.length || 0,
        fullData: response.data.data
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get dropdown data');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error getting dropdown data:', error);
      throw this.handleError(error, 'Failed to load dropdown data');
    }
  }

  /**
   * Load semesters from ACT schema and create content mapping configuration
   */
  static async loadSemesters(request: LoadSemestersRequest): Promise<LoadSemestersResponse> {
    try {
      const response = await apiClient.post<ApiResponse<LoadSemestersResponse>>(
        `${this.BASE_PATH}/load-semesters`,
        request
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to load semesters');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error loading semesters:', error);
      throw this.handleError(error, 'Failed to load semesters');
    }
  }

  /**
   * Get subjects for a specific semester in content mapping context
   */
  static async getSubjects(semesterDetailsId: string): Promise<GetSubjectsResponse> {
    try {
      if (!semesterDetailsId) {
        throw new Error('Semester details ID is required');
      }

      const response = await apiClient.get<ApiResponse<GetSubjectsResponse>>(
        `${this.BASE_PATH}/subjects/${semesterDetailsId}`
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get subjects');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error getting subjects:', error);
      throw this.handleError(error, 'Failed to load subjects');
    }
  }

  /**
   * Assign subjects to LMS learning resources
   */
  static async assignSubjects(request: AssignSubjectsRequest): Promise<AssignSubjectsResponse> {
    try {
      if (!request.contentMapSemDetailsId) {
        throw new Error('Content map semester details ID is required');
      }

      if (!request.assignments || request.assignments.length === 0) {
        throw new Error('At least one subject assignment is required');
      }

      const response = await apiClient.post<ApiResponse<AssignSubjectsResponse>>(
        `${this.BASE_PATH}/assign-subjects`,
        request
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to assign subjects');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error assigning subjects:', error);
      throw this.handleError(error, 'Failed to assign subjects');
    }
  }

  /**
   * Get learning resources for dropdown (used in subject assignment popup)
   */
  static async getLearningResources(): Promise<DropdownOption[]> {
    try {
      // This would typically call the learning resources API
      // For now, we'll return mock data or call the existing learning resources endpoint
      const response = await apiClient.get<ApiResponse<any>>('/api/v1/learning-resources');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get learning resources');
      }
      
      // Transform learning resources to dropdown options
      const learningResources = response.data.data?.data || response.data.data || [];
      
      return learningResources.map((resource: any) => ({
        value: resource.id,
        label: resource.title || resource.resourceCode || 'Untitled Resource',
        code: resource.resourceCode
      }));
    } catch (error) {
      console.error('Error getting learning resources:', error);
      throw this.handleError(error, 'Failed to load learning resources');
    }
  }

  /**
   * Get filtered learning resources based on criteria
   */
  static async getFilteredLearningResources(filters: {
    category?: string;
    status?: string;
    search?: string;
  }): Promise<DropdownOption[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.category) {
        queryParams.append('category', filters.category);
      }
      if (filters.status) {
        queryParams.append('status', filters.status);
      }
      if (filters.search) {
        queryParams.append('search', filters.search);
      }

      const queryString = queryParams.toString();
      const url = `/api/v1/learning-resources${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get<ApiResponse<any>>(url);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get learning resources');
      }
      
      // Transform learning resources to dropdown options
      const learningResources = response.data.data?.data || response.data.data || [];
      
      return learningResources.map((resource: any) => ({
        value: resource.id,
        label: resource.title || resource.resourceCode || 'Untitled Resource',
        code: resource.resourceCode
      }));
    } catch (error) {
      console.error('Error getting filtered learning resources:', error);
      throw this.handleError(error, 'Failed to load learning resources');
    }
  }

  /**
   * Validate content mapping form data
   */
  static validateFormData(formData: LoadSemestersRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!formData.courseType) {
      errors.push('Course type is required');
    }

    if (!formData.lmsCourseId) {
      errors.push('LMS course is required');
    }

    if (!formData.lmsDepartmentId) {
      errors.push('LMS department is required');
    }

    if (!formData.lmsAcademicYearId) {
      errors.push('LMS academic year is required');
    }

    if (!formData.actDepartmentId) {
      errors.push('ACT department is required');
    }

    if (!formData.actRegulationId) {
      errors.push('ACT regulation is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Handle API errors and provide user-friendly messages
   */
  private static handleError(error: any, defaultMessage: string): Error {
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.message) {
        return new Error(error.response.data.message);
      }
      
      if (error.response?.status === 403) {
        return new Error('Access denied. Principal or HOD role required.');
      }
      
      if (error.response?.status === 401) {
        return new Error('Authentication required. Please log in again.');
      }
      
      if (error.response?.status === 404) {
        return new Error('Resource not found.');
      }
      
      if (error.response?.status >= 500) {
        return new Error('Server error. Please try again later.');
      }
    }
    
    if (error instanceof Error) {
      return error;
    }
    
    return new Error(defaultMessage);
  }
}

/**
 * Default export for convenience
 */
export default ContentMappingService;
