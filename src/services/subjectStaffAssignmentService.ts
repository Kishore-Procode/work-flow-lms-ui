/**
 * Subject Staff Assignment Service
 * 
 * API service for HOD subject-staff assignment operations.
 * 
 * @author ACT-LMS Team
 * @version 1.0.0
 */

import apiClient from './api';
import {
  ApiResponse,
  HODSemestersResponse,
  SubjectsForAssignmentResponse,
  AvailableStaffResponse,
  AssignStaffRequest,
  AssignStaffResponse,
  RemoveAssignmentResponse
} from '../types/subjectStaffAssignment';

const BASE_URL = '/hod/subject-assignments';

export class SubjectStaffAssignmentService {
  /**
   * Get all courses with content mapping for HOD's department
   */
  static async getHODCourses(): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`${BASE_URL}/courses`);
    return response.data;
  }

  /**
   * Get all academic years for a course with content mapping
   * @param courseId - Course ID (required)
   */
  static async getAcademicYearsForCourse(courseId: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`${BASE_URL}/academic-years?courseId=${courseId}`);
    return response.data;
  }

  /**
   * Get all semesters for HOD's department with subject counts
   * @param courseId - Optional: filter by course
   * @param academicYearId - Optional: filter by academic year
   */
  static async getHODSemesters(courseId?: string, academicYearId?: string): Promise<ApiResponse<HODSemestersResponse>> {
    const params = new URLSearchParams();
    if (courseId) params.append('courseId', courseId);
    if (academicYearId) params.append('academicYearId', academicYearId);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get(`${BASE_URL}/semesters${queryString}`);
    return response.data;
  }

  /**
   * Get all subjects for a semester with their staff assignments
   * @param semesterNumber - Semester number
   * @param academicYearId - Academic year ID
   */
  static async getSubjectsForAssignment(
    semesterNumber: number,
    academicYearId: string
  ): Promise<ApiResponse<SubjectsForAssignmentResponse>> {
    // Build query string manually to avoid axios serialization issues
    const queryString = `?semesterNumber=${semesterNumber}&academicYearId=${academicYearId}`;
    const response = await apiClient.get(`${BASE_URL}/subjects${queryString}`);
    return response.data;
  }

  /**
   * Get all available staff in HOD's department
   * @param semesterNumber - Optional: filter by semester to see workload
   * @param academicYearId - Required: content map sem details ID
   */
  static async getAvailableStaff(
    semesterNumber?: number,
    academicYearId?: string
  ): Promise<ApiResponse<AvailableStaffResponse>> {
    const params = new URLSearchParams();
    if (semesterNumber) params.append('semesterNumber', semesterNumber.toString());
    if (academicYearId) params.append('academicYearId', academicYearId);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get(`${BASE_URL}/staff${queryString}`);
    return response.data;
  }

  /**
   * Assign a staff member to a subject
   * @param assignmentData - Assignment details
   */
  static async assignStaffToSubject(
    assignmentData: AssignStaffRequest
  ): Promise<ApiResponse<AssignStaffResponse>> {
    const response = await apiClient.post(`${BASE_URL}/assign`, assignmentData);
    return response.data;
  }

  /**
   * Remove staff assignment from a subject
   * @param assignmentId - Assignment ID to remove
   */
  static async removeStaffAssignment(
    assignmentId: string
  ): Promise<ApiResponse<RemoveAssignmentResponse>> {
    const response = await apiClient.delete(`${BASE_URL}/${assignmentId}`);
    return response.data;
  }
}

export default SubjectStaffAssignmentService;
