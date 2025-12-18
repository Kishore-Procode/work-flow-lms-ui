import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash2, User, Mail, Phone, Building, Search, Filter, X, GraduationCap, Briefcase, Eye, EyeOff, MapPin } from 'lucide-react';
import { User as UserType, Department } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { ApiService } from '../../services/api';
import EnhancedPagination, { PaginationInfo } from '../UI/EnhancedPagination';
import LoadingSpinner from '../UI/LoadingSpinner';
import { cleanFilters, createPaginationInfo, extractDataArray } from '../../utils/filterUtils';
import { queryKeys } from '../../lib/react-query';

const StaffManagement: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Separate filter states like UserManagement
  const [formFilters, setFormFilters] = useState({
    search: '',
    role: '',
    status: '',
    departmentId: '',
  });

  const [appliedFilters, setAppliedFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    role: '',
    status: '',
    departmentId: '',
  });

  const [showStaffModal, setShowStaffModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<UserType | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('create');

  // Clean filters for API calls
  const cleanedFilters = cleanFilters(appliedFilters);

  // Fetch staff with pagination using React Query and dedicated staff endpoint
  const {
    data: staffResponse,
    isLoading,
    error
  } = useQuery({
    queryKey: queryKeys.users.list({ ...cleanedFilters, role: 'staff' }),
    queryFn: () => {
      // Use dedicated staff endpoint with proper role-based filtering
      return ApiService.getStaff(cleanedFilters);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch departments for filters
  const { data: departmentsResponse } = useQuery({
    queryKey: ['departments'],
    queryFn: () => ApiService.getDepartments(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Extract data from responses - no need for frontend filtering anymore
  const staff = extractDataArray(staffResponse);
  const departments = extractDataArray(departmentsResponse);
  const paginationInfo = createPaginationInfo(staffResponse);

  // Mutations for CRUD operations
  const createStaffMutation = useMutation({
    mutationFn: (data: any) => ApiService.createStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member created successfully');
      setShowStaffModal(false);
      setSelectedStaff(null);
      setModalMode('create');
    },
    onError: (error: any) => {
      // Extract error message from API response
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create staff member';
      toast.error(errorMessage);
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => ApiService.updateStaff(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member updated successfully');
      setShowStaffModal(false);
      setSelectedStaff(null);
      setModalMode('create');
    },
    onError: (error: any) => {
      // Extract error message from API response
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update staff member';
      toast.error(errorMessage);
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: (id: string) => ApiService.deleteStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete staff member');
    },
  });

  // Pagination handlers (these apply immediately)
  const handlePageChange = (page: number) => {
    setAppliedFilters(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setAppliedFilters(prev => ({ ...prev, limit, page: 1 }));
  };

  // Form filter handlers (these update form state only)
  const handleSearchChange = (search: string) => {
    setFormFilters(prev => ({ ...prev, search }));
  };

  const handleRoleFilter = (role: string) => {
    setFormFilters(prev => ({ ...prev, role }));
  };

  const handleStatusFilter = (status: string) => {
    setFormFilters(prev => ({ ...prev, status }));
  };

  const handleDepartmentFilter = (departmentId: string) => {
    setFormFilters(prev => ({ ...prev, departmentId }));
  };

  // Check if there are pending filter changes
  const hasPendingChanges = () => {
    return (
      formFilters.search !== appliedFilters.search ||
      formFilters.role !== appliedFilters.role ||
      formFilters.status !== appliedFilters.status ||
      formFilters.departmentId !== appliedFilters.departmentId
    );
  };

  // Load/Apply filters handler
  const handleLoadFilters = () => {
    setAppliedFilters(prev => ({
      ...prev,
      ...formFilters,
      page: 1, // Reset to first page when applying new filters
    }));
  };

  // Clear filters handler
  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      role: '',
      status: '',
      departmentId: '',
    };
    setFormFilters(clearedFilters);
    setAppliedFilters(prev => ({
      ...prev,
      ...clearedFilters,
      page: 1,
    }));
  };

  // Modal handlers
  const handleAdd = () => {
    setSelectedStaff(null);
    setModalMode('create');
    setShowStaffModal(true);
  };

  const handleView = (staffMember: UserType) => {
    setSelectedStaff(staffMember);
    setModalMode('view');
    setShowStaffModal(true);
  };

  const handleEdit = (staffMember: UserType) => {
    setSelectedStaff(staffMember);
    setModalMode('edit');
    setShowStaffModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      deleteStaffMutation.mutate(id);
    }
  };

  const handleModalClose = () => {
    setShowStaffModal(false);
    setSelectedStaff(null);
    setModalMode('create');
  };

  const handleFormSave = (data: any) => {
    if (modalMode === 'edit' && selectedStaff) {
      updateStaffMutation.mutate({ id: selectedStaff.id, data });
    } else if (modalMode === 'create') {
      createStaffMutation.mutate(data);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="max-w-md mx-auto">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Staff Data</h3>
          <p className="text-gray-600 mb-4">
            {error?.message || 'There was an error loading the staff information. Please try again.'}
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={handleLoadFilters}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Search className="w-4 h-4" />
              )}
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600">Manage staff members and faculty</p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search staff by name, email..."
                value={formFilters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
          </div>
          
          <select
            value={formFilters.role}
            onChange={(e) => handleRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            <option value="">All Roles</option>
            <option value="staff">Staff</option>
            <option value="hod">HOD</option>
          </select>

          <select
            value={formFilters.status}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={formFilters.departmentId}
            onChange={(e) => handleDepartmentFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            <option value="">All Departments</option>
            {departments.map((dept: Department) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleLoadFilters}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:cursor-not-allowed ${
                hasPendingChanges()
                  ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400'
                  : 'bg-gray-500 text-white hover:bg-gray-600 disabled:bg-gray-400'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Loading...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  {hasPendingChanges() ? 'Apply Filters' : 'Load Staff'}
                </>
              )}
            </button>

            <button
              onClick={handleClearFilters}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {!staffResponse && !isLoading ? (
          // Empty state - no data loaded yet
          <div className="p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Staff Data Loaded</h3>
            <p className="text-gray-600 mb-4">
              Click the "Load Staff" button to fetch staff members.
            </p>
            <button
              onClick={handleLoadFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
            >
              <Search className="w-4 h-4" />
              Load Staff
            </button>
          </div>
        ) : staff.length === 0 ? (
          // No results state
          <div className="p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Staff Found</h3>
            <p className="text-gray-600 mb-4">
              No staff members match your current filters. Try adjusting your search criteria.
            </p>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2 mx-auto"
            >
              <X className="w-4 h-4" />
              Clear Filters & Reload
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staff.map((staffMember: UserType) => (
                <tr key={staffMember.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {staffMember.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {staffMember.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      staffMember.role === 'hod' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {staffMember.role?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {departments.find((d: Department) => d.id === staffMember.departmentId)?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{staffMember.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      staffMember.status === 'active' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {staffMember.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleView(staffMember)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <User className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(staffMember)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(staffMember.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        {/* Pagination - only show when there's data */}
        {staffResponse && staff.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <EnhancedPagination
              pagination={{
                page: paginationInfo.page,
                limit: paginationInfo.limit,
                total: paginationInfo.total,
                totalPages: paginationInfo.totalPages,
                hasNextPage: paginationInfo.page < paginationInfo.totalPages,
                hasPreviousPage: paginationInfo.page > 1
              }}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
            />
          </div>
        )}
      </div>

      {/* Staff Modal */}
      {showStaffModal && (
        <StaffModal
          mode={modalMode}
          staff={selectedStaff}
          departments={departments}
          onSave={handleFormSave}
          onCancel={handleModalClose}
          onEdit={() => setModalMode('edit')}
          isLoading={createStaffMutation.isPending || updateStaffMutation.isPending}
        />
      )}
    </div>
  );
};

// Staff Modal Component
interface StaffModalProps {
  mode: 'view' | 'edit' | 'create';
  staff: UserType | null;
  departments: Department[];
  onSave: (data: any) => void;
  onCancel: () => void;
  onEdit: () => void;
  isLoading: boolean;
}

const StaffModal: React.FC<StaffModalProps> = ({ mode, staff, departments, onSave, onCancel, onEdit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'staff',
    status: 'active',
    departmentId: '',
    courseId: '',
    qualification: '',
    experience: '',
    employeeId: '',
    courseName: ''
  });

  const [courses, setCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [existingHOD, setExistingHOD] = useState<any>(null);
  const [checkingHOD, setCheckingHOD] = useState(false);

  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name || '',
        email: staff.email || '',
        phone: staff.phone || '',
        password: '', // Don't populate password for existing staff
        role: staff.role || 'staff',
        status: staff.status || 'active',
        departmentId: staff.departmentId || staff.department_id || '',
        courseId: staff.courseId || staff.course_id || '',
        qualification: staff.qualification || '',
        experience: staff.experience || '',
        employeeId: staff.employeeId || staff.employee_id || '',
        courseName: (staff as any).courseName || ''
      });

      // Check for existing HOD if this is an HOD role
      if (staff && staff.role === 'hod' && (staff.departmentId || staff.department_id)) {
        checkExistingHOD(staff.departmentId || staff.department_id || '');
      }
    } else if (mode === 'create' && currentUser?.role === 'hod' && currentUser?.departmentId) {
      // Lock department to HOD's department when creating new staff
      setFormData(prev => ({
        ...prev,
        departmentId: currentUser.departmentId
      }));
    }
  }, [staff, mode, currentUser]);

  // Load courses when component mounts
  useEffect(() => {
    loadCourses();
  }, []);

  // Filter courses when department changes
  useEffect(() => {
    if (formData.departmentId) {
      const departmentCourses = courses.filter(course =>
        course.departmentId === formData.departmentId
      );
      setFilteredCourses(departmentCourses);

      // Reset course selection if current course is not in the new department
      if (formData.courseId && !departmentCourses.find(c => c.id === formData.courseId)) {
        setFormData(prev => ({ ...prev, courseId: '' }));
      }
    } else {
      setFilteredCourses([]);
      setFormData(prev => ({ ...prev, courseId: '' }));
    }
  }, [formData.departmentId, courses]);

  const loadCourses = async () => {
    try {
      setLoadingCourses(true);
      const coursesData = await ApiService.getCourses();
      const transformedCourses = Array.isArray(coursesData) ? coursesData.map((course: any) => ({
        id: course.id,
        name: course.name,
        code: course.code,
        type: course.type,
        departmentId: course.departmentId || course.department_id,
        collegeId: course.collegeId || course.college_id,
        departmentName: course.departmentName || course.department_name
      })) : [];
      setCourses(transformedCourses);
    } catch (error) {
      console.error('Failed to load courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Check for existing HOD when role or department changes
    if ((field === 'role' && value === 'hod') || (field === 'departmentId' && formData.role === 'hod')) {
      checkExistingHOD(field === 'departmentId' ? value : formData.departmentId);
    }

    // Clear HOD check when role changes away from HOD
    if (field === 'role' && value !== 'hod') {
      setExistingHOD(null);
    }
  };

  // Function to check if HOD already exists in department
  const checkExistingHOD = async (departmentId: string) => {
    if (!departmentId || mode === 'view') return;

    setCheckingHOD(true);
    try {
      const response = await ApiService.getStaff({
        role: 'hod',
        departmentId: departmentId,
        status: 'active',
        page: 1,
        limit: 1
      });

      if (response.data && response.data.length > 0) {
        // If editing existing staff, exclude current staff from check
        const existingHODInDept = response.data.find((hod: any) =>
          mode === 'edit' ? hod.id !== staff?.id : true
        );

        if (existingHODInDept) {
          setExistingHOD(existingHODInDept);
        } else {
          setExistingHOD(null);
        }
      } else {
        setExistingHOD(null);
      }
    } catch (error) {
      console.error('Error checking existing HOD:', error);
      setExistingHOD(null);
    } finally {
      setCheckingHOD(false);
    }
  };



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // View mode doesn't submit
    if (mode === 'view') return;

    // Basic validation - name is always required
    if (!formData.name) {
      toast.error('Name is required');
      return;
    }

    if (mode === 'edit') {
      // For updates, only validate name and employeeId
      // Employee ID is optional, so no validation needed
      onSave({
        name: formData.name,
        employeeId: formData.employeeId,
      });
    } else if (mode === 'create') {
      // For creation, validate all required fields
      // Department is optional for HOD role (can be assigned later via Department Management)
      if (formData.role === 'hod') {
        if (!formData.email || !formData.phone) {
          toast.error('Please fill in all required fields (email and phone)');
          return;
        }
      } else {
        // For non-HOD roles, department is required
        if (!formData.email || !formData.phone || !formData.departmentId) {
          toast.error('Please fill in all required fields');
          return;
        }
      }

      // Password is required for new staff creation
      if (!formData.password) {
        toast.error('Password is required for new staff members');
        return;
      }

      // For staff role, course selection is required
      if (formData.role === 'staff' && !formData.courseId) {
        toast.error('Please select a course for staff members');
        return;
      }

      // Check for existing HOD only if department is selected
      if (formData.role === 'hod' && formData.departmentId && existingHOD) {
        toast.error('Cannot create HOD. This department already has an active HOD.');
        return;
      }

      // Clean up empty fields before sending
      const cleanedData = { ...formData };
      if (!cleanedData.departmentId || cleanedData.departmentId === '') {
        delete cleanedData.departmentId;
      }
      if (!cleanedData.courseId || cleanedData.courseId === '') {
        delete cleanedData.courseId;
      }

      onSave(cleanedData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === 'view' ? 'Staff Details' : mode === 'edit' ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h2>
              {mode === 'view' && (
                <p className="text-sm text-gray-600 mt-1">
                  View staff member information
                </p>
              )}
              {mode === 'edit' && (
                <p className="text-sm text-gray-600 mt-1">
                  Only Name and Employee ID can be updated
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {mode === 'view' && (
                <button
                  onClick={onEdit}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 text-sm"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name {mode !== 'view' && '*'}
                </label>
                {mode === 'view' ? (
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {formData.name || 'N/A'}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={mode !== 'view'}
                    disabled={mode === 'view'}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee ID
                </label>
                {mode === 'view' ? (
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {formData.employeeId || 'N/A'}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => handleInputChange('employeeId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., EMP001"
                    disabled={mode === 'view'}
                  />
                )}
              </div>

              {/* Email - show in view/edit, editable only in create */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email {mode === 'create' && '*'}
                </label>
                {mode === 'view' || mode === 'edit' ? (
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {formData.email || 'N/A'}
                  </div>
                ) : (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={mode === 'create'}
                  />
                )}
              </div>

              {/* Password - only for creation */}
              {mode === 'create' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Phone - show in view/edit, editable only in create */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone {mode === 'create' && '*'}
                </label>
                {mode === 'view' || mode === 'edit' ? (
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {formData.phone || 'N/A'}
                  </div>
                ) : (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={mode === 'create'}
                  />
                )}
              </div>
            </div>

            {/* Role and Department */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role {mode === 'create' && '*'}
                </label>
                {mode === 'view' || mode === 'edit' ? (
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      formData.role === 'hod'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {formData.role?.toUpperCase() || 'N/A'}
                    </span>
                  </div>
                ) : (
                  <select
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={mode === 'create'}
                  >
                    <option value="staff">Staff</option>
                    <option value="hod">HOD</option>
                  </select>
                )}

                {/* HOD Warning */}
                {formData.role === 'hod' && mode === 'create' && (
                  <div className="mt-2">
                    {checkingHOD ? (
                      <div className="flex items-center text-blue-600 text-sm">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Checking for existing HOD...
                      </div>
                    ) : existingHOD ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center text-red-800 text-sm">
                          <X className="w-4 h-4 mr-2" />
                          <span className="font-medium">Cannot create HOD</span>
                        </div>
                        <p className="text-red-700 text-sm mt-1">
                          This department already has an HOD: <strong>{existingHOD.name}</strong> ({existingHOD.email})
                        </p>
                      </div>
                    ) : formData.departmentId ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center text-blue-800 text-sm">
                          <span className="font-medium">✓ No existing HOD found</span>
                        </div>
                        <p className="text-blue-700 text-sm mt-1">
                          This department is available for HOD assignment.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-blue-800 text-sm">
                          <strong>Tip:</strong> You can create the HOD user without selecting a department, then assign them to a department later through Department Management.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department {mode === 'create' && formData.role !== 'hod' && '*'}
                  {mode === 'create' && formData.role === 'hod' && (
                    <span className="text-xs text-gray-500 ml-1">(Optional - can be assigned later)</span>
                  )}
                  {currentUser?.role === 'hod' && mode === 'create' && (
                    <span className="text-xs text-blue-600 ml-1">(Locked to your department)</span>
                  )}
                </label>
                {mode === 'view' || mode === 'edit' || (currentUser?.role === 'hod' && currentUser?.departmentId) ? (
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {departments.find((d: Department) => d.id === formData.departmentId)?.name || 'N/A'}
                  </div>
                ) : (
                  <select
                    value={formData.departmentId}
                    onChange={(e) => handleInputChange('departmentId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={mode === 'create' && formData.role !== 'hod'}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Course Selection (for staff) */}
            {formData.role === 'staff' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course {mode === 'create' && '*'}
                </label>
                {mode === 'view' || mode === 'edit' ? (
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {formData.courseName || 'N/A'}
                  </div>
                ) : (
                  <select
                    value={formData.courseId}
                    onChange={(e) => handleInputChange('courseId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={mode === 'create'}
                    disabled={!formData.departmentId || loadingCourses}
                  >
                    <option value="">
                      {loadingCourses ? 'Loading courses...' : 'Select Course'}
                    </option>
                    {filteredCourses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name} ({course.code})
                      </option>
                    ))}
                  </select>
                )}
                {mode === 'create' && !formData.departmentId && (
                  <p className="text-sm text-gray-500 mt-1">
                    Please select a department first
                  </p>
                )}
              </div>
            )}

            {/* Professional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <GraduationCap className="w-4 h-4 inline mr-1" />
                  Qualification
                </label>
                {mode === 'view' || mode === 'edit' ? (
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {formData.qualification || 'N/A'}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => handleInputChange('qualification', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., M.Tech, Ph.D, B.E."
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Briefcase className="w-4 h-4 inline mr-1" />
                  Experience
                </label>
                {mode === 'view' || mode === 'edit' ? (
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {formData.experience || 'N/A'}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formData.experience}
                    onChange={(e) => handleInputChange('experience', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 5 years, 2+ years"
                  />
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              {mode === 'view' || mode === 'edit' ? (
                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    formData.status === 'active'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {formData.status || 'N/A'}
                  </span>
                </div>
              ) : (
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                {mode === 'view' ? 'Close' : 'Cancel'}
              </button>
              {mode !== 'view' && (
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={isLoading || (formData.role === 'hod' && existingHOD && mode === 'create')}
                >
                  {isLoading ? 'Saving...' : (mode === 'edit' ? 'Update' : 'Create')}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StaffManagement;
