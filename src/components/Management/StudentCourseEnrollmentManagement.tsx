import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Users,
  BookOpen,
  Search,
  Filter,
  Download,
  CheckSquare,
  Square,
  Eye,
  UserPlus,
  Calendar,
  MapPin,
  GraduationCap,
  Building2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ApiService, getImageUrl } from '../../services/api';
import EnhancedPagination from '../UI/EnhancedPagination';
import LoadingSpinner from '../UI/LoadingSpinner';

// Interfaces
interface Student {
  id: string;
  name: string;
  email: string;
  registrationNumber?: string;
  studentId?: string;
  departmentId: string;
  departmentName: string;
  courseId?: string;
  courseName?: string;
  academicYearId: string;
  academicYearName: string;
  section?: string;
  yearOfStudy: number;
  currentSemester: number;
  resourceAssignment?: {
    id: string;
    resourceId: string;
    resourceCode: string;
    title: string;
    category: string;
    assignedDate: string;
    status: string;
    progress?: number;
  };
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

interface LearningResource {
  id: string;
  resourceCode: string;
  title: string;
  category: string;
  description?: string;
  status: string;
  departmentId: string;
  departmentName: string;
  collegeId: string;
  collegeName: string;
  assignedStudentId?: string;
  assignedDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface Department {
  id: string;
  name: string;
  collegeId: string;
}

interface Filters {
  search?: string;
  departmentId?: string;
  assignmentStatus?: 'all' | 'assigned' | 'unassigned';
  academicYearId?: string;
  page?: number;
  limit?: number;
}

const StudentCourseEnrollmentManagement: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<Filters>({
    search: '',
    departmentId: '',
    assignmentStatus: 'all',
    academicYearId: '',
    page: 1,
    limit: 10
  });
  const [appliedFilters, setAppliedFilters] = useState<Filters>({
    search: '',
    departmentId: '',
    assignmentStatus: 'all',
    academicYearId: '',
    page: 1,
    limit: 10
  });

  // Selection state
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showStudentDetails, setShowStudentDetails] = useState<Student | null>(null);

  // Auto-set department filter for HOD/Staff
  useEffect(() => {
    if ((user?.role === 'hod' || user?.role === 'staff') && user?.departmentId) {
      setFilters(prev => ({ ...prev, departmentId: user.departmentId }));
    }
  }, [user]);

  // Apply filters with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedFilters(filters);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters]);

  // Update search filter
  useEffect(() => {
    setFilters(prev => ({ ...prev, search: searchInput, page: 1 }));
  }, [searchInput]);

  // Fetch students
  const {
    data: studentsResponse,
    isLoading: studentsLoading,
    error: studentsError
  } = useQuery({
    queryKey: ['students-with-enrollments', appliedFilters],
    queryFn: () => ApiService.getStudentsWithTreeAssignments(appliedFilters),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 3, // 3 minutes
  });

  const students = studentsResponse?.data || [];
  const pagination = studentsResponse?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 };

  // Fetch departments for filter
  const { data: departments = [] } = useQuery({
    queryKey: ['departments', user?.collegeId],
    queryFn: () => {
      if (user?.role === 'admin') {
        return ApiService.getDepartments();
      } else if (user?.collegeId) {
        return ApiService.getDepartmentsByCollege(user.collegeId);
      }
      return [];
    },
    enabled: !!user && (user.role === 'admin' || user.role === 'principal'),
  });

  // Fetch academic years
  const { data: academicYears = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => ApiService.getAcademicYears(),
  });

  // Fetch available learning resources for assignment
  const { data: availableResources = [] } = useQuery({
    queryKey: ['available-learning-resources', appliedFilters.departmentId],
    queryFn: () => ApiService.getAvailableTrees({ 
      departmentId: appliedFilters.departmentId || user?.departmentId 
    }),
    enabled: showAssignmentModal,
  });

  // Bulk assignment mutation
  const bulkAssignMutation = useMutation({
    mutationFn: (data: { studentIds: string[], resourceId: string }) => 
      ApiService.bulkAssignTrees(data.studentIds, data.resourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students-with-enrollments'] });
      toast.success('Learning resources assigned successfully');
      setSelectedStudents(new Set());
      setShowAssignmentModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to assign learning resources');
    },
  });

  // Individual assignment mutation
  const assignMutation = useMutation({
    mutationFn: (data: { studentId: string, resourceId: string }) => 
      ApiService.assignTreeToStudent(data.studentId, data.resourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students-with-enrollments'] });
      toast.success('Learning resource assigned successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to assign learning resource');
    },
  });

  // Unassignment mutation
  const unassignMutation = useMutation({
    mutationFn: (assignmentId: string) => ApiService.unassignTree(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students-with-enrollments'] });
      toast.success('Learning resource unassigned successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to unassign learning resource');
    },
  });

  // Event handlers
  const handleSelectStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(students.map(s => s.id)));
    }
  };

  const handleBulkAssign = (resourceId: string) => {
    if (selectedStudents.size === 0) {
      toast.error('Please select students to assign');
      return;
    }
    bulkAssignMutation.mutate({
      studentIds: Array.from(selectedStudents),
      resourceId
    });
  };

  const handleIndividualAssign = (studentId: string, resourceId: string) => {
    assignMutation.mutate({ studentId, resourceId });
  };

  const handleUnassign = (assignmentId: string) => {
    if (window.confirm('Are you sure you want to unassign this learning resource?')) {
      unassignMutation.mutate(assignmentId);
    }
  };

  const exportData = () => {
    // Implementation for exporting student enrollment data
    toast.info('Export functionality will be implemented');
  };

  if (studentsLoading && !students.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading student enrollments..." />
      </div>
    );
  }

  if (studentsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">Failed to load student enrollment data.</p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['students-with-enrollments'] })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Users className="mr-3 w-8 h-8 text-blue-600" />
                Student Course Enrollment Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage student course assignments and track enrollment status
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={exportData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </button>
              {selectedStudents.size > 0 && (
                <button
                  onClick={() => setShowAssignmentModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign Courses ({selectedStudents.size})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{pagination.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Enrolled</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {students.filter(s => s.resourceAssignment).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Not Enrolled</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {students.filter(s => !s.resourceAssignment).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Selected</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{selectedStudents.size}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Students
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by name, email, or registration number..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {(user?.role === 'admin' || user?.role === 'principal') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={filters.departmentId}
                  onChange={(e) => setFilters(prev => ({ ...prev, departmentId: e.target.value, page: 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept: Department) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enrollment Status
              </label>
              <select
                value={filters.assignmentStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, assignmentStatus: e.target.value as any, page: 1 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Students</option>
                <option value="assigned">Enrolled</option>
                <option value="unassigned">Not Enrolled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <StudentsTable
          students={students}
          pagination={pagination}
          selectedStudents={selectedStudents}
          onSelectStudent={handleSelectStudent}
          onSelectAll={handleSelectAll}
          onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
          onLimitChange={(limit) => setFilters(prev => ({ ...prev, limit, page: 1 }))}
          onViewDetails={setShowStudentDetails}
          onAssign={handleIndividualAssign}
          onUnassign={handleUnassign}
          userRole={user?.role || ''}
          availableResources={availableResources}
          isLoading={studentsLoading}
        />

        {/* Modals */}
        {showAssignmentModal && (
          <BulkAssignmentModal
            selectedStudents={Array.from(selectedStudents)}
            availableResources={availableResources}
            onClose={() => setShowAssignmentModal(false)}
            onAssign={handleBulkAssign}
            isLoading={bulkAssignMutation.isPending}
          />
        )}

        {showStudentDetails && (
          <StudentDetailsModal
            student={showStudentDetails}
            onClose={() => setShowStudentDetails(null)}
          />
        )}
      </div>
    </div>
  );
};

// Students Table Component
interface StudentsTableProps {
  students: Student[];
  pagination: any;
  selectedStudents: Set<string>;
  onSelectStudent: (studentId: string) => void;
  onSelectAll: () => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onViewDetails: (student: Student) => void;
  onAssign: (studentId: string, resourceId: string) => void;
  onUnassign: (assignmentId: string) => void;
  userRole: string;
  availableResources: LearningResource[];
  isLoading: boolean;
}

const StudentsTable: React.FC<StudentsTableProps> = ({
  students,
  pagination,
  selectedStudents,
  onSelectStudent,
  onSelectAll,
  onPageChange,
  onLimitChange,
  onViewDetails,
  onAssign,
  onUnassign,
  userRole,
  availableResources,
  isLoading
}) => {
  if (!students.length && !isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Students Found</h3>
        <p className="text-gray-600">No students match your current filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onSelectAll}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              {selectedStudents.size === students.length ? (
                <CheckSquare className="w-4 h-4 mr-2" />
              ) : (
                <Square className="w-4 h-4 mr-2" />
              )}
              Select All
            </button>
            <div className="text-sm text-gray-600">
              Total: {pagination.total} students
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Academic Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Course Enrollment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <StudentRow
                key={student.id}
                student={student}
                isSelected={selectedStudents.has(student.id)}
                onSelect={() => onSelectStudent(student.id)}
                onViewDetails={() => onViewDetails(student)}
                onAssign={onAssign}
                onUnassign={onUnassign}
                userRole={userRole}
                availableResources={availableResources}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200">
        <EnhancedPagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={onPageChange}
          onItemsPerPageChange={onLimitChange}
        />
      </div>
    </div>
  );
};

export default StudentCourseEnrollmentManagement;
