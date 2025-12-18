// Dashboard specific types for better TypeScript support
export interface DashboardStats {
  totalUsers: number;
  totalColleges: number;
  totalDepartments: number;
  totalResources: number;
  totalStaff: number;
  totalStudents: number;
  pendingInvitations: number;
  pendingRequests: number;
  activeUsers: number;
  departmentStaff: number;
  departmentStudents: number;
  activeClasses: number;
  assignedResources: number;
  availableResources: number;
  participationRate: number;
}

export interface DepartmentData {
  id: string;
  name: string;
  code?: string;
  dept?: string; // For chart display (department code)
  hodName?: string;
  hodId?: string;
  students: number;
  participated: number;
  availableResources: number;
  totalResources: number;
  percentage: number;
  missing: number;
  status: 'excellent' | 'good' | 'fair' | 'needs_improvement';
  // Additional fields from custom query
  collegeName?: string;
  districtName?: string;
  stateName?: string;
  principalName?: string;
  rank?: number;
}

export interface RecentActivity {
  type: 'user_created' | 'course_assignment' | 'registration_request' | 'user_activity';
  message: string;
  timestamp: string;
  status: string;
  details?: {
    courseCode?: string;
    title?: string;
    studentName?: string;
  };
}

export interface StudentWithMissingUpload {
  name: string;
  regNo: string;
  year: string;
  lastUpload: string;
  missed: number;
}

export interface ConsolidatedDashboardResponse {
  stats: DashboardStats;
  departmentData: DepartmentData[];
  recentActivity: RecentActivity[];
  lastUpdated: string;
}

export interface DashboardHookReturn {
  stats: DashboardStats;
  recentActivity: RecentActivity[];
  departmentData: DepartmentData[];
  departmentPerformance: DepartmentData[];
  studentsWithMissingUploads: StudentWithMissingUpload[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Learning Resource related types
export interface LearningResource {
  id: string;
  resourceCode: string;
  title: string;
  assignedStudentId?: string;
  departmentId: string;
  createdAt: string;
  assignedDate?: string;
  status: 'enrolled' | 'in_progress' | 'completed' | 'dropped';
}

// User related types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'principal' | 'hod' | 'staff' | 'student';
  status: 'active' | 'inactive';
  collegeId?: string;
  departmentId?: string;
  rollNumber?: string;
  semester?: number;
  createdAt: string;
  lastLogin?: string;
}

// Department related types
export interface Department {
  id: string;
  name: string;
  collegeId: string;
  hodId?: string;
  createdAt: string;
}

// Registration request types
export interface RegistrationRequest {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  departmentId: string;
  collegeId: string;
  createdAt: string;
}

// Admin Dashboard Types
export interface State {
  id: string;
  name: string;
  code: string;
}

export interface District {
  id: string;
  name: string;
}

export interface CollegeData {
  id: string;
  rank: number;
  name: string;
  principalName: string;
  principalId?: string;
  totalStudents: number;
  enrolledStudents: number;
  totalCourses: number;
  totalSections: number;
  totalDepartments: number;
  enrollmentRate: number;
  completionRate: number;
  stateName?: string;
  districtName?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  established?: string;
  status: 'excellent' | 'good' | 'fair' | 'needs_improvement';
  unenrolledStudents: number;
}

export interface AdminDashboardStats {
  totalColleges: number;
  totalStudents: number;
  totalEnrolledStudents: number;
  totalCourses: number;
  totalDepartments: number;
  overallEnrollmentRate: number;
  avgCompletionRate: number;
  excellentColleges: number;
  goodColleges: number;
  fairColleges: number;
  needsImprovementColleges: number;
}

export interface AdminDashboardData {
  stats: AdminDashboardStats;
  colleges: CollegeData[];
  filters: {
    stateId: string | null;
    districtId: string | null;
  };
  lastUpdated: string;
}
