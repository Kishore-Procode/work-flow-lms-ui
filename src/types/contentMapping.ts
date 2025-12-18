/**
 * Content Mapping TypeScript Types
 * 
 * Type definitions for the LMS Content Mapping feature.
 * Defines interfaces for API requests, responses, and UI state management.
 * 
 * @author Student-ACT LMS Team
 * @version 1.0.0
 */

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export type CourseTypeMapping = 'UG' | 'PG' | 'Diploma' | 'Certificate';
export type ContentMappingStatus = 'pending' | 'in_progress' | 'completed' | 'inactive';

// ============================================================================
// DROPDOWN OPTION TYPES
// ============================================================================

export interface DropdownOption {
  value: string;
  label: string;
  code?: string;
}

export interface DropdownData {
  courseTypes: DropdownOption[];
  lmsCourses: DropdownOption[];
  lmsDepartments: DropdownOption[];
  lmsAcademicYears: DropdownOption[];
  actDepartments: DropdownOption[];
  actRegulations: DropdownOption[];
}

// ============================================================================
// FORM DATA TYPES
// ============================================================================

export interface ContentMappingFormData {
  courseType: CourseTypeMapping | '';
  lmsCourseId: string;
  lmsDepartmentId: string;
  lmsAcademicYearId: string;
  actDepartmentId: string;
  actRegulationId: string;
}

export interface ContentMappingFormErrors {
  courseType?: string;
  lmsCourseId?: string;
  lmsDepartmentId?: string;
  lmsAcademicYearId?: string;
  actDepartmentId?: string;
  actRegulationId?: string;
}

// ============================================================================
// SEMESTER DETAILS TYPES
// ============================================================================

export interface SemesterDetail {
  id: string;
  semesterNumber: number;
  semesterName: string;
  totalSubjects: number;
  mappedSubjects: number;
  mappingProgress: number;
  status: ContentMappingStatus;
}

export interface SemesterDetailsTableProps {
  semesters: SemesterDetail[];
  onAssignSubjects: (semesterDetailId: string) => void;
  loading?: boolean;
}

// ============================================================================
// SUBJECT DETAILS TYPES
// ============================================================================

export interface SubjectDetail {
  id: string;
  actSubjectId: string;
  actSubjectCode: string;
  actSubjectName: string;
  actSubjectCredits: number;
  lmsLearningResourceId?: string;
  lmsLearningResourceTitle?: string;
  isMapped: boolean;
  mappedAt?: string;
  mappedBy?: string;
  status: ContentMappingStatus;
}

export interface SubjectAssignment {
  subjectId: string;
  lmsLearningResourceId: string;
}

export interface SubjectAssignmentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  semesterDetailId: string;
  semesterName: string;
  subjects: SubjectDetail[];
  learningResources: DropdownOption[];
  onAssign: (assignments: SubjectAssignment[]) => void;
  loading?: boolean;
}

// ============================================================================
// API REQUEST TYPES
// ============================================================================

export interface GetDropdownDataRequest {
  courseType?: string;
  lmsCourseId?: string;
  lmsDepartmentId?: string;
  actDepartmentId?: string;
}

export interface LoadSemestersRequest {
  courseType: CourseTypeMapping;
  lmsCourseId: string;
  lmsDepartmentId: string;
  lmsAcademicYearId: string;
  actDepartmentId: string;
  actRegulationId: string;
}

export interface GetSubjectsRequest {
  contentMapSemDetailsId: string;
}

export interface AssignSubjectsRequest {
  contentMapSemDetailsId: string;
  assignments: SubjectAssignment[];
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}

export interface GetDropdownDataResponse {
  courseTypes: DropdownOption[];
  lmsCourses: DropdownOption[];
  lmsDepartments: DropdownOption[];
  lmsAcademicYears: DropdownOption[];
  actDepartments: DropdownOption[];
  actRegulations: DropdownOption[];
}

export interface LoadSemestersResponse {
  contentMapMasterId: string;
  semesters: SemesterDetail[];
  message: string;
}

export interface GetSubjectsResponse {
  contentMapSemDetailsId: string;
  subjects: SubjectDetail[];
  totalSubjects: number;
  mappedSubjects: number;
  unmappedSubjects: number;
  mappingProgress: number;
}

export interface AssignSubjectsResponse {
  contentMapSemDetailsId: string;
  assignedCount: number;
  totalSubjects: number;
  mappedSubjects: number;
  mappingProgress: number;
  message: string;
  assignedSubjects: {
    id: string;
    actSubjectCode: string;
    actSubjectName: string;
    lmsLearningResourceId: string;
    lmsLearningResourceTitle: string;
  }[];
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface ContentMappingState {
  // Form state
  formData: ContentMappingFormData;
  formErrors: ContentMappingFormErrors;
  isFormValid: boolean;

  // Dropdown data
  dropdownData: DropdownData | null;
  dropdownLoading: boolean;

  // Semester data
  semesters: SemesterDetail[];
  semestersLoading: boolean;
  contentMapMasterId: string | null;

  // Subject assignment popup
  assignmentPopup: {
    isOpen: boolean;
    semesterDetailId: string | null;
    semesterName: string;
    subjects: SubjectDetail[];
    loading: boolean;
  };

  // General loading states
  loading: boolean;
  error: string | null;
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

export interface ContentMappingFormProps {
  formData: ContentMappingFormData;
  formErrors: ContentMappingFormErrors;
  dropdownData: DropdownData | null;
  dropdownLoading: boolean;
  onFormChange: (field: keyof ContentMappingFormData, value: string) => void;
  onLoadSemesters: () => void;
  loading?: boolean;
}

export interface ContentMappingScreenProps {
  // No props needed - this is the main screen component
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: ContentMappingFormErrors;
}

export interface CascadingDropdownState {
  courseType: CourseTypeMapping | '';
  lmsCourseId: string;
  lmsDepartmentId: string;
  actDepartmentId: string;
}

// ============================================================================
// HOOK TYPES
// ============================================================================

export interface UseContentMappingReturn {
  // State
  state: ContentMappingState;
  
  // Actions
  updateFormField: (field: keyof ContentMappingFormData, value: string) => void;
  loadDropdownData: (params?: GetDropdownDataRequest) => Promise<void>;
  loadSemesters: () => Promise<void>;
  openAssignmentPopup: (semesterDetailId: string) => Promise<void>;
  closeAssignmentPopup: () => void;
  assignSubjects: (assignments: SubjectAssignment[]) => Promise<void>;
  resetForm: () => void;
  
  // Computed values
  isFormValid: boolean;
  canLoadSemesters: boolean;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ContentMappingError {
  code: string;
  message: string;
  field?: keyof ContentMappingFormData;
}

export interface ApiError {
  status: number;
  message: string;
  details?: any;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Course types are now fetched from the API via GetDropdownDataResponse
// No longer hardcoded - they come from the database course_types table

export const CONTENT_MAPPING_STATUS_LABELS: Record<ContentMappingStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  inactive: 'Inactive'
};

export const CONTENT_MAPPING_STATUS_COLORS: Record<ContentMappingStatus, string> = {
  pending: 'text-yellow-600',
  in_progress: 'text-blue-600',
  completed: 'text-blue-600',
  inactive: 'text-gray-600'
};

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_FORM_DATA: ContentMappingFormData = {
  courseType: '',
  lmsCourseId: '',
  lmsDepartmentId: '',
  lmsAcademicYearId: '',
  actDepartmentId: '',
  actRegulationId: ''
};

export const DEFAULT_DROPDOWN_DATA: DropdownData = {
  courseTypes: [],
  lmsCourses: [],
  lmsDepartments: [],
  lmsAcademicYears: [],
  actDepartments: [],
  actRegulations: []
};
