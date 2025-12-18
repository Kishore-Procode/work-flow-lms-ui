import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, User, Mail, Phone, Building, GraduationCap } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ApiService } from '../../services/api';
import { useApprovals, useApproveRequest, useRejectRequest } from '../../hooks/api/useApprovals';
import EnhancedPagination, { PaginationInfo } from '../UI/EnhancedPagination';
import LoadingSpinner from '../UI/LoadingSpinner';

const ApprovalManagement: React.FC = () => {
  const { user } = useAuth();

  // Pagination and filter states
  const [filters, setFilters] = useState({
    page: 1,
    limit: 25,
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
    search: '',
    status: 'pending',
    type: '',
  });

  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch approvals with React Query
  const {
    data: approvalsResponse,
    isLoading,
    error,
    refetch
  } = useApprovals(filters);

  // Mutations
  const approveRequestMutation = useApproveRequest();
  const rejectRequestMutation = useRejectRequest();

  // Process data
  const pendingApprovals = Array.isArray(approvalsResponse) ? approvalsResponse : approvalsResponse?.data || [];
  const pagination: PaginationInfo = approvalsResponse?.pagination || {
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }));
  };

  const handleApprove = (workflowId: string) => {
    approveRequestMutation.mutate(workflowId);
  };

  const handleReject = (workflowId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }

    rejectRequestMutation.mutate({ id: workflowId, reason: rejectionReason });
    setShowRejectModal(null);
    setRejectionReason('');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'student': return 'bg-blue-100 text-blue-800';
      case 'staff': return 'bg-blue-100 text-blue-800';
      case 'hod': return 'bg-purple-100 text-purple-800';
      case 'principal': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getApprovalLevel = (currentRole: string, requestedRole: string) => {
    const hierarchy = {
      'student': ['staff', 'hod', 'principal'],
      'staff': ['hod', 'principal'],
      'hod': ['principal'],
      'principal': ['admin']
    };

    const levels = hierarchy[requestedRole as keyof typeof hierarchy] || [];
    const currentIndex = levels.indexOf(currentRole);
    
    return {
      current: currentIndex + 1,
      total: levels.length,
      isFirst: currentIndex === 0,
      isFinal: currentIndex === levels.length - 1
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">Loading pending approvals...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error loading approvals: {error.message}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Approval Management</h1>
        <p className="text-blue-100">
          Review and process registration requests requiring your approval as {user?.role?.toUpperCase()}.
        </p>
      </div>

      {/* Pending Approvals */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Pending Approvals ({pendingApprovals.length})
          </h2>
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-500">No pending approvals at the moment.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {pendingApprovals.map((approval) => {
              const approvalLevel = getApprovalLevel(approval.currentApproverRole, approval.requestedRole);
              
              return (
                <div key={approval.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Request Header */}
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-600" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{approval.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              {approval.email}
                            </span>
                            <span className="flex items-center">
                              <Phone className="h-4 w-4 mr-1" />
                              {approval.phone}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(approval.requestedRole)}`}>
                            {approval.requestedRole?.toUpperCase()}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </span>
                        </div>
                      </div>

                      {/* Request Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <Building className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-gray-600">College:</span>
                            <span className="ml-2 font-medium">{approval.collegeName || 'Not specified'}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <GraduationCap className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-gray-600">Department:</span>
                            <span className="ml-2 font-medium">{approval.departmentName || 'Not specified'}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="text-gray-600">Requested:</span>
                            <span className="ml-2 font-medium">
                              {new Date(approval.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-600">Approval Level:</span>
                            <span className="ml-2 font-medium">
                              {approvalLevel.current} of {approvalLevel.total}
                              {approvalLevel.isFinal && ' (Final)'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Approval Progress */}
                      <div className="mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                          <span>Approval Progress:</span>
                          <span className="font-medium">
                            {approvalLevel.isFirst ? 'First Review' : 
                             approvalLevel.isFinal ? 'Final Approval' : 'Intermediate Review'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(approvalLevel.current / approvalLevel.total) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex-shrink-0 ml-6">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(approval.id)}
                          disabled={approveRequestMutation.isLoading}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {approveRequestMutation.isLoading ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => setShowRejectModal(approval.id)}
                          disabled={rejectRequestMutation.isLoading}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Reject Request</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this registration request:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4"
              rows={4}
              placeholder="Enter rejection reason..."
              required
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={!rejectionReason.trim() || rejectRequestMutation.isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {rejectRequestMutation.isLoading ? 'Rejecting...' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalManagement;
