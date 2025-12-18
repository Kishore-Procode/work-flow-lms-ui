import axios from 'axios';
import type {
  AuthUser,
  User,
  College,
  Department,
  Invitation,
  RegistrationRequest,
  LoginRequest,
  LoginResponse,
  ApiResponse,
  PaginatedResponse,
  State,
  District
} from '../types/api';
import { API_BASE_URL, getImageUrl as getImageUrlFromConfig } from '../config/environment';

// Export getImageUrl for backward compatibility
export const getImageUrl = getImageUrlFromConfig;

// Utility function to convert snake_case to camelCase
const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

// Utility function to convert object keys from snake_case to camelCase
const convertKeysToCamelCase = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(convertKeysToCamelCase);
  if (obj instanceof Date) return obj; // Preserve Date objects
  if (typeof obj !== 'object') return obj;

  const converted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = toCamelCase(key);
    converted[camelKey] = convertKeysToCamelCase(value);
  }
  return converted;
};

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer: {
    serialize: (params) => {
      // Use URLSearchParams to properly serialize query parameters
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      return searchParams.toString();
    }
  }
});

// Export apiClient for direct use in services
export { apiClient };

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if it's NOT a login request and there's an existing auth token
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      const hasAuthToken = localStorage.getItem('authToken');

      if (!isLoginRequest && hasAuthToken) {
        // Clear auth data and redirect to login for expired tokens
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.href = '/';
      }
      // For login requests, let the error propagate to be handled by the component
    }
    return Promise.reject(error);
  }
);

// API Service class
export class ApiService {
  // ==================== GENERIC HTTP METHODS ====================
  static async get(url: string, params?: any): Promise<any> {
    try {
      const response = await apiClient.get(url, { params });
      return response.data;
    } catch (error) {
      console.error(`GET ${url} failed:`, error);
      throw error;
    }
  }

  static async post(url: string, data?: any): Promise<any> {
    try {
      const response = await apiClient.post(url, data);
      return response.data;
    } catch (error) {
      console.error(`POST ${url} failed:`, error);
      throw error;
    }
  }

  static async put(url: string, data?: any): Promise<any> {
    try {
      const response = await apiClient.put(url, data);
      return response.data;
    } catch (error) {
      console.error(`PUT ${url} failed:`, error);
      throw error;
    }
  }

  static async delete(url: string): Promise<any> {
    try {
      const response = await apiClient.delete(url);
      return response.data;
    } catch (error) {
      console.error(`DELETE ${url} failed:`, error);
      throw error;
    }
  }

  // ==================== AUTH ENDPOINTS ====================
  static async login(email: string, password: string, selectedRole: string): Promise<ApiResponse<LoginResponse>> {
    const response = await apiClient.post('/auth/login', { email, password, selectedRole });
    return response.data;
  }

  static async logout() {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  }

  static async getCurrentUser(): Promise<ApiResponse<AuthUser>> {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }

  static async checkAuth() {
    const response = await apiClient.get('/auth/check');
    return response.data;
  }

  // ==================== OTP ENDPOINTS ====================
  static async generateOTP(request: {
    identifier: string;
    type: 'email' | 'sms';
    purpose: string;
    userId?: string;
  }): Promise<ApiResponse<{ expiresAt: string; identifier: string; type: string }>> {
    const response = await apiClient.post('/otp/generate', request);
    return response.data;
  }

  static async verifyOTP(verification: {
    identifier: string;
    otp: string;
    purpose: string;
  }): Promise<ApiResponse<{ verified: boolean; userId?: string }>> {
    const response = await apiClient.post('/otp/verify', verification);
    return response.data;
  }

  static async resendOTP(request: {
    identifier: string;
    type: 'email' | 'sms';
    purpose: string;
    userId?: string;
  }): Promise<ApiResponse<{ expiresAt: string; identifier: string; type: string }>> {
    const response = await apiClient.post('/otp/resend', request);
    return response.data;
  }

  // ==================== USER ENDPOINTS ====================
  static async getUsers(params?: any): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get('/users', { params });
    return convertKeysToCamelCase(response.data);
  }

  static async getUsersWithCourseEnrollments(params?: any): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get('/users/with-tree-assignments', { params });
    return convertKeysToCamelCase(response.data);
  }

  // ==================== STAFF ENDPOINTS ====================
  static async getStaff(params?: any): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get('/staff', { params });
    return convertKeysToCamelCase(response.data);
  }

  static async createStaff(data: any): Promise<User> {
    const response = await apiClient.post('/staff', data);
    return convertKeysToCamelCase(response.data.data);
  }

  static async updateStaff(id: string, data: any): Promise<User> {
    const response = await apiClient.put(`/staff/${id}`, data);
    return convertKeysToCamelCase(response.data.data);
  }

  static async deleteStaff(id: string): Promise<void> {
    await apiClient.delete(`/staff/${id}`);
  }

  static async getUserById(id: string): Promise<User> {
    const response = await apiClient.get(`/users/${id}`);
    return convertKeysToCamelCase(response.data.data);
  }

  static async updateUser(id: string, data: any): Promise<User> {
    const response = await apiClient.put(`/users/${id}`, data);
    return convertKeysToCamelCase(response.data.data);
  }

  static async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  }

  static async bulkUpdateUsers(userIds: string[], updateData: any): Promise<void> {
    await apiClient.post('/users/bulk-update', { userIds, updateData });
  }

  static async bulkDeleteUsers(userIds: string[]): Promise<void> {
    await apiClient.post('/users/bulk-delete', { userIds });
  }

  static async updateUserStatus(userId: string, status: 'active' | 'inactive'): Promise<void> {
    await apiClient.patch(`/users/${userId}/status`, { status });
  }

  static async updateUserRole(userId: string, role: string): Promise<void> {
    await apiClient.patch(`/users/${userId}/role`, { role });
  }

  static async createUser(userData: any): Promise<User> {
    const response = await apiClient.post('/users', userData);
    return convertKeysToCamelCase(response.data.data);
  }



  // ==================== PROFILE ENDPOINTS ====================

  static async getProfile(): Promise<User> {
    const response = await apiClient.get('/auth/profile');
    return convertKeysToCamelCase(response.data.data);
  }

  static async updateProfile(profileData: any): Promise<User> {
    const response = await apiClient.put('/auth/profile', profileData);
    return convertKeysToCamelCase(response.data.data);
  }

  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword: newPassword
    });
  }

  // ==================== COLLEGE ENDPOINTS ====================
  static async getColleges(params?: any): Promise<PaginatedResponse<College>> {
    const response = await apiClient.get('/colleges', { params });
    return convertKeysToCamelCase(response.data);
  }

  static async getCollegeById(id: string): Promise<College> {
    const response = await apiClient.get(`/colleges/${id}`);
    return convertKeysToCamelCase(response.data.data);
  }

  static async getCollegesPublic(): Promise<College[]> {
    const response = await apiClient.get('/colleges/public');
    return convertKeysToCamelCase(response.data.data);
  }

  static async createCollege(collegeData: any): Promise<College> {
    const response = await apiClient.post('/colleges', collegeData);
    return convertKeysToCamelCase(response.data.data);
  }

  static async updateCollege(collegeId: string, collegeData: any): Promise<College> {
    const response = await apiClient.put(`/colleges/${collegeId}`, collegeData);
    return convertKeysToCamelCase(response.data.data);
  }

  static async registerCollege(collegeData: any): Promise<any> {
    const response = await apiClient.post('/colleges/register', collegeData);
    return convertKeysToCamelCase(response.data);
  }

  static async deleteCollege(collegeId: string): Promise<void> {
    await apiClient.delete(`/colleges/${collegeId}`);
  }



  // ==================== DEPARTMENT ENDPOINTS ====================
  static async getDepartments(params?: any): Promise<PaginatedResponse<Department>> {
    const response = await apiClient.get('/departments', { params });
    return convertKeysToCamelCase(response.data);
  }

  static async getDepartmentById(id: string): Promise<Department> {
    const response = await apiClient.get(`/departments/${id}`);
    return convertKeysToCamelCase(response.data.data);
  }

  static async getDepartmentsPublic(): Promise<Department[]> {
    const response = await apiClient.get('/departments/public');
    return convertKeysToCamelCase(response.data.data);
  }

  static async getDepartmentsByCollegePublic(collegeId: string): Promise<Department[]> {
    const response = await apiClient.get(`/departments/public/college/${collegeId}`);
    return convertKeysToCamelCase(response.data.data);
  }

  static async getClassesByDepartmentPublic(collegeId: string, departmentId: string): Promise<{ id: string, name: string }[]> {
    const response = await apiClient.get(`/departments/public/classes/${collegeId}/${departmentId}`);
    return convertKeysToCamelCase(response.data.data);
  }

  static async createDepartment(departmentData: any): Promise<Department> {
    const response = await apiClient.post('/departments', departmentData);
    return convertKeysToCamelCase(response.data.data);
  }

  static async updateDepartment(departmentId: string, departmentData: any): Promise<Department> {
    const response = await apiClient.put(`/departments/${departmentId}`, departmentData);
    return convertKeysToCamelCase(response.data.data);
  }

  static async deleteDepartment(departmentId: string): Promise<void> {
    await apiClient.delete(`/departments/${departmentId}`);
  }

  // ==================== COURSE ENDPOINTS ====================
  static async getCourses(params?: any): Promise<any[]> {
    const response = await apiClient.get('/courses', { params });
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  static async getCoursesByCollege(collegeId: string): Promise<{ id: string, name: string, code: string, type: string, departmentId: string, departmentName: string }[]> {
    const response = await apiClient.get(`/courses/by-college/${collegeId}`);
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  static async getCoursesByCollegeAndDepartment(collegeId: string, departmentId: string): Promise<{ id: string, name: string, code: string, type: string, departmentId: string, departmentName: string }[]> {
    const response = await apiClient.get(`/courses/by-college-and-department/${collegeId}/${departmentId}`);
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  static async getCoursesByDepartment(departmentId: string): Promise<any[]> {
    const response = await apiClient.get(`/courses?departmentId=${departmentId}`);
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  static async getDepartmentsByCourse(courseId: string): Promise<{ id: string, name: string, code: string, collegeId: string }[]> {
    try {
      const response = await apiClient.get(`/departments/by-course/${courseId}`);
      const data = response.data.data || response.data;

      if (!Array.isArray(data)) {
        console.warn('getDepartmentsByCourse: Expected array, got:', data);
        return [];
      }

      return convertKeysToCamelCase(data);
    } catch (error: any) {
      console.error('getDepartmentsByCourse error:', error);

      // If the endpoint fails, return empty array instead of throwing
      if (error.response?.status === 404 || error.response?.status === 500) {
        console.warn('Departments by course endpoint failed, returning empty array');
        return [];
      }

      throw error;
    }
  }

  static async getDepartmentsByCollegeForLogin(collegeId: string): Promise<{ id: string, name: string, code: string, collegeId: string }[]> {
    const response = await apiClient.get(`/departments/by-college/${collegeId}`);
    return convertKeysToCamelCase(response.data.data || response.data);
  }



  static async getSectionsByCourseDepYear(courseId: string, departmentId: string, yearId: string): Promise<{ id: string, name: string, courseId: string, departmentId: string, academicYearId: string, maxStudents?: number, currentStudents?: number }[]> {
    const response = await apiClient.get(`/registration-requests/sections/by-course-department-year/${courseId}/${departmentId}/${yearId}`);
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  static async getDepartmentSummary(departmentId: string): Promise<any> {
    const response = await apiClient.get(`/departments/${departmentId}/summary`);
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  static async getDepartmentComparison(): Promise<any[]> {
    const response = await apiClient.get('/departments/comparison');
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  // ==================== ADMIN SYSTEM HEALTH ENDPOINTS ====================
  static async getSystemHealth(): Promise<any> {
    const response = await apiClient.get('/dashboard/system-health');
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  // ==================== HOD DASHBOARD ENDPOINTS ====================
  static async getHODDashboardData(): Promise<any> {
    const response = await apiClient.get('/dashboard/hod');
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  // ==================== CLASS IN-CHARGE MANAGEMENT ENDPOINTS ====================
  static async getClassInChargeOverview(): Promise<any> {
    const response = await apiClient.get('/class-incharge/overview');
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  static async getStaffWorkload(): Promise<any> {
    const response = await apiClient.get('/class-incharge/workload');
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  static async getSectionsForAssignment(): Promise<any> {
    const response = await apiClient.get('/class-incharge/sections');
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  static async getAvailableFaculty(): Promise<any> {
    const response = await apiClient.get('/class-incharge/faculty');
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  static async assignClassInCharge(sectionId: string, facultyId: string): Promise<any> {
    const response = await apiClient.post('/class-incharge/assign', {
      sectionId,
      facultyId
    });
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  static async removeClassInCharge(sectionId: string): Promise<any> {
    const response = await apiClient.delete(`/class-incharge/remove/${sectionId}`);
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  static async syncSectionStudentCounts(): Promise<any> {
    const response = await apiClient.post('/class-incharge/sync-counts');
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  // ==================== STAFF DASHBOARD ENDPOINTS ====================
  static async getStaffDashboardData(): Promise<any> {
    const response = await apiClient.get('/dashboard/staff');
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  static async getStaffStudents(params?: any): Promise<any> {
    const response = await apiClient.get('/dashboard/staff/my-students', { params });
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  static async getStaffFilterOptions(): Promise<any> {
    const response = await apiClient.get('/dashboard/staff/filter-options');
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  static async getDepartmentProgressMonitoring(filters?: {
    year?: number;
    section?: string;
    status?: string;
  }): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.section) params.append('section', filters.section);
    if (filters?.status) params.append('status', filters.status);

    const response = await apiClient.get(`/dashboard/hod/progress-monitoring?${params.toString()}`);
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  // ==================== PRINCIPAL PROGRESS MONITORING ENDPOINTS ====================
  static async getPrincipalProgressMonitoring(filters?: {
    courseId?: string;
    departmentId?: string;
    year?: number;
    status?: string;
  }): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.courseId) params.append('courseId', filters.courseId);
    if (filters?.departmentId) params.append('departmentId', filters.departmentId);
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.status) params.append('status', filters.status);

    const response = await apiClient.get(`/dashboard/principal/progress-monitoring?${params.toString()}`);
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  static async getProgressFilterOptions(): Promise<any> {
    const response = await apiClient.get('/dashboard/principal/filter-options');
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  static async getStudentProgressDetails(studentId: string): Promise<any> {
    const response = await apiClient.get(`/dashboard/principal/student/${studentId}/progress`);
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  // ==================== APPROVAL SYSTEM ENDPOINTS ====================
  static async getPendingApprovals(): Promise<any[]> {
    const response = await apiClient.get('/approvals/pending');
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  static async processApproval(workflowId: string, action: 'approve' | 'reject', rejectionReason?: string): Promise<any> {
    const response = await apiClient.put(`/approvals/${workflowId}/process`, {
      action,
      rejectionReason
    });
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  static async getApprovalHistory(requestId: string): Promise<any[]> {
    const response = await apiClient.get(`/approvals/history/${requestId}`);
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  static async getApprovalStatistics(): Promise<any> {
    const response = await apiClient.get('/approvals/statistics');
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  static async getCourseById(id: string): Promise<{ id: string, name: string, code: string, type: string }> {
    const response = await apiClient.get(`/courses/${id}`);
    return convertKeysToCamelCase(response.data.data);
  }

  static async createCourse(courseData: any): Promise<any> {
    const response = await apiClient.post('/courses', courseData);
    return convertKeysToCamelCase(response.data.data);
  }

  static async updateCourse(id: string, courseData: any): Promise<any> {
    const response = await apiClient.put(`/courses/${id}`, courseData);
    return convertKeysToCamelCase(response.data.data);
  }

  // ==================== ACADEMIC YEAR ENDPOINTS ====================
  static async getAcademicYears(params?: any): Promise<{ id: string, year_name: string, year_number: number, course_id: string }[]> {
    const response = await apiClient.get('/academic-years', { params });
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  static async getAcademicYearsByCourse(courseId: string): Promise<{ id: string, year_name: string, year_number: number }[]> {
    const response = await apiClient.get(`/academic-years?courseId=${courseId}`);
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  static async getAcademicYearsByDepartmentAndCourse(departmentId: string, courseId: string): Promise<{ id: string, year_name: string, year_number: number }[]> {
    const response = await apiClient.get(`/academic-years?departmentId=${departmentId}&courseId=${courseId}`);
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  static async createAcademicYears(courseId: string, data: { fromYear: string; toYear: string }): Promise<any> {
    const response = await apiClient.post(`/courses/${courseId}/academic-years`, data);
    return convertKeysToCamelCase(response.data.data);
  }

  // ==================== SECTION ENDPOINTS ====================
  static async getSections(params?: any): Promise<{ id: string, name: string, course_id: string, department_id: string, academic_year_id: string }[]> {
    const response = await apiClient.get('/sections', { params });
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  static async getSectionsByAcademicYear(courseId: string, departmentId: string, academicYearId: string): Promise<{ id: string, name: string }[]> {
    const response = await apiClient.get(`/sections?courseId=${courseId}&departmentId=${departmentId}&academicYearId=${academicYearId}`);
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  static async getSectionsByCourseAndYear(courseId: string, yearName: string): Promise<{ id: string, name: string, courseId: string, departmentId: string, academicYearId: string }[]> {
    const response = await apiClient.get(`/sections/by-course-and-year/${courseId}/${encodeURIComponent(yearName)}`);
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  static async createSection(sectionData: any): Promise<any> {
    const response = await apiClient.post('/courses/sections', sectionData);
    return convertKeysToCamelCase(response.data.data);
  }

  static async updateSection(id: string, sectionData: any): Promise<any> {
    const response = await apiClient.put(`/courses/sections/${id}`, sectionData);
    return convertKeysToCamelCase(response.data.data);
  }



  // ==================== LOCATION ENDPOINTS ====================
  static async getStates(): Promise<{ id: string; name: string; code: string }[]> {
    const response = await apiClient.get('/locations/states');
    return response.data.data || response.data;
  }

  static async getDistrictsByState(stateId: string): Promise<{ id: string; name: string }[]> {
    const response = await apiClient.get(`/locations/states/${stateId}/districts`);
    return response.data.data || response.data;
  }

  static async getPincodesByDistrict(districtId: string): Promise<{ id: string; code: string; areaName: string }[]> {
    const response = await apiClient.get(`/locations/districts/${districtId}/pincodes`);
    return response.data.data || response.data;
  }

  // ==================== INVITATION ENDPOINTS ====================
  static async getInvitations(): Promise<Invitation[]> {
    const response = await apiClient.get('/invitations');
    return convertKeysToCamelCase(response.data.data);
  }

  static async getInvitationsWithPagination(queryParams?: string): Promise<any> {
    const url = queryParams ? `/invitations?${queryParams}` : '/invitations';
    const response = await apiClient.get(url);
    return convertKeysToCamelCase(response.data);
  }

  static async createInvitation(invitationData: {
    email: string;
    role: string;
    college_id?: string;
    department_id?: string;
    name: string;
    phone?: string;
    yearOfStudy?: number;
    section?: string;
    rollNumber?: string;
    academicYearId?: string;
    designation?: string;
    qualification?: string;
    experience?: number;
  }): Promise<Invitation> {
    const response = await apiClient.post('/invitations', invitationData);
    return convertKeysToCamelCase(response.data.data);
  }

  static async updateInvitation(invitationId: string, invitationData: any): Promise<Invitation> {
    const response = await apiClient.put(`/invitations/${invitationId}`, invitationData);
    return convertKeysToCamelCase(response.data.data);
  }

  static async deleteInvitation(invitationId: string): Promise<void> {
    await apiClient.delete(`/invitations/${invitationId}`);
  }

  static async acceptInvitation(invitationId: string): Promise<Invitation> {
    const response = await apiClient.post(`/invitations/${invitationId}/accept`);
    return convertKeysToCamelCase(response.data.data);
  }

  static async rejectInvitation(invitationId: string): Promise<Invitation> {
    const response = await apiClient.post(`/invitations/${invitationId}/reject`);
    return convertKeysToCamelCase(response.data.data);
  }

  static async resendInvitation(invitationId: string): Promise<Invitation> {
    const response = await apiClient.post(`/invitations/${invitationId}/resend`);
    return convertKeysToCamelCase(response.data.data);
  }

  static async validateInvitationToken(token: string): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/invitations/validate/${token}`);
    return convertKeysToCamelCase(response.data.data);
  }

  // Content Management APIs
  static async getGuidelines(): Promise<any[]> {
    const response = await apiClient.get('/content/guidelines');
    return response.data.data;
  }

  static async createGuideline(data: any): Promise<any> {
    const response = await apiClient.post('/content/guidelines', data);
    return response.data.data;
  }

  static async updateGuideline(id: string, data: any): Promise<any> {
    const response = await apiClient.put(`/content/guidelines/${id}`, data);
    return response.data.data;
  }

  static async deleteGuideline(id: string): Promise<void> {
    await apiClient.delete(`/content/guidelines/${id}`);
  }

  static async getResources(filters?: any): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `/content/resources?${queryString}` : '/content/resources';

    const response = await apiClient.get(url);
    return response.data.data;
  }

  static async createResource(data: any): Promise<any> {
    const response = await apiClient.post('/content/resources', data);
    return response.data.data;
  }

  static async updateResource(id: string, data: any): Promise<any> {
    const response = await apiClient.put(`/content/resources/${id}`, data);
    return response.data.data;
  }

  static async deleteResource(id: string): Promise<void> {
    await apiClient.delete(`/content/resources/${id}`);
  }

  static async downloadResource(resourceUrl: string, filename: string): Promise<void> {
    try {
      let downloadUrl = resourceUrl;

      // If it's a relative path, construct the full URL
      if (!resourceUrl.startsWith('http')) {
        downloadUrl = resourceUrl.startsWith('/')
          ? `${API_BASE_URL}${resourceUrl}`
          : `${API_BASE_URL}/${resourceUrl}`;
      }

      const response = await apiClient.get(downloadUrl, {
        responseType: 'blob',
        headers: {
          'Accept': '*/*'
        }
      });

      // Create blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }

  // ==================== CONTACT ENDPOINTS ====================
  static async sendContactMessage(messageData: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    category: string;
    message: string;
    priority: string;
    userId?: string;
    userRole?: string;
  }): Promise<any> {
    const response = await apiClient.post('/contact/send-message', messageData);
    return convertKeysToCamelCase(response.data);
  }

  // ==================== RECENT UPDATES ENDPOINTS ====================
  static async getRecentLearningUploads(limit: number = 20): Promise<any[]> {
    try {
      const response = await apiClient.get(`/uploads/photos/recent?limit=${limit}`);
      return convertKeysToCamelCase(response.data.data || []);
    } catch (error) {
      console.error('Failed to get recent learning uploads:', error);
      return [];
    }
  }



  // Public invitation endpoints (no authentication required)
  // static async validateInvitationToken(token: string): Promise<Invitation> {
  //   const response = await axios.get(`${API_BASE_URL}/invitations/validate/${token}`);
  //   return convertKeysToCamelCase(response.data.data);
  // }

  static async acceptInvitationPublic(invitationData: {
    invitationToken: string;
    name: string;
    phone: string;
    password: string;
    rollNumber?: string;
    designation?: string;
    qualification?: string;
    experience?: number;
  }): Promise<any> {
    const response = await axios.post(`${API_BASE_URL}/invitations/accept-public`, invitationData);
    return convertKeysToCamelCase(response.data.data);
  }

  // ==================== REGISTRATION REQUEST ENDPOINTS ====================
  static async getRegistrationRequests(): Promise<RegistrationRequest[]> {
    const response = await apiClient.get('/registration-requests');
    return convertKeysToCamelCase(response.data.data);
  }

  // Get registration requests based on current user's role and hierarchy
  static async getMyRegistrationRequests(params?: any): Promise<PaginatedResponse<RegistrationRequest>> {
    const response = await apiClient.get('/registration-requests', { params });
    return convertKeysToCamelCase(response.data);
  }

  static async createRegistrationRequest(requestData: any): Promise<RegistrationRequest> {
    const response = await apiClient.post('/registration-requests', requestData);
    return convertKeysToCamelCase(response.data.data);
  }

  static async updateRegistrationRequest(requestId: string, requestData: any): Promise<RegistrationRequest> {
    const response = await apiClient.put(`/registration-requests/${requestId}`, requestData);
    return convertKeysToCamelCase(response.data.data);
  }

  static async approveRegistrationRequest(requestId: string): Promise<User> {
    const response = await apiClient.post(`/registration-requests/${requestId}/approve`);
    return convertKeysToCamelCase(response.data.data);
  }

  static async rejectRegistrationRequest(requestId: string, reason?: string): Promise<void> {
    await apiClient.post(`/registration-requests/${requestId}/reject`, { reason });
  }

  // ==================== DASHBOARD ENDPOINTS ====================
  static async getDashboardOverview() {
    const response = await apiClient.get('/dashboard/overview');
    return convertKeysToCamelCase(response.data.data);
  }

  static async getRecentActivity() {
    try {
      const response = await apiClient.get('/dashboard/activity');
      return convertKeysToCamelCase(response.data.data);
    } catch (error) {
      console.warn('Recent activity endpoint not available');
      return [];
    }
  }

  // ==================== ADMIN DASHBOARD ENDPOINTS ====================
  static async getAdminStates(): Promise<any> {
    try {
      const response = await apiClient.get('/dashboard/admin/states');
      return convertKeysToCamelCase(response.data);
    } catch (error: any) {
      console.error('❌ Failed to fetch admin states:', error.response?.status, error.message);
      if (error.response?.status === 404 || error.response?.status === 401) {
        throw new Error('States data not available. Please ensure you have proper permissions.');
      }
      throw error;
    }
  }

  static async getAdminDistricts(stateId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/dashboard/admin/districts/${stateId}`);
      return convertKeysToCamelCase(response.data);
    } catch (error: any) {
      console.error(`❌ Failed to fetch districts for state ${stateId}:`, error.response?.status, error.message);
      if (error.response?.status === 404 || error.response?.status === 401) {
        throw new Error('Districts data not available. Please ensure you have proper permissions.');
      }
      throw error;
    }
  }

  static async getAdminCollegeRanking(filters: any = {}): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (filters.stateId) params.append('stateId', filters.stateId);
      if (filters.districtId) params.append('districtId', filters.districtId);

      const response = await apiClient.get(`/dashboard/admin/colleges?${params.toString()}`);
      const data = convertKeysToCamelCase(response.data);

      // Return the full data structure
      return data;
    } catch (error: any) {
      console.error('❌ Failed to fetch college ranking:', error.response?.status, error.message);
      throw error;
    }
  }

  static async getAdminDashboardStats(filters: any = {}): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (filters.stateId) params.append('stateId', filters.stateId);
      if (filters.districtId) params.append('districtId', filters.districtId);

      const response = await apiClient.get(`/dashboard/admin/colleges?${params.toString()}`);
      const data = convertKeysToCamelCase(response.data);

      // Extract stats from the college ranking response
      return {
        data: data.data?.stats || {
          totalColleges: 0,
          totalStudents: 0,
          totalresourcesAssigned: 0,
          totalDepartments: 0,
          averageParticipationRate: 0,
          topPerformingCollege: null,
          recentActivity: [],
        }
      };
    } catch (error) {
      console.warn('Admin dashboard stats endpoint not available');
      return {
        data: {
          totalColleges: 0,
          totalStudents: 0,
          totalresourcesAssigned: 0,
          totalDepartments: 0,
          averageParticipationRate: 0,
          topPerformingCollege: null,
          recentActivity: [],
        }
      };
    }
  }

  static async getStudentDashboardData(): Promise<any> {
    try {
      const response = await apiClient.get('/dashboard/student');
      return convertKeysToCamelCase(response.data);
    } catch (error) {
      console.warn('Student dashboard endpoint not available');
      return { data: {} };
    }
  }

  static async getDepartmentPerformance(): Promise<any> {
    try {
      const response = await apiClient.get('/dashboard/department-performance');
      return convertKeysToCamelCase(response.data);
    } catch (error) {
      console.warn('Department performance endpoint not available');
      return { data: [] };
    }
  }

  static async getStudentsWithMissingUploads(): Promise<any> {
    try {
      const response = await apiClient.get('/dashboard/missing-uploads');
      return convertKeysToCamelCase(response.data);
    } catch (error) {
      console.warn('Missing uploads endpoint not available');
      return { data: [] };
    }
  }

  // ==================== LEARNING RESOURCE ENDPOINTS ====================
  static async getLearningResources(params?: any): Promise<PaginatedResponse<any>> {
    const response = await apiClient.get('/learning-resources', { params });
    return convertKeysToCamelCase(response.data);
  }

  static async getLearningResourcesByStudent(studentId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`/learning-resources/student/${studentId}`);
      return convertKeysToCamelCase(response.data.data);
    } catch (error) {
      console.warn('Learning resources by student endpoint not available');
      return [];
    }
  }

  static async getActivitiesByStudent(studentId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`/activities/student/${studentId}`);
      return convertKeysToCamelCase(response.data.data);
    } catch (error) {
      console.warn('Activities by student endpoint not available');
      return [];
    }
  }

  static async createLearningResource(resourceData: any): Promise<any> {
    const response = await apiClient.post('/learning-resources', resourceData);
    return convertKeysToCamelCase(response.data.data);
  }

  static async updateLearningResource(resourceId: string, resourceData: any): Promise<any> {
    const response = await apiClient.put(`/learning-resources/${resourceId}`, resourceData);
    return convertKeysToCamelCase(response.data.data);
  }

  static async deleteLearningResource(resourceId: string): Promise<void> {
    await apiClient.delete(`/learning-resources/${resourceId}`);
  }

  static async getLearningResourceById(resourceId: string): Promise<any> {
    const response = await apiClient.get(`/learning-resources/${resourceId}`);
    return convertKeysToCamelCase(response.data.data);
  }

  static async getLearningResourceImages(resourceId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`/learning-resources/${resourceId}/images`);
      return convertKeysToCamelCase(response.data.data);
    } catch (error) {
      console.warn('Learning resource images endpoint not available');
      return [];
    }
  }

  static async getAvailableLearningResources(): Promise<any[]> {
    const response = await apiClient.get('/enrollment/available');
    return convertKeysToCamelCase(response.data.data);
  }

  // ==================== BACKWARD COMPATIBILITY ALIASES ====================
  static async getTrees(params?: any): Promise<PaginatedResponse<any>> {
    return this.getLearningResources(params);
  }

  static async getTreesByStudent(studentId: string): Promise<any[]> {
    return this.getLearningResourcesByStudent(studentId);
  }

  static async createTree(treeData: any): Promise<any> {
    return this.createLearningResource(treeData);
  }

  static async updateTree(treeId: string, treeData: any): Promise<any> {
    return this.updateLearningResource(treeId, treeData);
  }

  static async deleteTree(treeId: string): Promise<void> {
    return this.deleteLearningResource(treeId);
  }

  static async getTreeById(treeId: string): Promise<any> {
    return this.getLearningResourceById(treeId);
  }

  static async getTreeImages(treeId: string): Promise<any[]> {
    return this.getLearningResourceImages(treeId);
  }

  static async getAvailableTrees(): Promise<any[]> {
    return this.getAvailableLearningResources();
  }

  static async getTreeInventory(params?: any): Promise<any> {
    return this.getCourseInventory(params);
  }

  static async getTreeInventoryById(inventoryId: string): Promise<any> {
    return this.getCourseInventoryById(inventoryId);
  }

  static async createTreeInventory(data: any): Promise<any> {
    return this.createCourseInventory(data);
  }

  static async updateTreeInventory(inventoryId: string, data: any): Promise<any> {
    return this.updateCourseInventory(inventoryId, data);
  }

  static async deleteTreeInventory(inventoryId: string): Promise<void> {
    return this.deleteCourseInventory(inventoryId);
  }

  static async getCourseEnrollmentStatus(): Promise<any> {
    try {
      const response = await apiClient.get('/enrollment/status');
      return convertKeysToCamelCase(response.data.data);
    } catch (error) {
      console.error('Failed to get enrollment status:', error);
      throw error;
    }
  }

  static async getMyCourseEnrollment(): Promise<any> {
    try {
      // Use enrollment endpoint which has the correct resource assignment data
      const response = await apiClient.get('/enrollment/my-selection');
      return convertKeysToCamelCase(response.data.data);
    } catch (error) {
      console.error('Failed to get course enrollment:', error);
      throw error; // Re-throw to allow LearningProgress to handle 401 errors
    }
  }

  static async enrollInCourse(resourceId: string): Promise<any> {
    const response = await apiClient.post('/enrollment/select', { treeId: resourceId });
    return convertKeysToCamelCase(response.data.data);
  }

  static async markCourseAsStarted(enrollmentId: string, startImageId?: string): Promise<any> {
    const response = await apiClient.put('/enrollment/mark-started', { selectionId: enrollmentId, plantingImageId: startImageId });
    return convertKeysToCamelCase(response.data.data);
  }

  static async getStudentCourseEnrollment(): Promise<any> {
    const response = await apiClient.get('/enrollment/my-selection');
    return convertKeysToCamelCase(response.data.data);
  }

  static async getCourseEnrollments(): Promise<any[]> {
    const response = await apiClient.get('/enrollment');
    return convertKeysToCamelCase(response.data.data);
  }

  // Additional backward compatibility aliases for renamed functions
  static async getTreeSelectionStatus(): Promise<any> {
    return this.getCourseEnrollmentStatus();
  }

  static async getMyTreeSelection(): Promise<any> {
    return this.getMyCourseEnrollment();
  }

  static async selectTree(treeId: string): Promise<any> {
    return this.enrollInCourse(treeId);
  }

  static async markTreeAsPlanted(selectionId: string, plantingImageId?: string): Promise<any> {
    return this.markCourseAsStarted(selectionId, plantingImageId);
  }

  static async getStudentTreeSelection(): Promise<any> {
    return this.getStudentCourseEnrollment();
  }

  static async getTreeSelections(): Promise<any[]> {
    return this.getCourseEnrollments();
  }

  static async uploadTreeImage(treeId: string, file: File, imageType: string = 'progress', caption?: string): Promise<any> {
    return this.uploadLearningImage(treeId, file, imageType, caption);
  }



  static async deleteTreeImage(imageId: string): Promise<void> {
    return this.deleteLearningImage(imageId);
  }

  static async getTreesByCollege(collegeId: string): Promise<any[]> {
    return this.getLearningResourcesByCollege(collegeId);
  }

  static async getTreesByDepartment(departmentId: string): Promise<any[]> {
    return this.getLearningResourcesByDepartment(departmentId);
  }

  static async getTreeStatistics(collegeId?: string): Promise<any> {
    return this.getLearningResourceStatistics(collegeId);
  }

  static async getAllTrees(): Promise<any[]> {
    return this.getAllLearningResources();
  }

  static async getTreeProgress(treeId: string): Promise<any> {
    return this.getLearningProgress(treeId);
  }

  static async getStudentTreeProgress(): Promise<any> {
    return this.getStudentLearningProgress();
  }

  static async getTreeHealthData(): Promise<any[]> {
    return this.getLearningProgressData();
  }

  static async getGrowthTrends(): Promise<any[]> {
    return this.getCompletionTrends();
  }

  static async getStudentTree(studentId: string): Promise<any> {
    return this.getStudentLearningResource(studentId);
  }

  static async getStudentTreeAssignment(studentId: string): Promise<any> {
    return this.getStudentCourseAssignment(studentId);
  }

  static async getStudentTreeHistory(studentId: string): Promise<any[]> {
    return this.getStudentLearningHistory(studentId);
  }

  static async assignTreeToStudent(data: { studentId: string; treeId: string }): Promise<any> {
    return this.assignLearningResourceToStudent({ studentId: data.studentId, resourceId: data.treeId });
  }

  static async bulkAssignTrees(data: { studentIds: string[]; treeIds: string[]; assignmentMode: 'auto' | 'manual' }): Promise<any> {
    return this.bulkAssignLearningResources({ studentIds: data.studentIds, resourceIds: data.treeIds, assignmentMode: data.assignmentMode });
  }

  static async unassignTreeFromStudent(studentId: string): Promise<any> {
    return this.unassignLearningResourceFromStudent(studentId);
  }

  static async getStudentTreeAssignments(filters?: any): Promise<any> {
    return this.getStudentCourseAssignments(filters);
  }

  static async createTreeAndAssignToStudent(data: { studentId: string; treeData: any }): Promise<any> {
    return this.createLearningResourceAndAssignToStudent({ studentId: data.studentId, resourceData: data.treeData });
  }

  static async getAssignedTreesByType(params: { treeType: string; departmentId: string }): Promise<any[]> {
    return this.getAssignedResourcesByType({ resourceType: params.treeType, departmentId: params.departmentId });
  }

  static async getUsersWithTreeAssignments(params?: any): Promise<PaginatedResponse<User>> {
    return this.getUsersWithCourseEnrollments(params);
  }

  static async getRecentTreeUploads(limit: number = 20): Promise<any[]> {
    return this.getRecentLearningUploads(limit);
  }

  // ==================== UPLOAD ENDPOINTS ====================
  static async uploadLearningImage(resourceId: string, file: File, imageType: string = 'progress', caption?: string): Promise<any> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('treeId', resourceId);
    formData.append('imageType', imageType);
    if (caption) {
      formData.append('caption', caption);
    }

    // Create a separate axios instance for file uploads to avoid Content-Type conflicts
    const token = localStorage.getItem('authToken');
    const uploadResponse = await axios.post(`${API_BASE_URL}/uploads/tree-images`, formData, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        // Don't set Content-Type - let browser set it automatically for FormData
      },
    });

    return convertKeysToCamelCase(uploadResponse.data);
  }

  // Check photo restrictions
  static async checkPhotoRestrictions(resourceId: string): Promise<any> {
    const response = await apiClient.get(`/uploads/photo-restrictions/${resourceId}`);
    return convertKeysToCamelCase(response.data);
  }

  // Get photo history for current academic year
  static async getPhotoHistory(resourceId: string): Promise<any> {
    const response = await apiClient.get(`/uploads/photo-history/${resourceId}`);
    return convertKeysToCamelCase(response.data);
  }

  // ==================== BULK UPLOAD ENDPOINTS ====================
  static async downloadCollegeUploadTemplate(): Promise<Blob> {
    const response = await apiClient.get('/bulk-upload/colleges/template', {
      responseType: 'blob'
    });
    return response.data;
  }

  static async uploadCollegesCSV(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('csvFile', file);

    const token = localStorage.getItem('authToken');
    const response = await axios.post(`${API_BASE_URL}/bulk-upload/colleges`, formData, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    return convertKeysToCamelCase(response.data);
  }

  // Legacy method for backward compatibility
  static async downloadBulkUploadTemplate(): Promise<Blob> {
    return this.downloadCollegeUploadTemplate();
  }

  static async downloadStaffHODUploadTemplate(): Promise<Blob> {
    const response = await apiClient.get('/bulk-upload/staff-hod/template', {
      responseType: 'blob'
    });
    return response.data;
  }

  static async uploadStaffHODCSV(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('csvFile', file);

    const token = localStorage.getItem('authToken');
    const response = await axios.post(`${API_BASE_URL}/bulk-upload/staff-hod`, formData, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    return convertKeysToCamelCase(response.data);
  }

  static async downloadStudentUploadTemplate(): Promise<Blob> {
    const response = await apiClient.get('/bulk-upload/students/template', {
      responseType: 'blob'
    });
    return response.data;
  }

  static async uploadStudentsCSV(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('csvFile', file);

    const token = localStorage.getItem('authToken');
    const response = await axios.post(`${API_BASE_URL}/bulk-upload/students`, formData, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    return convertKeysToCamelCase(response.data);
  }

  static async getLearningImages(resourceId: string): Promise<any[]> {
    const response = await apiClient.get(`/uploads/tree-images/for/${resourceId}`);
    return convertKeysToCamelCase(response.data.data);
  }

  static async deleteLearningImage(imageId: string): Promise<void> {
    await apiClient.delete(`/uploads/tree-images/${imageId}`);
  }

  static async camera(id: string): Promise<void> {
    const response = await apiClient.post(`/uploads/check/${id}`)
    return response.data.data
  }

  // ==================== FILTERED DATA METHODS ====================
  static async getUsersByRole(role: string): Promise<User[]> {
    const response = await apiClient.get(`/users?role=${role}`);
    return convertKeysToCamelCase(response.data.data);
  }

  static async getUsersByCollege(collegeId: string): Promise<User[]> {
    const response = await apiClient.get(`/users?collegeId=${collegeId}`);
    return convertKeysToCamelCase(response.data.data);
  }

  static async getUsersByDepartment(departmentId: string): Promise<User[]> {
    const response = await apiClient.get(`/users?departmentId=${departmentId}`);
    return convertKeysToCamelCase(response.data.data);
  }

  static async getDepartmentsByCollege(collegeId: string, params?: any): Promise<Department[]> {
    const response = await apiClient.get(`/departments/college/${collegeId}`, { params });
    return convertKeysToCamelCase(response.data.data);
  }

  static async getLearningResourcesByCollege(collegeId: string): Promise<any[]> {
    const response = await apiClient.get(`/learning-resources?collegeId=${collegeId}`);
    return convertKeysToCamelCase(response.data.data);
  }

  static async getLearningResourcesByDepartment(departmentId: string): Promise<any[]> {
    const response = await apiClient.get(`/learning-resources?departmentId=${departmentId}`);
    return convertKeysToCamelCase(response.data.data);
  }

  static async getLearningResourceStatistics(collegeId?: string): Promise<any> {
    try {
      const params = collegeId ? { collegeId } : {};
      const response = await apiClient.get('/learning-resources/statistics', { params });
      return convertKeysToCamelCase(response.data.data);
    } catch (error) {
      console.warn('Learning resource statistics endpoint not available');
      return {
        totalResources: 0,
        assignedResources: 0,
        availableResources: 0,
        resourcesByStatus: {},
        resourcesByDepartment: {}
      };
    }
  }

  // ==================== PRINCIPAL DASHBOARD METHODS ====================
  static async getPrincipalDashboardData(): Promise<any> {
    try {
      const response = await apiClient.get('/dashboard/principal');
      return convertKeysToCamelCase(response.data.data);
    } catch (error) {
      console.error('Failed to fetch principal dashboard data:', error);
      throw error;
    }
  }



  static async getRegistrationRequestsByCollege(collegeId: string): Promise<RegistrationRequest[]> {
    const response = await apiClient.get(`/registration-requests?collegeId=${collegeId}`);
    return convertKeysToCamelCase(response.data.data);
  }

  static async getInvitationsByCollege(collegeId: string): Promise<Invitation[]> {
    const response = await apiClient.get(`/invitations?collegeId=${collegeId}`);
    return convertKeysToCamelCase(response.data.data);
  }

  // ==================== MISSING METHODS FOR DASHBOARD AND MONITORING ====================
  static async getAllLearningResources(): Promise<any[]> {
    const response = await apiClient.get('/trees/all');
    return convertKeysToCamelCase(response.data.data);
  }

  static async getAllPhotos(): Promise<any[]> {
    const response = await apiClient.get('/uploads/photos/all');
    return convertKeysToCamelCase(response.data.data);
  }

  static async getAllUsers(): Promise<User[]> {
    const response = await apiClient.get('/users/all');
    return convertKeysToCamelCase(response.data.data);
  }

  static async getAllStudents(): Promise<User[]> {
    const response = await apiClient.get('/users?role=student');
    return convertKeysToCamelCase(response.data.data);
  }

  static async getMyStudents(): Promise<User[]> {
    // Use the general users endpoint with role filter for students
    // The backend will automatically filter based on user's role and department
    const response = await apiClient.get('/users', {
      params: {
        role: 'student',
        limit: 1000 // Get all students accessible to current user
      }
    });
    return convertKeysToCamelCase(response.data.data);
  }

  static async getUnassignedStudents(filters?: any): Promise<User[]> {
    // Get students who don't have learning resources assigned
    const response = await apiClient.get('/users', {
      params: {
        role: 'student',
        unassigned: true,
        limit: 1000,
        ...filters
      }
    });
    return convertKeysToCamelCase(response.data.data);
  }

  static async getDepartmentStudents(): Promise<User[]> {
    // Use the general users endpoint with role filter for students
    const response = await apiClient.get('/users', {
      params: {
        role: 'student',
        limit: 1000 // Get all students in department
      }
    });
    return convertKeysToCamelCase(response.data.data);
  }

  static async getLearningProgress(resourceId: string): Promise<any> {
    const response = await apiClient.get(`/trees/${resourceId}/progress`);
    return convertKeysToCamelCase(response.data.data);
  }

  static async getStudentLearningProgress(): Promise<any> {
    const response = await apiClient.get('/enrollment/my-progress');
    return convertKeysToCamelCase(response.data.data);
  }

  static async getCollegeStats(collegeId?: string): Promise<any> {
    const url = collegeId ? `/dashboard/college-stats/${collegeId}` : '/dashboard/college-stats';
    const response = await apiClient.get(url);
    return convertKeysToCamelCase(response.data.data);
  }

  static async getDepartmentStats(departmentId?: string): Promise<any> {
    const url = departmentId ? `/dashboard/department-stats/${departmentId}` : '/dashboard/department-stats';
    const response = await apiClient.get(url);
    return convertKeysToCamelCase(response.data.data);
  }

  static async getStudentStats(): Promise<any> {
    const response = await apiClient.get('/dashboard/student-stats');
    return convertKeysToCamelCase(response.data.data);
  }

  static async getLearningProgressData(): Promise<any[]> {
    const response = await apiClient.get('/trees/health-data');
    return convertKeysToCamelCase(response.data.data);
  }

  static async getCompletionTrends(): Promise<any[]> {
    const response = await apiClient.get('/trees/growth-trends');
    return convertKeysToCamelCase(response.data.data);
  }

  static async getPhotoUploadStats(): Promise<any> {
    const response = await apiClient.get('/uploads/stats');
    return convertKeysToCamelCase(response.data.data);
  }

  // ==================== STUDENT MONITORING METHODS ====================
  static async getStudentLearningResource(studentId: string): Promise<any> {
    // Use trees endpoint to get student's learning resource assignment directly from trees table
    const response = await apiClient.get(`/trees/student/${studentId}`);
    return convertKeysToCamelCase(response.data.data);
  }

  static async getStudentPhotos(studentId: string): Promise<any[]> {
    try {
      // First get the student's learning resource assignment
      const resourceAssignment = await this.getStudentLearningResource(studentId);
      if (!resourceAssignment || !resourceAssignment.treeId) {
        return []; // No learning resource assigned, no photos
      }

      // Then get photos for that learning resource
      const response = await apiClient.get(`/uploads/tree-images/for/${resourceAssignment.treeId}`);
      return convertKeysToCamelCase(response.data.data);
    } catch (error) {
      // console.log(`No photos found for student ${studentId}`);
      return [];
    }
  }

  static async getStudentProgress(studentId: string): Promise<any> {
    // Use trees endpoint which provides comprehensive progress data
    const response = await apiClient.get(`/trees/student/${studentId}`);
    return convertKeysToCamelCase(response.data.data);
  }

  static async getStudentCourseAssignment(studentId: string): Promise<any> {
    const response = await apiClient.get(`/trees/student/${studentId}`);
    return convertKeysToCamelCase(response.data.data);
  }

  static async getStudentLearningHistory(studentId: string): Promise<any[]> {
    const response = await apiClient.get(`/trees/student/${studentId}/history`);
    return convertKeysToCamelCase(response.data.data);
  }

  static async getStudentUploadHistory(studentId: string): Promise<any[]> {
    const response = await apiClient.get(`/uploads/student/${studentId}/history`);
    return convertKeysToCamelCase(response.data.data);
  }

  static async getStudentStatistics(studentId: string): Promise<any> {
    const response = await apiClient.get(`/students/${studentId}/statistics`);
    return convertKeysToCamelCase(response.data.data);
  }

  static async getClassStudents(classId: string): Promise<User[]> {
    const response = await apiClient.get(`/users/class/${classId}`);
    return convertKeysToCamelCase(response.data.data);
  }

  static async getStudentsByDepartment(departmentId: string): Promise<User[]> {
    const response = await apiClient.get(`/users/department/${departmentId}/students`);
    return convertKeysToCamelCase(response.data.data);
  }

  static async getStudentsByCollege(collegeId: string): Promise<User[]> {
    const response = await apiClient.get(`/users/college/${collegeId}/students`);
    return convertKeysToCamelCase(response.data.data);
  }

  // ==================== LEARNING RESOURCE ASSIGNMENT ENDPOINTS ====================
  static async assignLearningResourceToStudent(data: { studentId: string; resourceId: string }): Promise<any> {
    const response = await apiClient.post('/trees/assign', { studentId: data.studentId, treeId: data.resourceId });
    return convertKeysToCamelCase(response.data);
  }

  static async bulkAssignLearningResources(data: {
    studentIds: string[];
    resourceIds: string[];
    assignmentMode: 'auto' | 'manual'
  }): Promise<any> {
    const response = await apiClient.post('/trees/bulk-assign', { studentIds: data.studentIds, treeIds: data.resourceIds, assignmentMode: data.assignmentMode });
    return convertKeysToCamelCase(response.data);
  }

  static async unassignLearningResourceFromStudent(studentId: string): Promise<any> {
    const response = await apiClient.delete(`/trees/unassign/${studentId}`);
    return convertKeysToCamelCase(response.data);
  }

  static async getStudentCourseAssignments(filters?: any): Promise<any> {
    const response = await apiClient.get('/trees/assignments', { params: filters });
    return convertKeysToCamelCase(response.data);
  }

  static async createLearningResourceAndAssignToStudent(data: {
    studentId: string;
    resourceData: any
  }): Promise<any> {
    const response = await apiClient.post('/trees/create-and-assign', { studentId: data.studentId, treeData: data.resourceData });
    return convertKeysToCamelCase(response.data);
  }

  static async getState(): Promise<State[]> {
    const response = await apiClient.get('/colleges/state');
    return convertKeysToCamelCase(response.data.data);
  }
  static async getDistrict(): Promise<District[]> {
    const response = await apiClient.get(`/colleges/district`);

    return convertKeysToCamelCase(response.data.data)
  }

  // ==================== RESOURCE CATALOG ENDPOINTS ====================
  static async getCourseInventory(params?: any): Promise<any> {
    const response = await apiClient.get('/resource-catalog', { params });
    return convertKeysToCamelCase(response.data);
  }

  static async getCourseInventoryById(inventoryId: string): Promise<any> {
    const response = await apiClient.get(`/resource-catalog/${inventoryId}`);
    return convertKeysToCamelCase(response.data.data);
  }

  static async createCourseInventory(data: {
    courseType: string;
    totalCount: number;
    departmentId: string;
    collegeId: string;
    notes?: string;
  }): Promise<any> {
    const response = await apiClient.post('/resource-catalog', data);
    return convertKeysToCamelCase(response.data.data);
  }

  static async updateCourseInventory(inventoryId: string, data: {
    courseType?: string;
    totalCount?: number;
    notes?: string;
  }): Promise<any> {
    const response = await apiClient.put(`/resource-catalog/${inventoryId}`, data);
    return convertKeysToCamelCase(response.data.data);
  }

  static async deleteCourseInventory(inventoryId: string): Promise<void> {
    await apiClient.delete(`/resource-catalog/${inventoryId}`);
  }

  static async getInventorySummary(departmentId: string): Promise<any> {
    const response = await apiClient.get(`/resource-catalog/department/${departmentId}/summary`);
    return convertKeysToCamelCase(response.data.data);
  }

  static async getAssignedResourcesByType(params: {
    resourceType: string;
    departmentId: string;
  }): Promise<any[]> {
    const response = await apiClient.get('/resource-catalog/assigned-resources', { params: { treeType: params.resourceType, departmentId: params.departmentId } });
    return convertKeysToCamelCase(response.data.data);
  }

  // ==================== MONITORING ENDPOINTS ====================

  /**
   * Get student progress monitoring data with pagination and filtering
   */
  static async getStudentProgressMonitoring(params: {
    page?: number;
    limit?: number;
    departmentId?: string;
    healthStatus?: string;
    searchTerm?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    students: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/monitoring/student-progress?${queryParams.toString()}`);
    return convertKeysToCamelCase(response.data.data);
  }

  /**
   * Get monitoring department summary statistics
   */
  static async getMonitoringDepartmentSummary(departmentId?: string): Promise<{
    totalStudents: number;
    resourcesAssigned: number;
    totalPhotos: number;
    avgProgress: number;
  }> {
    const params = departmentId ? `?departmentId=${departmentId}` : '';
    const response = await apiClient.get(`/monitoring/department-summary${params}`);
    return convertKeysToCamelCase(response.data.data);
  }

  // ==================== CERTIFICATE ENDPOINTS ====================
  static async downloadCertificate(): Promise<Blob> {
    const response = await apiClient.get('/certificate/my-certificate', {
      responseType: 'blob',
    });
    return response.data;
  }

  static async downloadPlaySessionCertificate(sessionId: string): Promise<Blob> {
    const response = await apiClient.get(`/certificate/play-session/${sessionId}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // ==================== CONTENT CREATION APIs ====================

  /**
   * Create a content block (quiz, assignment, examination, video, text, pdf)
   */
  static async createContentBlock(data: any): Promise<any> {
    const response = await apiClient.post('/content-creation/content-blocks', data);
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  /**
   * Update a content block
   */
  static async updateContentBlock(blockId: string, data: any): Promise<any> {
    const response = await apiClient.put(`/content-creation/content-blocks/${blockId}`, data);
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  /**
   * Delete a content block
   */
  static async deleteContentBlock(blockId: string): Promise<void> {
    await apiClient.delete(`/content-creation/content-blocks/${blockId}`);
  }

  /**
   * Get all content blocks for a session
   */
  static async getSessionContentBlocks(sessionId: string): Promise<any[]> {
    const response = await apiClient.get(`/content-creation/sessions/${sessionId}/content-blocks`);
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  /**
   * Create quiz/examination questions
   */
  static async createQuizQuestions(data: { contentBlockId: string; questions: any[] }): Promise<any> {
    const response = await apiClient.post('/content-creation/quiz-questions', data);
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  /**
   * Update a quiz question
   */
  static async updateQuizQuestion(questionId: string, data: any): Promise<any> {
    const response = await apiClient.put(`/content-creation/quiz-questions/${questionId}`, data);
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  /**
   * Delete a quiz question
   */
  static async deleteQuizQuestion(questionId: string): Promise<void> {
    await apiClient.delete(`/content-creation/quiz-questions/${questionId}`);
  }

  /**
   * Get questions for a content block
   */
  static async getQuizQuestions(blockId: string): Promise<any[]> {
    const response = await apiClient.get(`/content-creation/content-blocks/${blockId}/questions`);
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  // ==================== EXAMINATION APIs ====================

  /**
   * Submit examination
   */
  static async submitExamination(data: any): Promise<any> {
    const response = await apiClient.post('/examinations/submit', data);
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  /**
   * Grade examination manually
   */
  static async gradeExamination(attemptId: string, data: any): Promise<any> {
    const response = await apiClient.post(`/examinations/${attemptId}/grade`, data);
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  /**
   * Get examination attempt details
   */
  static async getExaminationAttempt(attemptId: string): Promise<any> {
    const response = await apiClient.get(`/examinations/attempts/${attemptId}`);
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  /**
   * Get pending examinations for grading (staff)
   */
  static async getPendingExaminationGrading(): Promise<any[]> {
    const response = await apiClient.get('/examinations/pending-grading');
    const data = convertKeysToCamelCase(response.data.data || response.data);
    // Extract examinations array from the response
    return data?.examinations || [];
  }

  /**
   * Get student examinations
   */
  static async getStudentExaminations(userId: string): Promise<any[]> {
    const response = await apiClient.get(`/examinations/student/${userId}`);
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  // ==================== ASSIGNMENT GRADING ENDPOINTS ====================

  /**
   * Get all assignment submissions for staff's assigned subjects
   */
  static async getStaffAssignmentSubmissions(): Promise<any> {
    const response = await apiClient.get('/lms-content/assignments/submissions');
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  /**
   * Grade an assignment submission
   */
  static async gradeAssignment(data: {
    submissionId: string;
    score: number;
    maxScore: number;
    feedback?: string;
    rubricScores?: Array<{
      criteria: string;
      score: number;
      maxScore: number;
      comments?: string;
    }>;
  }): Promise<any> {
    const response = await apiClient.post('/lms-content/assignments/grade', data);
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  /**
   * Get assignment submission status for a student
   */
  static async getAssignmentSubmissionStatus(assignmentId: string): Promise<any> {
    const response = await apiClient.get(`/lms-content/assignments/${assignmentId}/status`);
    return convertKeysToCamelCase(response.data.data || response.data);
  }

  /**
   * Get assignments by subject (for staff)
   */
  static async getAssignmentsBySubject(subjectId: string): Promise<any> {
    const response = await apiClient.get(`/lms-content/assignments/subject/${subjectId}`);
    return convertKeysToCamelCase(response.data.data || response.data);
  }
}

export default ApiService;