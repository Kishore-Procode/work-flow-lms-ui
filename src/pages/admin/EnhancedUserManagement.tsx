/**
 * Enhanced User Management Page
 * 
 * Comprehensive user management with advanced filtering, pagination,
 * role-based access control, and bulk operations.
 * 
 * @author Student-ACT LMS Team
 * @version 2.0.0
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Plus, Download, Upload, Users, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

import EnhancedDataTable, { TableColumn, TableAction } from '../../components/UI/EnhancedDataTable';
import { FilterConfig, FilterValues } from '../../components/UI/AdvancedFilters';
import { ApiService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { queryKeys } from '../../lib/react-query';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'principal' | 'hod' | 'staff' | 'student';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  phone?: string;
  collegeName?: string;
  departmentName?: string;
  assignedTreesCount?: number;
  lastLoginFormatted?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  collegeId?: string;
  departmentId?: string;
  emailVerified?: boolean;
  hasPhone?: boolean;
  hasCollege?: boolean;
  hasDepartment?: boolean;
  createdAfter?: string;
  createdBefore?: string;
  lastLoginAfter?: string;
  lastLoginBefore?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const EnhancedUserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 25,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  // Fetch users with enhanced filtering
  const {
    data: usersResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => ApiService.getUsers(filters),
    keepPreviousData: true,
  });

  // Fetch filter options
  const { data: colleges } = useQuery({
    queryKey: queryKeys.colleges.all,
    queryFn: () => ApiService.getColleges({ limit: 1000 }),
  });

  const { data: departments } = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => ApiService.getDepartments({ limit: 1000 }),
  });

  // Mutations
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      ApiService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update user');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => ApiService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete user');
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ userIds, operation }: { userIds: string[]; operation: string }) =>
      ApiService.bulkUpdateUsers(userIds, operation),
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('Bulk operation completed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Bulk operation failed');
    },
  });

  // Role-based permissions
  const canCreateUsers = ['super_admin', 'admin', 'principal', 'hod'].includes(currentUser?.role || '');
  const canDeleteUsers = ['super_admin', 'admin'].includes(currentUser?.role || '');
  const canViewAllUsers = ['super_admin', 'admin'].includes(currentUser?.role || '');

  // Filter configuration
  const filterConfigs: FilterConfig[] = [
    {
      key: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search by name, email, or roll number...',
    },
    {
      key: 'role',
      label: 'Role',
      type: 'select',
      options: [
        { value: 'super_admin', label: 'Super Admin' },
        { value: 'admin', label: 'Admin' },
        { value: 'principal', label: 'Principal' },
        { value: 'hod', label: 'HOD' },
        { value: 'staff', label: 'Staff' },
        { value: 'student', label: 'Student' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending', label: 'Pending' },
        { value: 'suspended', label: 'Suspended' },
      ],
    },
    {
      key: 'emailVerified',
      label: 'Email Verified',
      type: 'boolean',
    },
    {
      key: 'hasPhone',
      label: 'Has Phone',
      type: 'boolean',
    },
    {
      key: 'createdDate',
      label: 'Registration Date',
      type: 'daterange',
    },
    {
      key: 'lastLoginDate',
      label: 'Last Login',
      type: 'daterange',
    },
  ];

  // Add college filter for admins
  if (canViewAllUsers && colleges?.data) {
    filterConfigs.push({
      key: 'collegeId',
      label: 'College',
      type: 'select',
      options: colleges.data.map((college: any) => ({
        value: college.id,
        label: college.name,
      })),
    });
  }

  // Table columns
  const columns: TableColumn<User>[] = [
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      render: (value, record) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {record.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      title: 'Role',
      sortable: true,
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value === 'super_admin' ? 'bg-purple-100 text-purple-800' :
          value === 'admin' ? 'bg-red-100 text-red-800' :
          value === 'principal' ? 'bg-blue-100 text-blue-800' :
          value === 'hod' ? 'bg-blue-100 text-blue-800' :
          value === 'staff' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value.replace('_', ' ').toUpperCase()}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value === 'active' ? 'bg-blue-100 text-blue-800' :
          value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          value === 'suspended' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
          {value === 'suspended' && <AlertTriangle className="w-3 h-3 mr-1" />}
          {value.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'collegeName',
      title: 'College',
      render: (value) => value || '-',
    },
    {
      key: 'departmentName',
      title: 'Department',
      render: (value) => value || '-',
    },
    {
      key: 'assignedTreesCount',
      title: 'Resources',
      align: 'center',
      render: (value) => value || 0,
    },
    {
      key: 'emailVerified',
      title: 'Verified',
      align: 'center',
      render: (value) => (
        <span className={`inline-flex items-center ${
          value ? 'text-blue-600' : 'text-gray-400'
        }`}>
          <CheckCircle className="w-4 h-4" />
        </span>
      ),
    },
    {
      key: 'lastLoginFormatted',
      title: 'Last Login',
      sortable: true,
      render: (value) => value || 'Never',
    },
  ];

  // Table actions
  const actions: TableAction<User>[] = [
    {
      key: 'view',
      label: 'View Details',
      icon: <Users className="w-4 h-4" />,
      onClick: (record) => {
        // Navigate to user details
        console.log('View user:', record.id);
      },
    },
    {
      key: 'edit',
      label: 'Edit User',
      icon: <Plus className="w-4 h-4" />,
      onClick: (record) => {
        // Open edit modal
        console.log('Edit user:', record.id);
      },
      visible: (record) => canCreateUsers,
    },
    {
      key: 'activate',
      label: 'Activate',
      onClick: (record) => {
        updateUserMutation.mutate({
          id: record.id,
          data: { status: 'active' },
        });
      },
      visible: (record) => record.status !== 'active' && canCreateUsers,
    },
    {
      key: 'suspend',
      label: 'Suspend',
      onClick: (record) => {
        updateUserMutation.mutate({
          id: record.id,
          data: { status: 'suspended' },
        });
      },
      visible: (record) => record.status === 'active' && canCreateUsers,
      variant: 'danger',
    },
    {
      key: 'delete',
      label: 'Delete User',
      icon: <AlertTriangle className="w-4 h-4" />,
      onClick: (record) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
          deleteUserMutation.mutate(record.id);
        }
      },
      visible: () => canDeleteUsers,
      variant: 'danger',
    },
  ];

  // Bulk actions
  const bulkActions: TableAction<User[]>[] = [
    {
      key: 'activate',
      label: 'Activate Selected',
      icon: <CheckCircle className="w-4 h-4" />,
      onClick: () => {},
    },
    {
      key: 'suspend',
      label: 'Suspend Selected',
      icon: <AlertTriangle className="w-4 h-4" />,
      onClick: () => {},
      variant: 'danger',
    },
    {
      key: 'export',
      label: 'Export Selected',
      icon: <Download className="w-4 h-4" />,
      onClick: () => {},
    },
  ];

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handleFilterReset = () => {
    setFilters({
      page: 1,
      limit: 25,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  };

  const handleSort = (field: string, order: 'asc' | 'desc') => {
    setFilters(prev => ({ ...prev, sortBy: field, sortOrder: order }));
  };

  const handleBulkAction = (action: string, selectedRecords: User[]) => {
    const userIds = selectedRecords.map(user => user.id);
    bulkUpdateMutation.mutate({ userIds, operation: action });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage users, roles, and permissions</p>
        </div>
        
        <div className="flex space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Upload className="w-4 h-4 mr-2" />
            Import Users
          </button>
          
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Download className="w-4 h-4 mr-2" />
            Export Users
          </button>
          
          {canCreateUsers && (
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </button>
          )}
        </div>
      </div>

      {/* Enhanced Data Table */}
      <EnhancedDataTable
        data={usersResponse?.data || []}
        columns={columns}
        pagination={usersResponse?.pagination}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        onSort={handleSort}
        sortField={filters.sortBy}
        sortOrder={filters.sortOrder}
        filters={filterConfigs}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        onFilterReset={handleFilterReset}
        actions={actions}
        bulkActions={bulkActions}
        onBulkAction={handleBulkAction}
        loading={isLoading}
        selectable={canCreateUsers}
        emptyMessage="No users found. Try adjusting your filters."
        className="shadow-sm"
      />
    </div>
  );
};

export default EnhancedUserManagement;
