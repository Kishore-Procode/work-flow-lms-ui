import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Eye, Search, Filter } from 'lucide-react';
import { User as UserType, College, Department } from '../../types';
import { ApiService } from '../../services/api';
import EnhancedPagination, { PaginationInfo } from '../UI/EnhancedPagination';
import { cleanFilters, createPaginationInfo, extractDataArray } from '../../utils/filterUtils';
import { queryKeys } from '../../lib/react-query';

const UserManagement: React.FC = () => {

  // Applied filters (used for API calls)
  const [appliedFilters, setAppliedFilters] = useState({
    page: 1,
    limit: 10,
    sortBy: 'name',
    sortOrder: 'asc' as 'asc' | 'desc',
    search: '',
    role: '',
    collegeId: '',
    departmentId: '',
    status: '',
  });

  // Form filters (user input, not applied until Load is clicked)
  const [formFilters, setFormFilters] = useState({
    search: '',
    role: '',
    collegeId: '',
    status: '',
  });

  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);

  // Clean filters to avoid backend validation errors
  const cleanedFilters = cleanFilters(appliedFilters);

  // Fetch users with React Query
  const {
    data: usersResponse,
    isLoading,
    error
  } = useQuery({
    queryKey: queryKeys.users.list(cleanedFilters),
    queryFn: () => ApiService.getUsers(cleanedFilters),
    staleTime: 1000 * 60 * 3, // 3 minutes
  });

  // Fetch colleges and departments for filters
  const { data: collegesResponse } = useQuery({
    queryKey: queryKeys.colleges.all,
    queryFn: () => ApiService.getColleges(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const { data: departmentsResponse } = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => ApiService.getDepartments(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const { data: sectionsResponse } = useQuery({
    queryKey: ['sections'],
    queryFn: () => ApiService.getSections(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Process data
  const users = extractDataArray(usersResponse);
  const colleges = extractDataArray(collegesResponse);
  const departments = extractDataArray(departmentsResponse);
  const sections = extractDataArray(sectionsResponse);
  const pagination: PaginationInfo = createPaginationInfo(usersResponse);

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

  const handleCollegeFilter = (collegeId: string) => {
    setFormFilters(prev => ({ ...prev, collegeId }));
  };

  const handleStatusFilter = (status: string) => {
    setFormFilters(prev => ({ ...prev, status }));
  };

  // Check if there are pending filter changes
  const hasPendingChanges = () => {
    return (
      formFilters.search !== appliedFilters.search ||
      formFilters.role !== appliedFilters.role ||
      formFilters.collegeId !== appliedFilters.collegeId ||
      formFilters.status !== appliedFilters.status
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
      collegeId: '',
      status: '',
    };
    setFormFilters(clearedFilters);
    setAppliedFilters(prev => ({
      ...prev,
      ...clearedFilters,
      page: 1,
    }));
  };



  const getCollegeName = (collegeId: string | null) => {
    if (!collegeId) return 'Not Assigned';
    const college = colleges.find(c => c.id === collegeId);
    return college?.name || 'Unknown College';
  };

  const getDepartmentName = (departmentId: string | null) => {
    if (!departmentId) return 'Not Assigned';
    const department = departments.find(d => d.id === departmentId);
    return department?.name || 'Unknown Department';
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      principal: 'bg-blue-100 text-blue-800',
      hod: 'bg-blue-100 text-blue-800',
      staff: 'bg-orange-100 text-orange-800',
      student: 'bg-gray-100 text-gray-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-blue-100 text-blue-800',
      inactive: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleViewUser = (user: UserType) => {
    setSelectedUser(user);
    setShowUserDetails(true);
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
    <div className="p-4 lg:p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm lg:text-base text-gray-600">View all system users and their details</p>
        </div>
      </div>

      {/* Filters */}
      <div className={`bg-white p-3 lg:p-4 rounded-lg border mb-6 ${
        hasPendingChanges()
          ? 'border-orange-300 bg-orange-50'
          : 'border-gray-200'
      }`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {/* Search Input */}
          <div>
            <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Search Users</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={formFilters.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by name, email..."
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Filter by Role</label>
            <select
              value={formFilters.role}
              onChange={(e) => handleRoleFilter(e.target.value)}
              className="w-full px-2 lg:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="principal">Principal</option>
              <option value="hod">HOD</option>
              <option value="staff">Staff</option>
              <option value="student">Student</option>
            </select>
          </div>

          <div>
            <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Filter by College</label>
            <select
              value={formFilters.collegeId}
              onChange={(e) => handleCollegeFilter(e.target.value)}
              className="w-full px-2 lg:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Colleges</option>
              {colleges.map(college => (
                <option key={college.id} value={college.id}>{college.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
            <select
              value={formFilters.status}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="w-full px-2 lg:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={handleLoadFilters}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              hasPendingChanges()
                ? 'bg-blue-600 text-white hover:bg-blue-700 ring-2 ring-blue-300'
                : 'bg-gray-400 text-white cursor-default'
            }`}
            disabled={!hasPendingChanges()}
          >
            <Filter className="w-4 h-4" />
            <span>{hasPendingChanges() ? 'Load Results' : 'No Changes'}</span>
          </button>

          {(formFilters.search || formFilters.role || formFilters.collegeId || formFilters.status) && (
            <button
              onClick={handleClearFilters}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Clear Filters
            </button>
          )}

          {hasPendingChanges() && (
            <span className="text-sm text-orange-600 font-medium">
              • Click "Load Results" to apply filters
            </span>
          )}
        </div>

        {/* Search Results Info */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs lg:text-sm text-gray-600">
            Showing {pagination.total > 0 ? ((pagination.page - 1) * pagination.limit + 1) : 0}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
            {appliedFilters.search && (
              <span className="ml-2 text-blue-600">
                • Filtered by: "{appliedFilters.search}"
              </span>
            )}
            {(appliedFilters.role || appliedFilters.collegeId || appliedFilters.status) && (
              <span className="ml-2 text-blue-600">
                • Active filters applied
              </span>
            )}
          </div>
        </div>
      </div>





      {/* Users Table - Mobile First Design */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        {users.length > 0 ? (
          <>
            {/* Mobile Card View */}
            <div className="lg:hidden">
              <div className="space-y-3 p-4">
                {users.map((user) => (
                  <div key={user.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{user.name}</h3>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Role</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {user.role.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Status</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                          {user.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">College</span>
                        <span className="text-xs text-gray-900 text-right max-w-[50%] truncate">{getCollegeName(user.collegeId || null)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Department</span>
                        <span className="text-xs text-gray-900 text-right max-w-[50%] truncate">{getDepartmentName(user.departmentId || null)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">College</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getCollegeName(user.collegeId || null)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getDepartmentName(user.departmentId || null)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                        {user.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        ) : (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500 mb-4">No users match the current filters or no users exist.</p>
          </div>
        )}
      </div>

      {/* Enhanced Pagination */}
      {!isLoading && !error && pagination.total > 0 && (
        <div className="mt-6 bg-white p-4 rounded-lg border border-gray-200">
          <EnhancedPagination
            pagination={pagination}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            disabled={isLoading}
          />
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          colleges={colleges}
          departments={departments}
          sections={sections}
          onClose={() => {
            setShowUserDetails(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};

// User Details Modal Component
interface UserDetailsModalProps {
  user: UserType;
  colleges: College[];
  departments: Department[];
  sections: any[];
  onClose: () => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ user, colleges, departments, sections, onClose }) => {
  const getCollegeName = (collegeId: string | null | undefined) => {
    if (!collegeId) return 'Not Assigned';
    const college = colleges.find(c => c.id === collegeId);
    return college ? college.name : 'Unknown College';
  };

  const getDepartmentName = (departmentId: string | null | undefined) => {
    if (!departmentId) return 'Not Assigned';
    const department = departments.find(d => d.id === departmentId);
    return department ? department.name : 'Unknown Department';
  };

  const getSectionName = (sectionId: string | null | undefined) => {
    if (!sectionId) return 'Not Assigned';
    const section = sections.find(s => s.id === sectionId);
    return section ? section.name : 'Unknown Section';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-blue-100 text-blue-800',
      inactive: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[95vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            User Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* User Details Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{user.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{user.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded capitalize">{user.role}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                    {user.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{getCollegeName(user.collegeId)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{getDepartmentName(user.departmentId)}</p>
                </div>
                {user.role === 'student' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{getSectionName(user.sectionId || user.section_id)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{user.rollNumber || 'Not assigned'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{user.semester || 'Not assigned'}</p>
                    </div>
                  </>
                )}
                {user.role === 'staff' && user.classInCharge && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class In-Charge</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{user.classInCharge}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Login</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 sm:p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;