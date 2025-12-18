/**
 * Subject Staff Assignment Types
 * 
 * Type definitions for HOD subject-staff assignment feature.
 * 
 * @author ACT-LMS Team
 * @version 1.0.0
 */

// ==================== SEMESTERS ====================

export interface HODSemester {
  semesterNumber: number;
  semesterName: string;
  totalSubjects: number;
  assignedSubjects: number;
  unassignedSubjects: number;
  contentMapSemDetailsId: string;
}

export interface HODSemestersResponse {
  departmentId: string;
  departmentName: string;
  semesters: HODSemester[];
}

// ==================== SUBJECTS FOR ASSIGNMENT ====================

export interface SubjectForAssignment {
  id: string; // content_map_sub_details_id
  subjectCode: string;
  subjectName: string;
  credits: number;
  assignedStaffId: string | null;
  assignedStaffName: string | null;
  assignedStaffEmail: string | null;
  assignedAt: string | null;
  assignmentId: string | null;
  isAssigned: boolean;
}

export interface SubjectsForAssignmentResponse {
  departmentId: string;
  departmentName: string;
  semesterNumber: number;
  academicYearId: string;
  subjects: SubjectForAssignment[];
  totalSubjects: number;
  assignedCount: number;
  unassignedCount: number;
}

// ==================== AVAILABLE STAFF ====================

export interface AssignedSubjectInfo {
  subjectCode: string;
  subjectName: string;
  semesterNumber: number;
}

export interface StaffForAssignment {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  designation: string | null;
  qualification: string | null;
  experience: string | null;
  assignedSubjectsCount: number;
  assignedSubjects: AssignedSubjectInfo[];
}

export interface AvailableStaffResponse {
  departmentId: string;
  departmentName: string;
  staff: StaffForAssignment[];
  totalStaff: number;
}

// ==================== ASSIGNMENT OPERATIONS ====================

export interface AssignStaffRequest {
  contentMapSubDetailsId: string;
  staffId: string;
  semesterNumber: number;
  academicYearId: string;
  notes?: string;
}

export interface AssignmentDetails {
  assignmentId: string;
  subjectCode: string;
  subjectName: string;
  staffName: string;
  staffEmail: string;
  assignedAt: string;
}

export interface AssignStaffResponse {
  success: boolean;
  message: string;
  assignment: AssignmentDetails;
}

export interface RemoveAssignmentResponse {
  success: boolean;
  message: string;
}

// ==================== API RESPONSE WRAPPER ====================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
