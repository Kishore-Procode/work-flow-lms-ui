/**
 * Student Enrollment Types
 * 
 * Type definitions for student subject enrollment and learning system.
 * 
 * @author Student-ACT LMS Team
 * @version 1.0.0
 */

// ==================== ENUMS ====================

export type EnrollmentStatus = 'active' | 'completed' | 'dropped' | 'failed';

// ==================== CURRENT SEMESTER ====================

export interface CurrentSemesterRequest {
  // No request body needed - uses authenticated student ID
}

export interface CurrentSemesterResponse {
  studentId: string;
  studentName: string;
  courseType: string;
  courseName: string;
  departmentName: string;
  batchYear: number;
  currentSemester: number;
  academicYearId: string;
  academicYearName: string;
  semesterStartDate: string;
  semesterEndDate: string;
}

// ==================== AVAILABLE SUBJECTS ====================

export interface GetAvailableSubjectsRequest {
  semesterNumber: number;
}

export interface AvailableSubject {
  id: string;
  actSubjectCode: string;
  actSubjectName: string;
  actSubjectCredits: number;
  lmsLearningResourceId: string;
  isEnrolled: boolean;
}

export interface AvailableSubjectsResponse {
  semesterNumber: number;
  subjects: AvailableSubject[];
  totalSubjects: number;
  enrolledSubjects: number;
  contentMapMasterId: string;
  contentMapSemDetailsId: string;
}

// ==================== ENROLL SUBJECTS ====================

export interface EnrollSubjectsRequest {
  semesterNumber: number;
  academicYearId: string;
  subjectIds: string[];
}

export interface EnrolledSubject {
  enrollmentId: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  enrollmentDate: string;
}

export interface EnrollSubjectsResponse {
  enrolledSubjects: EnrolledSubject[];
  totalEnrolled: number;
  semesterNumber: number;
}

// ==================== ENROLLED SUBJECTS ====================

export interface GetEnrolledSubjectsRequest {
  semesterNumber?: number;
  academicYearId?: string;
}

export interface LessonPlan {
  id: string;
  moduleName: string;
  title: string;
  pdfUrl: string | null;
  duration: number | null;
}

export interface EnrolledSubjectDetail {
  enrollmentId: string;
  subjectId: string; // This is the content_map_sub_details_id
  subjectCode: string;
  subjectName: string;
  credits: number;
  semesterNumber: number;
  enrollmentDate: string;
  status: EnrollmentStatus;
  progressPercentage: number;
  completedAt: string | null;
  grade: string | null;
  marksObtained: number | null;
  totalMarks: number | null;
  lmsLearningResourceId: string;
  // Additional fields for UI enhancements
  regulationId: string | null;
  regulationName: string | null;
  syllabusPdfUrl: string | null;
  lessonPlans: LessonPlan[];
}

export interface EnrolledSubjectsResponse {
  enrollments: EnrolledSubjectDetail[];
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
}

// ==================== LEARNING CONTENT ====================

export interface GetLearningContentRequest {
  enrollmentId: string;
}

export interface LearningResource {
  id: string;
  title: string;
  description: string;
  resourceType: string;
  contentUrl: string;
  duration: number;
  order: number;
}

export interface LearningContentResponse {
  enrollmentId: string;
  subjectCode: string;
  subjectName: string;
  actSubjectId: string;
  // Course details from workflowmgmt.courses
  credits: number;
  courseType: string;
  durationWeeks: number;
  description: string | null;
  prerequisites: string | null;
  learningObjectives: string | null;
  learningOutcomes: string | null;
  // Syllabus content from workflowmgmt.syllabi
  syllabusContent: string | null;
  // Enrollment progress
  progressPercentage: number;
  status: EnrollmentStatus;
}

// ==================== UI STATE TYPES ====================

export interface EnrollmentFilters {
  semesterNumber?: number;
  academicYearId?: string;
  status?: EnrollmentStatus;
  searchQuery?: string;
}

export interface EnrollmentStats {
  totalSubjects: number;
  enrolledSubjects: number;
  completedSubjects: number;
  activeSubjects: number;
  averageProgress: number;
  totalCredits: number;
  earnedCredits: number;
}

// ==================== API RESPONSE WRAPPER ====================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ==================== ERROR TYPES ====================

export interface EnrollmentError {
  code: string;
  message: string;
  details?: any;
}

// ==================== COMPONENT PROPS ====================

export interface SubjectCardProps {
  subject: AvailableSubject;
  isSelected: boolean;
  onToggleSelect: (subjectId: string) => void;
  disabled?: boolean;
}

export interface EnrollmentCardProps {
  enrollment: EnrolledSubjectDetail;
  onViewContent: (enrollmentId: string) => void;
  onViewProgress: (enrollmentId: string) => void;
}

export interface SemesterInfoProps {
  semesterInfo: CurrentSemesterResponse;
}

export interface EnrollmentStatsProps {
  stats: EnrollmentStats;
}

// ==================== FORM TYPES ====================

export interface EnrollmentFormData {
  semesterNumber: number;
  academicYearId: string;
  selectedSubjects: string[];
}

// ==================== UTILITY TYPES ====================

export type SortField = 'subjectCode' | 'subjectName' | 'credits' | 'progress' | 'enrollmentDate';
export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  order: SortOrder;
}

// ==================== CONSTANTS ====================

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  dropped: 'Dropped',
  failed: 'Failed',
};

export const ENROLLMENT_STATUS_COLORS: Record<EnrollmentStatus, string> = {
  active: 'blue',
  completed: 'blue',
  dropped: 'gray',
  failed: 'red',
};

