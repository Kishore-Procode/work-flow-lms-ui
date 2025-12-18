import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash2, Building, User, Users, GraduationCap } from 'lucide-react';
import { Department, User as UserType } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { ApiService } from '../../services/api';
import { useToast } from '../UI/Toast';
import EnhancedPagination, { PaginationInfo } from '../UI/EnhancedPagination';
import LoadingSpinner from '../UI/LoadingSpinner';
import { queryKeys } from '../../lib/react-query';

const DepartmentManagement: React.FC = () => {
  const { user } = useAuth();
  const toastHook = useToast();
  const queryClient = useQueryClient();

  // Pagination and filter states
  const [filters, setFilters] = useState({
    page: 1,
    limit: 25,
    sortBy: 'created_at',
    sortOrder: 'desc' as 'asc' | 'desc',
    search: '',
    collegeId: user?.collegeId || '',
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  // Fetch departments with React Query
  const {
    data: departmentsResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: queryKeys.departments.list(filters),
    queryFn: () => user?.collegeId
      ? ApiService.getDepartmentsByCollege(user.collegeId, filters)
      : ApiService.getDepartments(filters),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch users for statistics
  const { data: usersResponse } = useQuery({
    queryKey: queryKeys.users.list({ collegeId: user?.collegeId }),
    queryFn: () => ApiService.getUsers({ collegeId: user?.collegeId }),
    staleTime: 1000 * 60 * 3, // 3 minutes
  });

  // Process data
  const departments = Array.isArray(departmentsResponse) ? departmentsResponse : departmentsResponse?.data || [];
  const users = Array.isArray(usersResponse) ? usersResponse : usersResponse?.data || [];
  const pagination: PaginationInfo = departmentsResponse?.pagination || {
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  // Mutations
  const createDepartmentMutation = useMutation({
    mutationFn: (data: any) => ApiService.createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['departments']);
      queryClient.invalidateQueries(['users']); // Refresh users for HOD assignments
      toast.success('Department created successfully');
      setShowAddForm(false);
      setSelectedDepartment(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create department');
    },
  });

  const updateDepartmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => ApiService.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['departments']);
      queryClient.invalidateQueries(['users']); // Refresh users for HOD assignments
      toast.success('Department updated successfully');
      setShowAddForm(false);
      setSelectedDepartment(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update department');
    },
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: (id: string) => ApiService.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all }); // Refresh users for HOD assignments
      toast.success('Department deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete department');
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

  const getHODName = (hodId: string | null) => {
    if (!hodId) return 'Not Assigned';
    const hod = users.find(u => u.id === hodId);
    return hod?.name || 'Unknown HOD';
  };

  const getDepartmentStats = (departmentId: string) => {
    const departmentUsers = users.filter(u => u.departmentId === departmentId);
    return {
      staff: departmentUsers.filter(u => u.role === 'staff').length,
      students: departmentUsers.filter(u => u.role === 'student').length
    };
  };

  const handleAddDepartment = () => {
    setSelectedDepartment(null);
    setShowAddForm(true);
  };

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setShowAddForm(true);
  };

  const handleDeleteDepartment = (departmentId: string) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      deleteDepartmentMutation.mutate(departmentId);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Department Management</h1>
          <p className="text-gray-600">Manage college departments and their details</p>
        </div>
        <button
          onClick={handleAddDepartment}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
        </button>
      </div>



      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.length > 0 ? departments.map((department) => {
          const stats = getDepartmentStats(department.id);
          return (
            <div key={department.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{department.name}</h3>
                    <p className="text-sm text-gray-500">Code: {department.code}</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEditDepartment(department)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteDepartment(department.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>HOD: {getHODName(department.hodId)}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Established: {typeof department.established === 'object' ?
                    new Date(department.established).getFullYear() :
                    department.established || 'N/A'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-blue-600 mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-lg font-bold">{stats.staff}</span>
                  </div>
                  <p className="text-xs text-gray-500">Staff</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-success-600 mb-1">
                    <GraduationCap className="w-4 h-4" />
                    <span className="text-lg font-bold">{stats.students}</span>
                  </div>
                  <p className="text-xs text-gray-500">Students</p>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full text-center py-12">
            <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No departments found</h3>
            <p className="text-gray-500 mb-4">Start by adding departments to your college.</p>
            <button
              onClick={handleAddDepartment}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Add First Department
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <DepartmentForm
          department={selectedDepartment}
          users={users.filter(u => u.collegeId === user?.collegeId && (u.role === 'hod' || u.role === 'staff'))}
          collegeId={user?.collegeId}
          onClose={() => {
            setShowAddForm(false);
            setSelectedDepartment(null);
          }}
          onSave={(department) => {
            if (selectedDepartment) {
              // Update existing department using mutation
              updateDepartmentMutation.mutate({ id: department.id, data: department });
            } else {
              // Create new department using mutation
              createDepartmentMutation.mutate(department);
            }
          }}
        />
      )}
    </div>
  );
};

// Department Form Component
interface DepartmentFormProps {
  department: Department | null;
  users: UserType[];
  onClose: () => void;
  onSave: (department: Department) => void;
  collegeId?: string;
}

const DepartmentForm: React.FC<DepartmentFormProps> = ({ department, users, onClose, onSave, collegeId }) => {
  const [formData, setFormData] = useState({
    name: department?.name || '',
    code: department?.code || '',
    hodId: department?.hodId || '',
    established: department?.established || new Date().getFullYear().toString()
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newDepartment: Department = {
      id: department?.id || `dept-${Date.now()}`,
      ...formData,
      collegeId: department?.collegeId || collegeId || '',
      hodId: formData.hodId || '',
      totalStudents: department?.totalStudents || 0,
      totalStaff: department?.totalStaff || 0
    };

    onSave(newDepartment);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {department ? 'Edit Department' : 'Add New Department'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Computer Science & Engineering"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department Code</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., CSE"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Head of Department</label>
            <select
              value={formData.hodId}
              onChange={(e) => setFormData({...formData, hodId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select HOD</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name} ({user.role.toUpperCase()})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Established Year</label>
            <input
              type="text"
              value={formData.established}
              onChange={(e) => setFormData({...formData, established: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., 1985"
              required
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors"
            >
              {department ? 'Update' : 'Create'} Department
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepartmentManagement;