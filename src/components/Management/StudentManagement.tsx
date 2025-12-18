import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Edit,
  Trash2,
  GraduationCap,
  Mail,
  Phone,
  User,
  Search,
  Building,
  Filter,
  X,
  Eye,
  EyeOff,
  Upload,
} from 'lucide-react';
import { User as UserType, Department } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { ApiService } from '../../services/api';
import { useToast } from '../UI/Toast';
import { ConfirmModal } from '../UI/Modal';
import EnhancedPagination, { PaginationInfo } from '../UI/EnhancedPagination';
import LoadingSpinner from '../UI/LoadingSpinner';
import {
  applyRoleBasedFilters,
  createPaginationInfo,
  extractDataArray,
} from '../../utils/filterUtils';
import { StudentProfileModal } from './StudentProfileModal';
import BulkStudentUpload from '../BulkUpload/BulkStudentUpload';
import { queryKeys } from '../../lib/react-query';

const StudentManagement: React.FC = () => {
  const { user } = useAuth();
  const toastHook = useToast();
  const queryClient = useQueryClient();

  // Pagination and filter states
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
    search: '',
    role: 'student',
    departmentId: '',
    class: '',
    status: '',
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<UserType | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileStudent, setProfileStudent] = useState<UserType | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  // Apply role-based filtering and clean empty values
  const appliedFilters = applyRoleBasedFilters(filters, user);

  // Fetch students with React Query
  const {
    data: studentsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.users.list(appliedFilters),
    queryFn: () => ApiService.getUsers(appliedFilters),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 3, // 3 minutes
  });

  // Fetch departments for filters
  const { data: departmentsResponse } = useQuery({
    queryKey: user?.collegeId
      ? queryKeys.departments.byCollege(user.collegeId)
      : queryKeys.departments.all,
    queryFn: () =>
      user?.collegeId
        ? ApiService.getDepartmentsByCollege(user.collegeId)
        : ApiService.getDepartments(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Process data
  const students = extractDataArray(studentsResponse);
  const departments = extractDataArray(departmentsResponse);
  const pagination: PaginationInfo = createPaginationInfo(studentsResponse);

  // Mutations
  const createStudentMutation = useMutation({
    mutationFn: (data: any) => ApiService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success('Student created successfully');
      setShowAddForm(false);
      setSelectedStudent(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create student');
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => ApiService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success('Student updated successfully');
      setShowAddForm(false);
      setSelectedStudent(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update student');
    },
  });

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  };

  // Filter handlers
  const handleSearchChange = (search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }));
  };

  const handleDepartmentFilter = (departmentId: string) => {
    setFilters(prev => ({ ...prev, departmentId, page: 1 }));
  };

  const handleClassFilter = (classValue: string) => {
    setFilters(prev => ({ ...prev, class: classValue, page: 1 }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({ ...prev, status, page: 1 }));
  };

  const clearFilters = () => {
    setFilters(prev => ({
      ...prev,
      search: '',
      departmentId: '',
      class: '',
      status: '',
      page: 1,
    }));
  };

  // Form handlers
  const handleAddStudent = () => {
    setSelectedStudent(null);
    setShowAddForm(true);
  };

  const handleEditStudent = (student: UserType) => {
    setSelectedStudent(student);
    setShowAddForm(true);
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudentToDelete(studentId);
    setShowDeleteConfirm(true);
  };

  const handleBulkUploadSuccess = () => {
    // Refresh the student list
    refetch();
    // Close the bulk upload modal after a short delay to allow users to see the results
    setTimeout(() => {
      setShowBulkUpload(false);
    }, 2000);
    // Show success message
    toastHook.success(
      'Bulk upload completed!',
      'Students have been added and the list has been refreshed. Check your email for invitation confirmations.'
    );
  };

  const getDepartmentName = (departmentId: string | null) => {
    if (!departmentId) return 'Not Assigned';
    const department = departments.find(d => d.id === departmentId);
    return department?.name || 'Unknown Department';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-blue-100 text-blue-800',
      inactive: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;

    try {
      await ApiService.deleteUser(studentToDelete);
      toast.success('Student removed successfully!');
      // Refresh the students list
      refetch();
    } catch (error) {
      console.error('Failed to delete student:', error);
      toast.error('Failed to remove student');
    } finally {
      setStudentToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className='p-6'>
        <div className='animate-pulse space-y-4'>
          <div className='h-8 bg-gray-200 rounded w-1/4'></div>
          <div className='h-32 bg-gray-200 rounded'></div>
        </div>
      </div>
    );
  }

  return (
    <div className='p-6'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Student Management</h1>
          <p className='text-gray-600'>
            Manage your{' '}
            {user?.role === 'staff' ? 'class' : user?.role === 'hod' ? 'department' : 'college'}{' '}
            students
          </p>
        </div>
        {(user?.role === 'admin' ||
          user?.role === 'principal' ||
          user?.role === 'hod' ||
          user?.role === 'staff') && (
          <div className='flex space-x-3'>
            <button
              onClick={() => setShowBulkUpload(true)}
              className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2'
            >
              <Upload className='w-4 h-4' />
              <span>Bulk Upload</span>
            </button>
            <button
              onClick={handleAddStudent}
              className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2'
            >
              <Plus className='w-4 h-4' />
              <span>Add Student</span>
            </button>
          </div>
        )}
      </div>

      {/* Search and Filter Bar */}
      <div className='bg-white p-4 rounded-xl border border-gray-200 mb-6'>
        <div className='flex flex-col lg:flex-row gap-4'>
          {/* Search */}
          <div className='flex-1'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none' />
              <input
                type='text'
                placeholder='Search by name, email, phone, or roll number...'
                value={filters.search}
                onChange={e => handleSearchChange(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className='flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors'
          >
            <Filter className='w-4 h-4' />
            <span>Filters</span>
            {(filters.departmentId || filters.class || filters.status) && (
              <span className='bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                {[filters.departmentId, filters.class, filters.status].filter(Boolean).length}
              </span>
            )}
          </button>

          {/* Clear Filters */}
          {(filters.search || filters.departmentId || filters.class || filters.status) && (
            <button
              onClick={clearFilters}
              className='flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors'
            >
              <X className='w-4 h-4' />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className='mt-4 pt-4 border-t border-gray-200'>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              {/* Department Filter */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Department</label>
                <select
                  value={filters.departmentId}
                  onChange={e => handleDepartmentFilter(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option value=''>All Departments</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Class Filter */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Class</label>
                <select
                  value={filters.class}
                  onChange={e => handleClassFilter(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option value=''>All Classes</option>
                  <option value='1st Year'>1st Year</option>
                  <option value='2nd Year'>2nd Year</option>
                  <option value='3rd Year'>3rd Year</option>
                  <option value='4th Year'>4th Year</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Status</label>
                <select
                  value={filters.status}
                  onChange={e => handleStatusFilter(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option value=''>All Status</option>
                  <option value='active'>Active</option>
                  <option value='inactive'>Inactive</option>
                  <option value='pending'>Pending</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className='mt-4 text-sm text-gray-600'>
          Showing {students.length} students {pagination.total > 0 && `(${pagination.total} total)`}
        </div>
      </div>

      {/* Students Table */}
      <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
        {students.length > 0 || isLoading ? (
          <>
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Name
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Email
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Roll Number
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Phone
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Department
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Status
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Year of Study
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className='px-6 py-12 text-center'>
                        <LoadingSpinner />
                        <p className='mt-2 text-sm text-gray-500'>Loading students...</p>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={8} className='px-6 py-12 text-center'>
                        <p className='text-red-600'>Error loading students: {error.message}</p>
                        <button
                          onClick={() => refetch()}
                          className='mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={8} className='px-6 py-12 text-center'>
                        <GraduationCap className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                        <p className='text-gray-500'>No students found</p>
                      </td>
                    </tr>
                  ) : (
                    students.map(student => (
                      <tr key={student.id} className='hover:bg-gray-50'>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='flex items-center'>
                            <div className='w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center'>
                              <GraduationCap className='w-5 h-5 text-gray-600' />
                            </div>
                            <div className='ml-4'>
                              <div className='text-sm font-medium text-gray-900'>
                                {student.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {student.email}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {student.rollNumber || 'N/A'}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {student.phone || 'N/A'}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {getDepartmentName(student.departmentId)}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(student.status)}`}
                          >
                            {student.status.toUpperCase()}
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {(student as any).yearOfStudy ||
                            (student as any).year_of_study ||
                            (student as any).academicYearName ||
                            (student as any).academic_year_name ||
                            'N/A'}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                          <div className='flex space-x-2'>
                            <button
                              onClick={() => {
                                setProfileStudent(student);
                                setShowProfileModal(true);
                              }}
                              className='text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded'
                              title='View Profile'
                            >
                              <Eye className='w-4 h-4' />
                            </button>
                            {/* <button
                            onClick={() => handleEditStudent(student)}
                            className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                            title="Edit Student"
                          >
                            <Edit className="w-4 h-4" />
                          </button> */}
                            <button
                              onClick={() => handleDeleteStudent(student.id)}
                              className='text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded'
                              title='Delete Student'
                            >
                              <Trash2 className='w-4 h-4' />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!isLoading && !error && pagination.total > 0 && (
              <div className='bg-white px-6 py-4 border-t border-gray-200'>
                <EnhancedPagination
                  pagination={pagination}
                  onPageChange={handlePageChange}
                  onLimitChange={handleLimitChange}
                  disabled={isLoading}
                />
              </div>
            )}
          </>
        ) : (
          <div className='text-center py-12'>
            <GraduationCap className='w-16 h-16 text-gray-300 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>No students found</h3>
            <p className='text-gray-500 mb-4'>
              Start by adding students to your{' '}
              {user?.role === 'staff' ? 'class' : user?.role === 'hod' ? 'department' : 'college'}.
            </p>
            {(user?.role === 'admin' || user?.role === 'principal' || user?.role === 'hod') && (
              <button
                onClick={handleAddStudent}
                className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'
              >
                Add First Student
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <StudentForm
          student={selectedStudent}
          onClose={() => setShowAddForm(false)}
          onSave={() => {
            // Refresh the students list
            refetch();
            setShowAddForm(false);
            setSelectedStudent(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setStudentToDelete(null);
        }}
        onConfirm={confirmDeleteStudent}
        title='Delete Student'
        message='Are you sure you want to remove this student? This action cannot be undone.'
        confirmText='Delete'
        type='danger'
      />

      {/* Student Profile Modal */}
      {profileStudent && (
        <StudentProfileModal
          student={profileStudent}
          isOpen={showProfileModal}
          onClose={() => {
            setShowProfileModal(false);
            setProfileStudent(null);
          }}
          onUpdate={updatedStudent => {
            // Update the student in the list
            queryClient.invalidateQueries({ queryKey: ['students'] });
            setProfileStudent(updatedStudent);
          }}
        />
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-xl font-bold text-gray-900'>Bulk Upload Students</h2>
              <button
                onClick={() => setShowBulkUpload(false)}
                className='text-gray-400 hover:text-gray-600 transition-colors'
              >
                <X className='w-6 h-6' />
              </button>
            </div>
            <BulkStudentUpload onSuccess={handleBulkUploadSuccess} />
          </div>
        </div>
      )}
    </div>
  );
};

// Student Form Component
interface StudentFormProps {
  student: UserType | null;
  onClose: () => void;
  onSave: (student: UserType) => void;
}

const StudentForm: React.FC<StudentFormProps> = ({ student, onClose, onSave }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Information (from Student Registration)
    firstName: student?.name?.split(' ')[0] || '',
    lastName: student?.name?.split(' ').slice(1).join(' ') || '',
    email: student?.email || '',
    phone: student?.phone || '',
    password: '', // Required for new students
    confirmPassword: '',

    // Academic Information (from Student Registration)
    registrationNumber: student?.rollNumber || student?.roll_number || '',
    collegeId: user?.collegeId || '',
    departmentId: student?.departmentId || student?.department_id || '',
    courseId: student?.courseId || student?.course_id || '',
    yearOfStudy: student?.yearOfStudy || student?.year_of_study || '',
    sectionId: student?.sectionId || student?.section_id || '',

    // System fields
    class: student?.class || '',
  });

  // Form data states for course selection
  const [colleges, setColleges] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [filteredSections, setFilteredSections] = useState<any[]>([]);

  // Get college name from colleges array
  const userCollege = colleges.find(college => college.id === user?.collegeId);
  const collegeName = userCollege?.name || 'Loading...';

  // Load courses and colleges when component mounts
  useEffect(() => {
    loadFormData();
  }, []);

  // Load courses for the selected department when editing
  useEffect(() => {
    if (student && formData.departmentId && courses.length > 0) {
      const departmentCourses = courses.filter(
        course => course.departmentId === formData.departmentId
      );
      setFilteredCourses(departmentCourses);
    }
  }, [student, formData.departmentId, courses]);

  const loadFormData = async () => {
    try {
      const [collegesData, coursesData, departmentsData] = await Promise.all([
        ApiService.getColleges(),
        ApiService.getCourses(),
        ApiService.getDepartments(),
      ]);
      setColleges(Array.isArray(collegesData) ? collegesData : (collegesData as any).data || []);
      setCourses(Array.isArray(coursesData) ? coursesData : (coursesData as any).data || []);

      // Filter departments by user's college
      const allDepartments = Array.isArray(departmentsData)
        ? departmentsData
        : (departmentsData as any).data || [];
      const userCollegeDepartments = allDepartments.filter(
        (dept: any) => dept.collegeId === user?.collegeId
      );
      setFilteredDepartments(userCollegeDepartments);
    } catch (error) {
      console.error('Failed to load form data:', error);
    }
  };

  // Filter courses when department changes
  useEffect(() => {
    if (formData.departmentId) {
      const departmentCourses = courses.filter(
        course => course.departmentId === formData.departmentId
      );
      setFilteredCourses(departmentCourses);

      // Reset course selection if current course is not in the new department
      if (formData.courseId && !departmentCourses.find(c => c.id === formData.courseId)) {
        setFormData(prev => ({ ...prev, courseId: '', yearOfStudy: '', sectionId: '' }));
      }
    } else {
      setFilteredCourses([]);
      setFormData(prev => ({ ...prev, courseId: '', yearOfStudy: '', sectionId: '' }));
    }
  }, [formData.departmentId, courses]);

  // Load academic years when course changes (following login screen logic)
  useEffect(() => {
    const loadAcademicYearsByCourse = async () => {
      if (formData.courseId) {
        try {
          console.log('Loading academic years for course:', formData.courseId); 
          debugger
          const courseAcademicYears = await ApiService.getAcademicYearsByCourse(formData.courseId);
          console.log('Academic years loaded for course:', courseAcademicYears);
          setAcademicYears(courseAcademicYears || []);

          // Reset dependent fields
          setFormData(prev => ({ ...prev, yearOfStudy: '', sectionId: '' }));
          setFilteredSections([]);
        } catch (error) {
          console.error('Failed to load academic years for course:', error);
          setAcademicYears([]);
        }
      } else {
        setAcademicYears([]);
        setFilteredSections([]);
      }
    };

    loadAcademicYearsByCourse();
  }, [formData.courseId]);

  // Load sections when course, department and year are selected (following login screen logic)
  useEffect(() => {
    const loadSectionsByCourseDepYear = async () => {
      if (formData.courseId && formData.departmentId && formData.yearOfStudy) {
        try {
          // Find the academic year ID from the yearOfStudy name
          const selectedAcademicYear = academicYears.find(
            year => year.yearName === formData.yearOfStudy
          );
          if (!selectedAcademicYear) {
            console.warn('Academic year not found for:', formData.yearOfStudy);
            setFilteredSections([]);
            return;
          }

          console.log(
            'Loading sections for course, department and year:',
            formData.courseId,
            formData.departmentId,
            selectedAcademicYear.id
          );
          const courseSections = await ApiService.getSectionsByCourseDepYear(
            formData.courseId,
            formData.departmentId,
            selectedAcademicYear.id
          );
          console.log('Sections loaded for course, department and year:', courseSections);
          setFilteredSections(courseSections || []);

          // Reset section field
          setFormData(prev => ({ ...prev, sectionId: '' }));
        } catch (error) {
          console.error('Failed to load sections for course, department and year:', error);
          setFilteredSections([]);
        }
      } else {
        setFilteredSections([]);
      }
    };

    loadSectionsByCourseDepYear();
  }, [formData.courseId, formData.departmentId, formData.yearOfStudy, academicYears]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.phone ||
      !formData.registrationNumber
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!student?.id && !formData.password) {
      toast.error('Password is required for new students');
      return;
    }

    if (!student?.id && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
  
    const academic_year_id = academicYears.filter(x => x.yearName == formData.yearOfStudy);
    console.log(academic_year_id, 'academic_year_id');
    try {
      // debugger
      const studentData = {
        name: fullName,
        email: formData.email,
        phone: formData.phone,
        role: 'student',
        collegeId: user?.collegeId,
        departmentId: formData.departmentId,
        courseId: formData.courseId,
        sectionId: formData.sectionId,
        yearOfStudy: formData.yearOfStudy,
        rollNumber: formData.registrationNumber,
        academicYearId: academic_year_id[0].id,
        class: formData.class,
        status: 'active', // Default status for new students
        ...(formData.password && { password: formData.password }),
      };

      let savedStudent;
      if (student?.id) {
        // Update existing student
        savedStudent = await ApiService.updateUser(student.id, studentData);
      } else {
        // Create new student
        savedStudent = await ApiService.createUser(studentData);
      }

      onSave(savedStudent as UserType);
      toast.success(`Student ${student?.id ? 'updated' : 'added'} successfully!`);
      onClose(); // Close the form after successful save
    } catch (error) {
      console.error('Failed to save student:', error);
      toast.error(`Failed to ${student?.id ? 'update' : 'add'} student`);
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg w-full max-w-3xl max-h-[95vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='px-6 py-4 border-b border-gray-200 flex-shrink-0'>
          <h2 className='text-xl font-bold text-gray-900'>
            {student ? 'Edit Student' : 'Add New Student'}
          </h2>
          <p className='text-sm text-gray-600 mt-1'>
            {student ? 'Update student information' : 'Fill in the details to add a new student'}
          </p>
        </div>

        {/* Form Content */}
        <div className='flex-1 overflow-y-auto'>
          <form onSubmit={handleSubmit} className='p-6 space-y-6'>
            {/* Basic Information */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold text-gray-800 border-b pb-2'>
                Basic Information
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    First Name <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    className='w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                    placeholder='Enter first name'
                    required
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Last Name <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    className='w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                    placeholder='Enter last name'
                    required
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Email Address <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='email'
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className='w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                    placeholder='Enter email address'
                    required
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Phone Number <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='tel'
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className='w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                    placeholder='Enter phone number'
                    required
                  />
                </div>

                {!student && (
                  <>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Password <span className='text-red-500'>*</span>
                      </label>
                      <div className='relative'>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={e => setFormData({ ...formData, password: e.target.value })}
                          className='w-full px-3 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                          placeholder='Enter password (8+ characters)'
                          required
                        />
                        <button
                          type='button'
                          onClick={() => setShowPassword(!showPassword)}
                          className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1'
                        >
                          {showPassword ? (
                            <EyeOff className='w-5 h-5' />
                          ) : (
                            <Eye className='w-5 h-5' />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Confirm Password <span className='text-red-500'>*</span>
                      </label>
                      <div className='relative'>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={e =>
                            setFormData({ ...formData, confirmPassword: e.target.value })
                          }
                          className={`w-full px-3 py-2.5 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            formData.confirmPassword &&
                            formData.password !== formData.confirmPassword
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-300'
                          }`}
                          placeholder='Confirm password (8+ characters)'
                          required
                        />
                        <button
                          type='button'
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1'
                        >
                          {showConfirmPassword ? (
                            <EyeOff className='w-5 h-5' />
                          ) : (
                            <Eye className='w-5 h-5' />
                          )}
                        </button>
                      </div>
                      {formData.confirmPassword &&
                        formData.password !== formData.confirmPassword && (
                          <p className='text-xs text-red-500 mt-1'>Passwords do not match</p>
                        )}
                    </div>
                  </>
                )}
              </div>{formData.password && (
          <div className="mt-2">
            <div className="text-xs text-gray-600 space-y-1">
              <div className={`flex items-center ${formData.password.length >= 8 ? 'text-blue-600' : 'text-red-600'}`}>
                <span className="mr-1">•</span>
                <span>8+ characters</span>
              </div>
              <div className={`flex items-center ${/[A-Z]/.test(formData.password) ? 'text-blue-600' : 'text-red-600'}`}>
                <span className="mr-1">•</span>
                <span>Uppercase letter</span>
              </div>
              <div className={`flex items-center ${/[a-z]/.test(formData.password) ? 'text-blue-600' : 'text-red-600'}`}>
                <span className="mr-1">•</span>
                <span>Lowercase letter</span>
              </div>
              <div className={`flex items-center ${/[0-9]/.test(formData.password) ? 'text-blue-600' : 'text-red-600'}`}>
                <span className="mr-1">•</span>
                <span>Number</span>
              </div>
              <div className={`flex items-center ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'text-blue-600' : 'text-red-600'}`}>
                <span className="mr-1">•</span>
                <span>Special character</span>
              </div>
            </div>
          </div>
        )}

              {/* {!student && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-blue-800 mb-1">Password Requirements:</p>
                  <div className="text-xs text-blue-700 grid grid-cols-1 sm:grid-cols-2 gap-1">
                    <span>• 8+ characters</span>
                    <span>• Uppercase letter</span>
                    <span>• Lowercase letter</span>
                    <span>• Number & special char</span>
                  </div>
                </div>
              )} */}
            </div>

            {/* Academic Information */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold text-gray-800 border-b pb-2'>
                Academic Information
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Registration Number <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.registrationNumber}
                    onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })}
                    className='w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                    placeholder='Enter registration number'
                    required
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    College <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={collegeName}
                    className='w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-600'
                    placeholder='College name'
                    disabled
                    readOnly
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Department <span className='text-red-500'>*</span>
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                    className='w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                    required
                  >
                    <option value=''>Select Department</option>
                    {filteredDepartments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Course <span className='text-red-500'>*</span>
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={e => setFormData({ ...formData, courseId: e.target.value })}
                    className='w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                    disabled={!formData.departmentId}
                    required
                  >
                    <option value=''>Select Course</option>
                    {filteredCourses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Batch <span className='text-red-500'>*</span>
                  </label>
                  <select
                    value={formData.yearOfStudy}
                    onChange={e => setFormData({ ...formData, yearOfStudy: e.target.value })}
                    className='w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                    required
                    disabled={!formData.courseId}
                  >
                    <option value=''>Select Year of Study</option>
                    {academicYears.map(year => (
                      <option key={year.id} value={year.name}>
                        {year.yearName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Section <span className='text-red-500'>*</span>
                  </label>
                  <select
                    value={formData.sectionId}
                    onChange={e => {
                      const selectedSectionId = e.target.value;
                      const selectedSection = filteredSections.find(section => section.id === selectedSectionId);
                      setFormData({
                        ...formData,
                        sectionId: selectedSectionId,
                        class: selectedSection?.name || ''
                      });
                    }}
                    className='w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                    disabled={!formData.yearOfStudy}
                    required
                  >
                    <option value=''>Select Section</option>
                    {filteredSections.map(section => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className='px-6 py-4 border-t border-gray-200 flex-shrink-0'>
          <div className='flex space-x-3'>
            <button
              type='submit'
              onClick={e => {
                e.preventDefault();
                const form = e.currentTarget
                  .closest('.bg-white')
                  ?.querySelector('form') as HTMLFormElement;
                if (form) {
                  const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                  form.dispatchEvent(submitEvent);
                }
              }}
              className='flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium'
            >
              {student ? 'Update' : 'Add'} Student
            </button>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 bg-gray-200 text-gray-800 py-2.5 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium'
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentManagement;
