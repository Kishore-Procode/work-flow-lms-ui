/**
 * Student Enrollment Service
 * 
 * Service layer for student subject enrollment and learning content API calls.
 * 
 * @author Student-ACT LMS Team
 * @version 1.0.0
 */

import { ApiService } from './api';
import type {
  ApiResponse,
  CurrentSemesterResponse,
  GetAvailableSubjectsRequest,
  AvailableSubjectsResponse,
  EnrollSubjectsRequest,
  EnrollSubjectsResponse,
  GetEnrolledSubjectsRequest,
  EnrolledSubjectsResponse,
  GetLearningContentRequest,
  LearningContentResponse,
} from '../types/studentEnrollment';

const BASE_PATH = '/student-enrollment';

/**
 * Student Enrollment Service
 * Handles all API calls related to student subject enrollment
 */
export class StudentEnrollmentService {
  /**
   * Get current semester for authenticated student
   * Calculates the current semester based on batch year and current date
   */
  static async getCurrentSemester(): Promise<ApiResponse<CurrentSemesterResponse>> {
    try {
      const response = await ApiService.get(`${BASE_PATH}/current-semester`);
      return response;
    } catch (error) {
      console.error('Failed to get current semester:', error);
      throw error;
    }
  }

  /**
   * Get available subjects for enrollment in a specific semester
   * @param semesterNumber - The semester number to get subjects for
   */
  static async getAvailableSubjects(
    semesterNumber: number
  ): Promise<ApiResponse<AvailableSubjectsResponse>> {
    try {
      const response = await ApiService.get(`${BASE_PATH}/available-subjects`, {
        semesterNumber,
      });
      return response;
    } catch (error) {
      console.error('Failed to get available subjects:', error);
      throw error;
    }
  }

  /**
   * Enroll student in multiple subjects
   * @param request - Enrollment request with semester, academic year, and subject IDs
   */
  static async enrollSubjects(
    request: EnrollSubjectsRequest
  ): Promise<ApiResponse<EnrollSubjectsResponse>> {
    try {
      const response = await ApiService.post(`${BASE_PATH}/enroll`, request);
      return response;
    } catch (error) {
      console.error('Failed to enroll in subjects:', error);
      throw error;
    }
  }

  /**
   * Get enrolled subjects for authenticated student
   * @param filters - Optional filters for semester or academic year
   */
  static async getEnrolledSubjects(
    filters?: GetEnrolledSubjectsRequest
  ): Promise<ApiResponse<EnrolledSubjectsResponse>> {
    try {
      const params: any = {};
      if (filters?.semesterNumber) {
        params.semesterNumber = filters.semesterNumber;
      }
      if (filters?.academicYearId) {
        params.academicYearId = filters.academicYearId;
      }

      const response = await ApiService.get(`${BASE_PATH}/enrolled-subjects`, params);
      return response;
    } catch (error) {
      console.error('Failed to get enrolled subjects:', error);
      throw error;
    }
  }

  /**
   * Get learning content for an enrolled subject
   * @param enrollmentId - The enrollment ID to get content for
   */
  static async getLearningContent(
    enrollmentId: string
  ): Promise<ApiResponse<LearningContentResponse>> {
    try {
      const response = await ApiService.get(
        `${BASE_PATH}/learning-content/${enrollmentId}`
      );
      return response;
    } catch (error) {
      console.error('Failed to get learning content:', error);
      throw error;
    }
  }

  /**
   * Calculate enrollment statistics from enrolled subjects
   * @param enrollments - Array of enrolled subject details
   */
  static calculateEnrollmentStats(enrollments: EnrolledSubjectsResponse) {
    const { enrollments: subjects } = enrollments;

    const totalSubjects = subjects.length;
    const completedSubjects = subjects.filter((s) => s.status === 'completed').length;
    const activeSubjects = subjects.filter((s) => s.status === 'active').length;
    const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
    const earnedCredits = subjects
      .filter((s) => s.status === 'completed')
      .reduce((sum, s) => sum + s.credits, 0);

    const averageProgress =
      totalSubjects > 0
        ? subjects.reduce((sum, s) => sum + s.progressPercentage, 0) / totalSubjects
        : 0;

    return {
      totalSubjects,
      enrolledSubjects: totalSubjects,
      completedSubjects,
      activeSubjects,
      averageProgress: Math.round(averageProgress),
      totalCredits,
      earnedCredits,
    };
  }

  /**
   * Filter subjects by search query
   * @param subjects - Array of subjects to filter
   * @param searchQuery - Search query string
   */
  static filterSubjectsBySearch<T extends { actSubjectCode?: string; actSubjectName?: string; subjectCode?: string; subjectName?: string }>(
    subjects: T[],
    searchQuery: string
  ): T[] {
    if (!searchQuery.trim()) {
      return subjects;
    }

    const query = searchQuery.toLowerCase();
    return subjects.filter((subject) => {
      const code = (subject.actSubjectCode || subject.subjectCode || '').toLowerCase();
      const name = (subject.actSubjectName || subject.subjectName || '').toLowerCase();
      return code.includes(query) || name.includes(query);
    });
  }

  /**
   * Sort subjects by field and order
   * @param subjects - Array of subjects to sort
   * @param field - Field to sort by
   * @param order - Sort order (asc/desc)
   */
  static sortSubjects<T extends Record<string, any>>(
    subjects: T[],
    field: string,
    order: 'asc' | 'desc'
  ): T[] {
    return [...subjects].sort((a, b) => {
      const aValue = a[field];
      const bValue = b[field];

      if (aValue === bValue) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return order === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Group enrollments by semester
   * @param enrollments - Array of enrolled subjects
   */
  static groupEnrollmentsBySemester(enrollments: EnrolledSubjectsResponse) {
    const grouped = new Map<number, typeof enrollments.enrollments>();

    enrollments.enrollments.forEach((enrollment) => {
      const semester = enrollment.semesterNumber;
      if (!grouped.has(semester)) {
        grouped.set(semester, []);
      }
      grouped.get(semester)!.push(enrollment);
    });

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a - b)
      .map(([semester, subjects]) => ({
        semester,
        subjects,
        totalCredits: subjects.reduce((sum, s) => sum + s.credits, 0),
        completedCount: subjects.filter((s) => s.status === 'completed').length,
        activeCount: subjects.filter((s) => s.status === 'active').length,
      }));
  }

  /**
   * Format semester display name
   * @param semesterNumber - Semester number
   */
  static formatSemesterName(semesterNumber: number): string {
    return `Semester ${semesterNumber}`;
  }

  /**
   * Get semester ordinal suffix
   * @param semesterNumber - Semester number
   */
  static getSemesterOrdinal(semesterNumber: number): string {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const value = semesterNumber % 100;
    return semesterNumber + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]);
  }

  /**
   * Calculate progress color based on percentage
   * @param percentage - Progress percentage
   */
  static getProgressColor(percentage: number): string {
    if (percentage >= 80) return 'blue';
    if (percentage >= 50) return 'blue';
    if (percentage >= 25) return 'yellow';
    return 'red';
  }

  /**
   * Format date for display
   * @param dateString - ISO date string
   */
  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Calculate days since enrollment
   * @param enrollmentDate - Enrollment date string
   */
  static getDaysSinceEnrollment(enrollmentDate: string): number {
    const enrollment = new Date(enrollmentDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - enrollment.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Validate enrollment request
   * @param request - Enrollment request to validate
   */
  static validateEnrollmentRequest(request: EnrollSubjectsRequest): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!request.semesterNumber || request.semesterNumber < 1) {
      errors.push('Invalid semester number');
    }

    if (!request.academicYearId || !request.academicYearId.trim()) {
      errors.push('Academic year is required');
    }

    if (!request.subjectIds || request.subjectIds.length === 0) {
      errors.push('At least one subject must be selected');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default StudentEnrollmentService;

