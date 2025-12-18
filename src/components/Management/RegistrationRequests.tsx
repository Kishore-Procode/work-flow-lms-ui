import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Building,
  Phone,
  Search,
  GraduationCap,
  AlertCircle,
  RefreshCw,
  FileText,
  Calendar
} from 'lucide-react';
import { ApiService } from '../../services/api';
import { RegistrationRequest, College, Department } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { extractDataArray } from '../../utils/filterUtils';
import { queryKeys } from '../../lib/react-query';

const RegistrationRequests: React.FC = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Debounce search term to prevent re-rendering on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // React Query hooks for data fetching
  const { data: allRequests = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.registrationRequests.list({ limit: 1000 }),
    queryFn: () => ApiService.getMyRegistrationRequests({ limit: 1000 }),
    select: (data) => extractDataArray(data),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const { data: colleges = [] } = useQuery({
    queryKey: queryKeys.colleges.all,
    queryFn: () => ApiService.getColleges(),
    select: (data) => extractDataArray(data),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: () => ApiService.getDepartments(),
    select: (data) => extractDataArray(data),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Helper functions - must be defined before useMemo to avoid initialization errors
  const getCollegeName = useCallback((collegeId: string | null | undefined) => {
    if (!collegeId) return 'Unknown College';
    const college = colleges.find(c => c.id === collegeId);
    return college?.name || 'Unknown College';
  }, [colleges]);

  const getDepartmentName = useCallback((departmentId: string | null | undefined) => {
    if (!departmentId) return 'N/A';
    const department = departments.find(d => d.id === departmentId);
    return department?.name || 'Unknown Department';
  }, [departments]);

  // Filter requests based on search and filters using useMemo
  const filteredRequests = useMemo(() => {
    let filtered = [...allRequests];

    // Apply search filter with debounced search term
    if (debouncedSearchTerm) {
      filtered = filtered.filter(request =>
        request.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        request.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        // request.phone.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        getCollegeName(request.collegeId).toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        getDepartmentName(request.departmentId).toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    return filtered;
  }, [allRequests, debouncedSearchTerm, statusFilter, getCollegeName, getDepartmentName]);



  // Mutations with proper query invalidation
  const approveRequestMutation = useMutation({
    mutationFn: (id: string) => ApiService.approveRegistrationRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.registrationRequests.all });
      toast.success('Request approved successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve request');
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      ApiService.rejectRegistrationRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.registrationRequests.all });
      toast.success('Request rejected successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject request');
    },
  });

  // Filter handlers
  const handleSearchChange = (search: string) => {
    setSearchTerm(search);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'principal':
        return 'bg-purple-100 text-purple-800';
      case 'hod':
        return 'bg-blue-100 text-blue-800';
      case 'staff':
        return 'bg-indigo-100 text-indigo-800';
      case 'student':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPermissionText = () => {
    switch (currentUser?.role) {
      case 'admin':
        return 'You can view and approve all registration requests across the system';
      case 'principal':
        return 'You can view and approve HOD registration requests from your college';
      case 'hod':
        return 'You can view and approve staff registration requests from your department';
      case 'staff':
        return 'You can view and approve student registration requests from your assigned classes';
      default:
        return 'No access to registration requests';
    }
  };

  const getApprovalChain = (role: string) => {
    const chains: Record<string, string> = {
      'student': 'Staff → HOD → Principal',
      'staff': 'HOD → Principal',
      'hod': 'Principal',
      'principal': 'Admin'
    };
    return chains[role] || 'Unknown';
  };

  const handleApprove = (requestId: string) => {
    const request = filteredRequests.find(req => req.id === requestId);
    if (!request) return;

    approveRequestMutation.mutate(requestId);
  };

  const handleReject = (requestId: string, rejectionReason?: string) => {
    const request = filteredRequests.find(req => req.id === requestId);
    if (!request) return;

    // Get rejection reason if not provided
    const reason = rejectionReason || prompt('Please provide a reason for rejection (optional):') || 'No reason provided';

    if (!window.confirm(`Are you sure you want to reject ${request.name}'s registration request?`)) {
      return;
    }

    rejectRequestMutation.mutate({ id: requestId, reason });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Calculate statistics from all requests (not filtered)
  const pendingCount = allRequests.filter(req => req.status === 'pending').length;
  const approvedCount = allRequests.filter(req => req.status === 'approved').length;
  const rejectedCount = allRequests.filter(req => req.status === 'rejected').length;
  const totalCount = allRequests.length;

  return (
    <div className="p-6 space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Registration Requests</h1>
            <p className="text-purple-100 mb-1">Review and manage user registration requests</p>
            <p className="text-sm text-purple-200">{getPermissionText()}</p>
          </div>
          <button
            onClick={() => loadData()}
            className="bg-white text-purple-600 px-6 py-3 rounded-lg hover:bg-purple-50 transition-colors flex items-center space-x-2 font-medium shadow-lg"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-3xl font-bold text-gray-900">{totalCount}</p>
              <p className="text-sm text-gray-500 mt-1">All time</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
              <p className="text-sm text-gray-500 mt-1">Awaiting review</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-3xl font-bold text-blue-600">{approvedCount}</p>
              <p className="text-sm text-gray-500 mt-1">Successfully approved</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
              <p className="text-sm text-gray-500 mt-1">Declined requests</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters and Search */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name, email, college, or department..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Enhanced Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredRequests.length > 0 ? (
          <>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                Registration Requests ({filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'})
              </h3>
            </div>
            <div className="grid gap-4 p-6">
              {filteredRequests.map((request) => (
                <div key={request.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{request.name}</h3>
                            <p className="text-sm text-gray-500">{request.email}</p>
                          </div>

                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(request.status)}
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                                {request.status.toUpperCase()}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2">
                              <GraduationCap className="w-4 h-4 text-gray-400" />
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(request.role || 'unknown')}`}>
                                {(request.role || 'UNKNOWN').toUpperCase()}
                              </span>
                            </div>

                            {/* Show approval stage for pending requests */}
                            {request.status === 'pending' && (request as any).currentApproverRole && (
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-blue-400" />
                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                  Awaiting {((request as any).currentApproverRole || '').toUpperCase()} Approval
                                </span>
                              </div>
                            )}

                            {/* Show approval hierarchy progress */}
                            {request.role && (
                              <div className="flex items-center space-x-1">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {getApprovalChain(request.role)}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span>{request.phone}</span>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Building className="w-4 h-4 text-gray-400" />
                              <span>{request.collegeName || getCollegeName(request.collegeId)}</span>
                            </div>

                            {request.departmentId && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <span>Department: {getDepartmentName(request.departmentId)}</span>
                              </div>
                            )}

                            {request.class && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <span>Class: {request.class}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {request.status === 'pending' && currentUser?.role !== 'staff' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={approveRequestMutation.isPending}
                          className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${approveRequestMutation.isPending
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700'
                            } text-white`}
                        >
                          {approveRequestMutation.isPending ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Approving...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span>Approve</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={rejectRequestMutation.isPending}
                          className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${rejectRequestMutation.isPending
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-red-600 hover:bg-red-700'
                            } text-white`}
                        >
                          {rejectRequestMutation.isPending ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Rejecting...</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
                              <span>Reject</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Status Information for Processed Requests */}
                    {request.status !== 'pending' && (
                      <div className="text-sm text-gray-500 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Status:</span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                            {request.status.toUpperCase()}
                          </span>
                        </div>
                        {request.reviewedAt && (
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-3 h-3" />
                            <span>Reviewed: {new Date(request.reviewedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                        {request.rejectionReason && request.status === 'rejected' && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                            <span className="font-medium text-red-800">Reason:</span>
                            <span className="text-red-700 ml-1">{request.rejectionReason}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No registration requests found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'No registration requests available for your access level.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationRequests;