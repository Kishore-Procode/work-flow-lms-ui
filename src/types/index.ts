export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'principal' | 'hod' | 'staff' | 'student';
  phone: string;
  status: 'active' | 'inactive' | 'pending';
  collegeId?: string | null;
  college_id?: string | null;
  departmentId?: string | null;
  department_id?: string | null;
  courseId?: string | null;
  course_id?: string | null;
  academicYearId?: string | null;
  academic_year_id?: string | null;
  yearOfStudy?: string;
  year_of_study?: string;
  classInCharge?: string;
  class_in_charge?: string;
  class?: string;
  sectionId?: string | null;
  section_id?: string | null;
  semester?: string;
  rollNumber?: string;
  roll_number?: string;
  qualification?: string | null;
  experience?: string | null;
  employeeId?: string | null;
  employee_id?: string | null;
  createdAt: string;
  created_at?: string;
  lastLogin?: string;
  last_login?: string;
  updatedAt?: string;
  updated_at?: string;
  profile_image_url?: string;
  email_verified?: boolean;
  // Joined fields from related tables
  collegeName?: string;
  college_name?: string;
  departmentName?: string;
  department_name?: string;
  courseName?: string;
  course_name?: string;
  courseCode?: string;
  course_code?: string;
  sectionName?: string;
  section_name?: string;
  academicYearName?: string;
  academic_year_name?: string;
}

export interface College {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  established: string;
  principalId?: string;
  principal_id?: string;
  status: 'active' | 'inactive';
  departments?: string[];
  createdAt: string;
  updatedAt: string;
  // Additional fields from backend
  principalName?: string;
  principalEmail?: string;
  principalPhone?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  collegeId?: string;
  college_id?: string;
  hodId?: string | null;
  hod_id?: string | null;
  totalStudents?: number;
  total_students?: number;
  totalStaff?: number;
  total_staff?: number;
  established: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  // Additional fields from backend
  hodName?: string;
  collegeName?: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  sentBy: string;
  sentAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  expiresAt?: string;
  collegeId: string;
  departmentId?: string;
  invitationToken?: string;
  createdAt?: string;
  // Additional fields from backend joins
  sentByName?: string;
  collegeName?: string;
  departmentName?: string;
}

export interface RegistrationRequest {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy: string | null;
  collegeId: string | null;
  departmentId?: string;
  class?: string;
  rollNumber?: string;
  rejectionReason?: string;
  createdAt?: string;
  // Additional fields from backend joins
  collegeName?: string;
  departmentName?: string;
  reviewedByName?: string;
}

export interface LearningResource {
  id: string;
  resourceCode: string;
  title: string;
  category: string;
  startDate: string;
  description: string;
  status: 'assigned' | 'active' | 'completed' | 'archived' | 'inactive';
  assignedStudentId?: string;
  assignedDate?: string;
  collegeId: string;
  departmentId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Additional fields from backend joins
  studentName?: string;
  collegeName?: string;
  departmentName?: string;
}

export interface ProgressUpdate {
  id: string;
  resourceId: string;
  updateDate: string;
  progressPercentage?: number;
  description: string;
  mediaUrl?: string;
  semester: string;
  status: 'assigned' | 'active' | 'completed' | 'archived' | 'inactive';
  createdAt: string;
  // Additional fields from backend joins
  studentName?: string;
}