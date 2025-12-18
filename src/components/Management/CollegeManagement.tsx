import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Building, Mail, Phone, Globe, User, UserPlus, Upload, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { College, User as UserType } from '../../types';
import { ApiService } from '../../services/api';

import BulkCollegeUpload from '../BulkUpload/BulkCollegeUpload';
import EnhancedPagination, { PaginationInfo } from '../UI/EnhancedPagination';
import LoadingSpinner from '../UI/LoadingSpinner';
import { cleanFilters, createPaginationInfo, extractDataArray } from '../../utils/filterUtils';

const CollegeManagement: React.FC = () => {
  const queryClient = useQueryClient();

  // Pagination and filter states
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
    search: '',
    status: '',
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  // Clean filters to avoid backend validation errors
  const cleanedFilters = cleanFilters(filters);

  // Fetch colleges with React Query
  const {
    data: collegesResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['colleges', cleanedFilters],
    queryFn: () => ApiService.getColleges(cleanedFilters),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Process data
  const colleges = extractDataArray(collegesResponse);
  const pagination: PaginationInfo = createPaginationInfo(collegesResponse);

  // Mutations
  const createCollegeMutation = useMutation({
    mutationFn: (data: any) => ApiService.createCollege(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['colleges']);
      toast.success('College created successfully');
      setShowAddForm(false);
      setSelectedCollege(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create college');
    },
  });

  const updateCollegeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => ApiService.updateCollege(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['colleges']);
      toast.success('College updated successfully');
      setShowAddForm(false);
      setSelectedCollege(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update college');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) =>
      ApiService.updateCollege(id, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['colleges'] });
      toast.success(`College ${variables.status === 'active' ? 'activated' : 'deactivated'} successfully`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update college status');
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

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({ ...prev, status, page: 1 }));
  };

  const getPrincipalName = (college: College) => {
      return college?.principalName || 'Not Assigned';
  };

  const handleAddCollege = () => {
    setSelectedCollege(null);
    setShowAddForm(true);
  };

  const handleEditCollege = (college: College) => {
    setSelectedCollege(college);
    setShowAddForm(true);
  };

  const handleToggleStatus = (college: College) => {
    const newStatus = college.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';

    if (confirm(`Are you sure you want to ${action} "${college.name}"?`)) {
      toggleStatusMutation.mutate({ id: college.id, status: newStatus });
    }
  };

  const handleBulkUploadSuccess = () => {
    // Refresh the college list
    refetch();
    // Close the bulk upload modal after a short delay to allow users to see the results
    setTimeout(() => {
      setShowBulkUpload(false);
    }, 2000);
    // Show success message
    toast.success('Bulk upload completed! Colleges have been added and the list has been refreshed.');
  };



  const handleInvitePrincipal = async (college: College) => {
    const email = prompt('Enter the email address of the principal to invite:');
    if (!email) return;

    if (!email.includes('@') || !email.includes('.')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    try {
      const name = prompt('Enter the name of the principal:');
      if (!name) return;

      await ApiService.createInvitation({
        email: email,
        name: name,
        role: 'principal',
        college_id: college.id,
        department_id: undefined
      });
      toast.success(`Invitation sent successfully to ${email} for ${college.name}!`);
    } catch (error) {
      console.error('Failed to send invitation:', error);
      toast.error('Failed to send invitation. Please try again or check your permissions.');
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
    <div className="p-4 lg:p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">College Management</h1>
          <p className="text-sm lg:text-base text-gray-600">Manage colleges and their administrative details</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="bg-gray-100 text-gray-700 px-3 lg:px-4 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            title={isLoading ? 'Refreshing...' : 'Refresh Data'}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isLoading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button
            onClick={() => setShowBulkUpload(true)}
            className="bg-blue-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Bulk Upload</span>
            <span className="sm:hidden">Bulk</span>
          </button>
          <button
            onClick={handleAddCollege}
            className="bg-blue-600 text-white px-3 lg:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add College</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
          <span className="ml-2 text-gray-600">Loading colleges...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Error loading colleges: {error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* College Table */}
      {!isLoading && !error && (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {colleges.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        College
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Principal
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
                    {colleges.map((college) => (
                      <tr key={college.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Building className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{college.name}</div>
                              <div className="text-sm text-gray-500">Est. {college.established}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                              <span className="truncate">{college.email}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                              <span>{college.phone}</span>
                            </div>
                            {college.website && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Globe className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span className="truncate">{college.website}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{getPrincipalName(college)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            college.status === 'active'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {college.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            {!college.principalId && (
                              <button
                                onClick={() => handleInvitePrincipal(college)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Invite Principal"
                              >
                                <UserPlus className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleEditCollege(college)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit College"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(college)}
                              className={`p-2 rounded-lg transition-colors ${
                                college.status === 'active'
                                  ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                  : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                              }`}
                              title={college.status === 'active' ? 'Deactivate College' : 'Activate College'}
                              disabled={toggleStatusMutation.isPending}
                            >
                              {college.status === 'active' ? (
                                <XCircle className="w-4 h-4" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No colleges found</h3>
                <p className="text-gray-500 mb-4">Get started by adding your first college.</p>
                <button
                  onClick={handleAddCollege}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add College
                </button>
              </div>
            )}
          </div>

      {/* Pagination */}
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
      </>
      )}

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <CollegeForm
          college={selectedCollege}
          onClose={() => setShowAddForm(false)}
          onSave={async (college) => {
            if (selectedCollege) {
              updateCollegeMutation.mutate({ id: selectedCollege.id, data: college });
            } else {
              createCollegeMutation.mutate(college);
            }
          }}
        />
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">College Bulk Upload</h2>
                <button
                  onClick={() => setShowBulkUpload(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <BulkCollegeUpload onSuccess={handleBulkUploadSuccess} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// College Form Component
interface CollegeFormProps {
  college: College | null;
  onClose: () => void;
  onSave: (college: College) => Promise<void>;
}

const CollegeForm: React.FC<CollegeFormProps> = ({ college, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: college?.name || '',
    address: college?.address || '',
    phone: college?.phone || '',
    email: college?.email || '',
    website: college?.website || '',
    established: college?.established || '',
    status: college?.status || 'active',
    principalName: college?.principalName || '',
    principalEmail: college?.principalEmail || '',
    principalPhone: college?.principalPhone || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const collegeData = {
      name: formData.name,
      address: formData.address,
      phone: formData.phone,
      email: formData.email,
      website: formData.website || undefined,
      established: formData.established || undefined,
      status: formData.status
    };

    // Don't include principal fields in the update data as they're not supported by the backend
    // Principal information is handled separately through user management

    await onSave(collegeData as College);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-md w-full my-8 p-6 max-h-[calc(100vh-4rem)] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4 sticky top-0 bg-white pt-2 pb-4 z-10">
          {college ? 'Edit College' : 'Add New College'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* College Basic Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">College Information</h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">College Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter college name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">College Address *</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Enter complete college address"
                required
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Contact Information</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="college@example.edu"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    // Allow only digits, spaces, hyphens, parentheses, and plus sign
                    const cleanValue = e.target.value.replace(/[^+\d\s\-\(\)]/g, '');
                    setFormData({...formData, phone: cleanValue});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+91-98765-43210"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Only digits, spaces, hyphens, and parentheses allowed (10-20 characters)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  placeholder="https://college.edu"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Established Year</label>
                <input
                  type="text"
                  placeholder="e.g., 1985"
                  value={formData.established}
                  onChange={(e) => {
                    // Allow only 4 digits for year
                    const cleanValue = e.target.value.replace(/[^\d]/g, '').slice(0, 4);
                    setFormData({...formData, established: cleanValue});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter 4-digit year (e.g., 1985, 2024)
                </p>
              </div>
            </div>
          </div>

          {/* Principal Information */}
          {/* <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">Principal Information</h4>
            <p className="text-sm text-gray-600">
              📧 If you provide principal details, an invitation email will be sent automatically after creating the college.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Principal Name</label>
                <input
                  type="text"
                  value={formData.principalName}
                  onChange={(e) => setFormData({...formData, principalName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Dr. John Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Principal Email ID</label>
                <input
                  type="email"
                  value={formData.principalEmail}
                  onChange={(e) => setFormData({...formData, principalEmail: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="principal@college.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Principal Phone Number</label>
              <input
                type="tel"
                value={formData.principalPhone}
                onChange={(e) => {
                  // Allow only digits, spaces, hyphens, parentheses, and plus sign
                  const cleanValue = e.target.value.replace(/[^+\d\s\-\(\)]/g, '');
                  setFormData({...formData, principalPhone: cleanValue});
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+91-98765-43210"
              />
            </div>
          </div> */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {college ? 'Update' : 'Create'} College
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

export default CollegeManagement;