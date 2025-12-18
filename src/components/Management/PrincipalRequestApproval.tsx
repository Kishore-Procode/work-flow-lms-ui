import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Building, 
  GraduationCap,
  AlertTriangle,
  Eye,
  MessageSquare,
  Calendar,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';

interface PendingRequest {
  id: string;
  workflowId: string;
  requestType: 'hod_registration' | 'staff_registration' | 'student_registration';
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  requestedRole: string;
  departmentName?: string;
  courseName?: string;
  yearOfStudy?: number;
  section?: string;
  rollNumber?: string;
  designation?: string;
  qualification?: string;
  experience?: number;
  submittedAt: string;
  currentApproverRole: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'high' | 'medium' | 'low';
}

export const PrincipalRequestApproval: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch pending requests
  const {
    data: pendingRequests = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['principal-pending-requests'],
    queryFn: () => ApiService.getPendingApprovals(),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  });

  // Approve request mutation
  const approveMutation = useMutation({
    mutationFn: (workflowId: string) => ApiService.processApproval(workflowId, 'approve'),
    onSuccess: () => {
      toast.success('Request approved successfully!');
      queryClient.invalidateQueries(['principal-pending-requests']);
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve request');
    }
  });

  // Reject request mutation
  const rejectMutation = useMutation({
    mutationFn: ({ workflowId, reason }: { workflowId: string; reason: string }) => 
      ApiService.processApproval(workflowId, 'reject', reason),
    onSuccess: () => {
      toast.success('Request rejected successfully!');
      queryClient.invalidateQueries(['principal-pending-requests']);
      setSelectedRequest(null);
      setShowRejectModal(false);
      setRejectionReason('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject request');
    }
  });

  const handleApprove = (request: PendingRequest) => {
    if (window.confirm(`Are you sure you want to approve ${request.applicantName}'s ${request.requestedRole} registration?`)) {
      approveMutation.mutate(request.workflowId);
    }
  };

  const handleReject = (request: PendingRequest) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  const submitRejection = () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    rejectMutation.mutate({
      workflowId: selectedRequest.workflowId,
      reason: rejectionReason.trim()
    });
  };

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'hod_registration': return <Building className="w-5 h-5 text-blue-600" />;
      case 'staff_registration': return <User className="w-5 h-5 text-blue-600" />;
      case 'student_registration': return <GraduationCap className="w-5 h-5 text-purple-600" />;
      default: return <User className="w-5 h-5 text-gray-600" />;
    }
  };

  const getRequestTypeColor = (type: string) => {
    switch (type) {
      case 'hod_registration': return 'bg-blue-100 text-blue-800';
      case 'staff_registration': return 'bg-blue-100 text-blue-800';
      case 'student_registration': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter requests
  const filteredRequests = pendingRequests.filter((request: PendingRequest) => {
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    const matchesType = filterType === 'all' || request.requestType === filterType;
    const matchesSearch = !searchTerm || 
      request.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.applicantEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.departmentName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading pending requests...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Failed to load pending requests</p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Request Approvals</h2>
          <p className="text-gray-600">Review and approve pending registration requests</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="hod_registration">HOD Registration</option>
              <option value="staff_registration">Staff Registration</option>
              <option value="student_registration">Student Registration</option>
            </select>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center bg-blue-50 rounded-lg p-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{filteredRequests.length}</div>
              <div className="text-xs text-blue-600">Requests</div>
            </div>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Requests</h3>
            <p className="text-gray-600">All registration requests have been processed.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRequests.map((request: PendingRequest) => (
              <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      {getRequestTypeIcon(request.requestType)}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{request.applicantName}</h3>
                        <p className="text-sm text-gray-600">{request.applicantEmail}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRequestTypeColor(request.requestType)}`}>
                          {request.requestedRole.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority || 'medium')}`}>
                          {(request.priority || 'medium').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {request.departmentName && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Building className="w-4 h-4" />
                          <span>{request.departmentName}</span>
                        </div>
                      )}
                      
                      {request.applicantPhone && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{request.applicantPhone}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(request.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Additional Details for Different Request Types */}
                    {request.requestType === 'student_registration' && (
                      <div className="bg-purple-50 p-3 rounded-lg mb-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          {request.yearOfStudy && (
                            <div><span className="font-medium">Year:</span> {request.yearOfStudy}</div>
                          )}
                          {request.section && (
                            <div><span className="font-medium">Section:</span> {request.section}</div>
                          )}
                          {request.rollNumber && (
                            <div><span className="font-medium">Roll No:</span> {request.rollNumber}</div>
                          )}
                          {request.courseName && (
                            <div><span className="font-medium">Course:</span> {request.courseName}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {(request.requestType === 'staff_registration' || request.requestType === 'hod_registration') && (
                      <div className="bg-blue-50 p-3 rounded-lg mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                          {request.designation && (
                            <div><span className="font-medium">Designation:</span> {request.designation}</div>
                          )}
                          {request.qualification && (
                            <div><span className="font-medium">Qualification:</span> {request.qualification}</div>
                          )}
                          {request.experience && (
                            <div><span className="font-medium">Experience:</span> {request.experience} years</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleApprove(request)}
                      disabled={approveMutation.isLoading}
                      className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    
                    <button
                      onClick={() => handleReject(request)}
                      disabled={rejectMutation.isLoading}
                      className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Reject Request</h3>
                  <p className="text-sm text-gray-600">Rejecting {selectedRequest.applicantName}'s application</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Rejection *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a clear reason for rejection..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={4}
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                    setSelectedRequest(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRejection}
                  disabled={!rejectionReason.trim() || rejectMutation.isLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {rejectMutation.isLoading ? 'Rejecting...' : 'Reject Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
