/**
 * API Response Types for React Query
 * 
 * This file contains TypeScript types for all API responses and request payloads
 * following MNC enterprise standards for type safety and consistency.
 * 
 * @author Student-ACT LMS Team
 * @version 1.0.0
 */

/**
 * Base API response structure
 * All API responses follow this consistent format
 */
export interface ApiResponse<T = unknown> {
  /** Indicates if the request was successful */
  success: boolean;
  /** Response data payload */
  data?: T;
  /** Error message if success is false */
  message?: string;
  /** Additional metadata */
  meta?: {
    /** Total count for paginated responses */
    total?: number;
    /** Current page number */
    page?: number;
    /** Items per page */
    limit?: number;
    /** Total number of pages */
    totalPages?: number;
  };
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Authentication related types
 */
export interface LoginRequest {
  email: string;
  password: string;
  selectedRole:string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  collegeId?: string;
  departmentId?: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * User related types
 */
export type UserRole = 'admin' | 'principal' | 'hod' | 'staff' | 'student';
export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  collegeId?: string;
  departmentId?: string;
  rollNumber?: string;
  year?: number;
  section?: string;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  college?: College;
  department?: Department;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  collegeId?: string;
  departmentId?: string;
  rollNumber?: string;
  year?: number;
  section?: string;
  password: string;
}

export interface UpdateUserRequest {
  name?: string;
  phone?: string;
  status?: UserStatus;
  collegeId?: string;
  departmentId?: string;
  rollNumber?: string;
  year?: number;
  section?: string;
}

/**
 * College related types
 */
export interface College {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  website?: string;
  establishedYear?: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateCollegeRequest {
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  website?: string;
  establishedYear?: number;
}

export interface UpdateCollegeRequest extends Partial<CreateCollegeRequest> {
  status?: 'active' | 'inactive';
}

/**
 * Department related types
 */
export interface Department {
  id: string;
  name: string;
  code: string;
  collegeId: string;
  hodId?: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  // Populated fields
  college?: College;
  hod?: User;
}

export interface CreateDepartmentRequest {
  name: string;
  code: string;
  collegeId: string;
  hodId?: string;
  description?: string;
}

export interface UpdateDepartmentRequest extends Partial<CreateDepartmentRequest> {
  status?: 'active' | 'inactive';
}

/**
 * Invitation related types
 */
export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  status: InvitationStatus;
  sentBy: string;
  collegeId?: string;
  departmentId?: string;
  invitationToken: string;
  sentAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  // Additional invitation fields
  name?: string;
  phone?: string;
  yearOfStudy?: number;
  section?: string;
  rollNumber?: string;
  academicYearId?: string;
  designation?: string;
  qualification?: string;
  experience?: number;
  // Populated fields
  sender?: User;
  college?: College;
  department?: Department;
}

export interface CreateInvitationRequest {
  email: string;
  role: UserRole;
  college_id?: string;
  department_id?: string;
  name?: string;
  phone?: string;
  yearOfStudy?: number;
  section?: string;
  rollNumber?: string;
  academicYearId?: string;
  designation?: string;
  qualification?: string;
  experience?: number;
}

export interface AcceptInvitationRequest {
  invitationToken: string;
  name: string;
  phone: string;
  password: string;
}

export interface ValidateInvitationResponse {
  id: string;
  email: string;
  role: UserRole;
  invitationToken: string;
  college?: College;
  department?: Department;
  expiresAt: string;
}

/**
 * Learning Resource related types
 */
export type ResourceStatus = 'available' | 'assigned' | 'in_progress' | 'completed' | 'archived';

export interface LearningResource {
  id: string;
  title: string;
  description?: string;
  category?: string;
  assignedStudentId?: string;
  status: ResourceStatus;
  startDate?: string;
  completionDate?: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  assignedStudent?: User;
  media?: ResourceMedia[];
}

export interface ResourceMedia {
  id: string;
  resourceId: string;
  mediaUrl: string;
  caption?: string;
  uploadedBy: string;
  uploadDate: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  // Populated fields
  uploader?: User;
}

export interface CreateResourceRequest {
  title: string;
  description?: string;
  category?: string;
  location?: string;
  notes?: string;
}

export interface UpdateResourceRequest extends Partial<CreateResourceRequest> {
  assignedStudentId?: string;
  status?: ResourceStatus;
  startDate?: string;
  completionDate?: string;
}

/**
 * Resource Enrollment related types
 */
export interface ResourceEnrollment {
  id: string;
  studentId: string;
  resourceId: string;
  enrolledAt: string;
  status: 'enrolled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  // Populated fields
  student?: User;
  resource?: LearningResource;
}

export interface MyTreeSelectionResponse {
  selection?: TreeSelection;
  availableTrees: Tree[];
  canSelect: boolean;
  message?: string;
}

/**
 * Registration Request related types
 */
export type RegistrationRequestStatus = 'pending' | 'approved' | 'rejected';

export interface RegistrationRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  collegeId?: string;
  departmentId?: string;
  rollNumber?: string;
  class?: string;
  semester?: string;
  batchYear?: number;
  yearOfStudy?: string;
  collegeName?: string;
  // Address fields
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  district?: string;
  pincode?: string;
  // Personal fields
  aadharNumber?: string;
  dateOfBirth?: string;
  // SPOC fields
  spocName?: string;
  spocEmail?: string;
  spocPhone?: string;
  status: RegistrationRequestStatus;
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  rejectionReason?: string;
  // Populated fields
  college?: College;
  department?: Department;
  processor?: User;
}

export interface CreateRegistrationRequestRequest {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  collegeId?: string;
  departmentId?: string;
  rollNumber?: string;
  year?: number;
  section?: string;
}

/**
 * Content Management related types
 */
export interface Guideline {
  id: string;
  title: string;
  content: string;
  category: string;
  order: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  creator?: User;
}

export interface Resource {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  category: string;
  isActive: boolean;
  uploadedBy: string;
  uploadedAt: string;
  // Populated fields
  uploader?: User;
}

/**
 * Dashboard related types
 */
export interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalTrees: number;
  treesPlanted: number;
  activeInvitations: number;
  pendingRequests: number;
  collegeStats?: {
    totalColleges: number;
    activeColleges: number;
  };
  departmentStats?: {
    totalDepartments: number;
    activeDepartments: number;
  };
}

export interface DashboardActivity {
  id: string;
  type: 'user_registered' | 'resource_enrolled' | 'invitation_sent' | 'request_approved';
  message: string;
  timestamp: string;
  userId?: string;
  // Populated fields
  user?: User;
}

/**
 * Error types for better error handling
 */
export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
  statusCode?: number;
}

/**
 * Query filter types
 */
export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  collegeId?: string;
  departmentId?: string;
  search?: string;
}

export interface InvitationFilters {
  status?: InvitationStatus;
  role?: UserRole;
  collegeId?: string;
  departmentId?: string;
  sentBy?: string;
}

export interface TreeFilters {
  status?: TreeStatus;
  species?: string;
  assignedStudentId?: string;
  healthStatus?: string;
  filterByStudentDepartment?: boolean;
}

export interface RegistrationRequestFilters {
  status?: RegistrationRequestStatus;
  role?: UserRole;
  collegeId?: string;
  departmentId?: string;
}

export interface State{
  id:string;
  name:string;
}

export interface District{
  id:string;
  name:string;
}