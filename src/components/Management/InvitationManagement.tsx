import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Mail,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  User,
  Search,
  Users,
  Building,
  GraduationCap,
  UserCheck,
  UserX,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { ApiService } from '../../services/api';
import { Invitation, User as UserType, College, Department } from '../../types';
import EnhancedPagination, { PaginationInfo } from '../UI/EnhancedPagination';
import LoadingSpinner from '../UI/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';
import OptimizedDropdown from '../UI/OptimizedDropdown';

const InvitationManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [allInvitations, setAllInvitations] = useState<Invitation[]>([]); // Store all invitations for client-side filtering
  const [users, setUsers] = useState<UserType[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showSendForm, setShowSendForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      // Reset to page 1 when search changes (unless already on page 1)
      if (currentPage !== 1 && searchTerm !== debouncedSearchTerm) {
        setCurrentPage(1);
      }
    }, 800); // Increased delay to 800ms for better UX

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to first page when filters change (but not search, since it's handled above)
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [statusFilter, roleFilter]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading invitations and related data...');

      // Build query parameters - removed search from API call, will filter client-side
      const invitationParams = new URLSearchParams({
        page: '1',
        limit: '1000', // Load all invitations for client-side filtering
      });

      // Add filters if they exist
      if (statusFilter !== 'all') {
        invitationParams.append('status', statusFilter);
      }
      if (roleFilter !== 'all') {
        invitationParams.append('role', roleFilter);
      }

      const [invitationsResponse, usersData, collegesData, departmentsData] = await Promise.all([
        ApiService.getInvitationsWithPagination(invitationParams.toString()),
        ApiService.getUsers(),
        // Always use public endpoint for colleges to ensure all roles can access
        ApiService.getCollegesPublic(),
        ApiService.getDepartments()
      ]);

      // Handle paginated invitations response
      let allInvitationsData: Invitation[] = [];
      if (invitationsResponse && typeof invitationsResponse === 'object' && 'data' in invitationsResponse) {
        allInvitationsData = invitationsResponse.data || [];
      } else {
        // Fallback for non-paginated response
        allInvitationsData = Array.isArray(invitationsResponse) ? invitationsResponse : [];
      }

      // Store all invitations for client-side filtering
      setAllInvitations(allInvitationsData);

      // Handle other data responses
      const users = Array.isArray(usersData) ? usersData : usersData?.data || [];
      const colleges = Array.isArray(collegesData) ? collegesData : collegesData?.data || [];
      const departments = Array.isArray(departmentsData) ? departmentsData : departmentsData?.data || [];

      setUsers(users as UserType[]);
      setColleges(colleges as College[]);
      setDepartments(departments as Department[]);

    } catch (error) {
      console.error('Failed to load data:', error);
      setAllInvitations([]);
      setInvitations([]);
      setUsers([]);
      setColleges([]);
      setDepartments([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, roleFilter]); // Removed debouncedSearchTerm and pagination from dependencies

  // Load data when dependencies change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side filtering and pagination
  useEffect(() => {
    let filtered = [...allInvitations];

    // Apply search filter (client-side)
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(invitation => {
        const email = invitation.email?.toLowerCase() || '';
        const collegeName = getCollegeName(invitation.collegeId).toLowerCase();
        const departmentName = getDepartmentName(invitation.departmentId).toLowerCase();
        const role = invitation.role?.toLowerCase() || '';
        
        return email.includes(searchLower) || 
               collegeName.includes(searchLower) || 
               departmentName.includes(searchLower) ||
               role.includes(searchLower);
      });
    }

    // Calculate pagination
    const total = filtered.length;
    const pages = Math.ceil(total / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filtered.slice(startIndex, endIndex);

    setInvitations(paginatedData);
    setTotalItems(total);
    setTotalPages(pages);
  }, [allInvitations, debouncedSearchTerm, currentPage, itemsPerPage, colleges, departments]);

  const getCollegeName = (collegeId: string) => {
    const college = colleges.find(c => c.id === collegeId);
    return college?.name || 'Unknown College';
  };

  const getDepartmentName = (departmentId: string | undefined) => {
    if (!departmentId) return 'N/A';
    const department = departments.find(d => d.id === departmentId);
    return department?.name || 'Unknown Department';
  };

  const getSenderName = (senderId: string) => {
    const sender = users.find(u => u.id === senderId);
    return sender?.name || 'Unknown User';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'expired':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-orange-100 text-orange-800',
      accepted: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleResendInvitation = async (invitationId: string) => {
    if (window.confirm('Are you sure you want to resend this invitation? This will generate a new invitation link and extend the expiry date.')) {
      try {
        console.log('Resending invitation:', invitationId);
        const updatedInvitation = await ApiService.resendInvitation(invitationId);

        // Update the invitation in the list
        setInvitations(invitations.map(inv =>
          inv.id === invitationId ? updatedInvitation : inv
        ));

        alert('Invitation resent successfully! A new email has been sent with updated login credentials.');
      } catch (error) {
        console.error('Failed to resend invitation:', error);
        alert('Failed to resend invitation. Please try again.');
      }
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (window.confirm('Are you sure you want to cancel this invitation?')) {
      try {
        await ApiService.deleteInvitation(invitationId);
        setInvitations(invitations.filter(inv => inv.id !== invitationId));
        alert('Invitation cancelled successfully!');
      } catch (error) {
        console.error('Failed to cancel invitation:', error);
        alert('Failed to cancel invitation. Please try again.');
      }
    }
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

  // Check if current user can send invitations
  const canSendInvitations = () => {
    if (!currentUser) return false;
    const role = currentUser.role;
    return ['admin', 'principal', 'hod', 'staff'].includes(role);
  };

  // Get role-specific permission text
  const getRolePermissionText = () => {
    switch (currentUser?.role) {
      case 'admin':
        return 'You can invite principals, HODs, staff, and students';
      case 'principal':
        return 'You can invite HODs, staff, and students';
      case 'hod':
        return 'You can invite staff and students';
      case 'staff':
        return 'You can invite students only';
      default:
        return 'No invitation permissions';
    }
  };

  const pendingCount = invitations.filter(inv => inv.status === 'pending').length;
  const acceptedCount = invitations.filter(inv => inv.status === 'accepted').length;
  const rejectedCount = invitations.filter(inv => inv.status === 'rejected').length;
  const expiredCount = invitations.filter(inv => inv.status === 'expired').length;
  const totalCount = totalItems; // Use total from pagination

  return (
    <div className="p-6 space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Invitation Management</h1>
            <p className="text-blue-100 mb-1">Send and manage user invitations efficiently</p>
            <p className="text-sm text-blue-200">{getRolePermissionText()}</p>
          </div>
          {canSendInvitations() && (
            <button
              onClick={() => setShowSendForm(true)}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors flex items-center space-x-2 font-medium shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>Send Invitation</span>
            </button>
          )}
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Invitations</p>
              <p className="text-3xl font-bold text-gray-900">{totalCount}</p>
              <p className="text-sm text-gray-500 mt-1">All time</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
              <p className="text-sm text-gray-500 mt-1">Awaiting response</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Accepted</p>
              <p className="text-3xl font-bold text-blue-600">{acceptedCount}</p>
              <p className="text-sm text-gray-500 mt-1">Successfully joined</p>
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
              <p className="text-sm text-gray-500 mt-1">Declined invitations</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <UserX className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Expired</p>
              <p className="text-3xl font-bold text-gray-600">{expiredCount}</p>
              <p className="text-sm text-gray-500 mt-1">Expired invitations</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <Clock className="w-6 h-6 text-gray-600" />
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
                placeholder="Search by email, college, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && searchTerm !== debouncedSearchTerm && (
                <div className="absolute right-10 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  <span className="text-xs text-gray-500">Searching...</span>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Clear search"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
            {debouncedSearchTerm && (
              <div className="mt-2 text-sm text-gray-600">
                <span className="font-medium">{totalItems}</span> result{totalItems !== 1 ? 's' : ''} found for "{debouncedSearchTerm}"
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">All Roles</option>
              <option value="principal">Principal</option>
              <option value="hod">HOD</option>
              <option value="staff">Staff</option>
              <option value="student">Student</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setRoleFilter('all');
                setCurrentPage(1);
              }}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title="Clear all filters"
            >
              Clear Filters
            </button>

            <button
              onClick={loadData}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Invitations Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {invitations.length > 0 ? (
          <>
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Invitation List ({totalItems} {totalItems === 1 ? 'invitation' : 'invitations'})
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Page {currentPage} of {totalPages}</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-200 rounded px-2 py-1 text-sm"
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>Recipient</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>Role</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4" />
                        <span>College</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="w-4 h-4" />
                        <span>Department</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Sent By</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Date</span>
                      </div>
                    </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invitations.map((invitation) => (
                <tr key={invitation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{invitation.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {invitation.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getCollegeName(invitation.collegeId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getDepartmentName(invitation.departmentId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getSenderName(invitation.sentBy)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(invitation.status)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invitation.status)}`}>
                        {invitation.status.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(() => {
                      // Try different possible field names from backend
                      const dateStr = invitation.sentAt || (invitation as any).sent_at || invitation.createdAt || (invitation as any).created_at;
                      if (!dateStr) return 'No date';

                      try {
                        const date = new Date(dateStr);
                        if (isNaN(date.getTime())) return 'Invalid date';

                        return date.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                      } catch (error) {
                        return 'Invalid date';
                      }
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {invitation.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleResendInvitation(invitation.id)}
                            className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                            title="Resend invitation"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCancelInvitation(invitation.id)}
                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                            title="Cancel invitation"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100">
            <EnhancedPagination
              pagination={{
                page: currentPage,
                limit: itemsPerPage,
                total: totalItems,
                totalPages: totalPages,
                hasNextPage: currentPage < totalPages,
                hasPreviousPage: currentPage > 1,
              }}
              onPageChange={setCurrentPage}
              onLimitChange={(newLimit: number) => {
                setItemsPerPage(newLimit);
                setCurrentPage(1);
              }}
              showPageSizeSelector={true}
              showJumpToPage={true}
              showPageInfo={true}
            />
          </div>
        )}
        </>
        ) : (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invitations found</h3>
            <p className="text-gray-500 mb-4">Start by sending your first invitation.</p>
            <button
              onClick={() => setShowSendForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Send Invitation
            </button>
          </div>
        )}
      </div>

      {/* Send Invitation Form */}
      {showSendForm && (
        <SendInvitationForm
          colleges={colleges}
          departments={departments}
          currentUser={currentUser}
          onClose={() => setShowSendForm(false)}
          onSend={(invitation) => {
            setInvitations([...invitations, invitation]);
            setShowSendForm(false);
          }}
        />
      )}
    </div>
  );
};

// Helper function to get default role based on current user's role
const getDefaultRole = (userRole: string | undefined) => {
  switch (userRole) {
    case 'admin':
      return 'principal';
    case 'principal':
      return 'hod';
    case 'hod':
      return 'staff';
    case 'staff':
      return 'student';
    default:
      return 'student';
  }
};

// Send Invitation Form Component
interface SendInvitationFormProps {
  colleges: College[];
  departments: Department[];
  currentUser: any; // Use any to handle AuthUser type mismatch
  onClose: () => void;
  onSend: (invitation: Invitation) => void;
}

const SendInvitationForm: React.FC<SendInvitationFormProps> = ({ colleges, departments, currentUser, onClose, onSend }) => {
  const [formData, setFormData] = useState({
    email: '',
    role: getDefaultRole(currentUser?.role),
    collegeId: currentUser?.collegeId || '',
    departmentId: currentUser?.departmentId || '',
    name: '',
    phone: '',
    // Student-specific fields
    courseId: '',
    academicYearId: '',
    yearOfStudy: 1,
    section: '',
    sectionId: '',
    rollNumber: '',
    // Staff-specific fields
    designation: '',
    qualification: '',
    experience: 0
  });

  // Enhanced dropdown state
  const [courses, setCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Auto-set college and department for non-admin users
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      setFormData(prev => ({
        ...prev,
        collegeId: currentUser.collegeId || '',
        departmentId: currentUser.departmentId || ''
      }));
    }
  }, [currentUser]);

  // Load departments when college changes
  useEffect(() => {
    const loadDepartmentsForCollege = async () => {
      if (formData.collegeId) {
        try {
          setLoading(true);
          const collegeDepartments = await ApiService.getDepartmentsByCollegePublic(formData.collegeId);
          // Update the filtered departments for the current college
          const updatedFilteredDepartments = collegeDepartments || [];

          // Reset dependent fields when college changes
          setFormData(prev => ({
            ...prev,
            departmentId: currentUser?.departmentId && updatedFilteredDepartments.find(d => d.id === currentUser.departmentId)
              ? currentUser.departmentId
              : '',
            courseId: '',
            section: '',
            sectionId: '',
            rollNumber: ''
          }));
          setCourses([]);
          // setFilteredCourses([]);
          setAcademicYears([]);
          setSections([]);
        } catch (error) {
          console.error('Failed to load departments for college:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadDepartmentsForCollege();
  }, [formData.collegeId, currentUser?.departmentId]);

  // Load courses when college and department change (for student invitations)
  useEffect(() => {
    const loadCoursesForDepartment = async () => {
      if (formData.collegeId && formData.departmentId && (formData.role === 'student' || formData.role === 'staff')) {
        try {
          setLoading(true);
          const departmentCourses = await ApiService.getCoursesByCollegeAndDepartment(formData.collegeId, formData.departmentId);
          setCourses(departmentCourses || []);
          setFilteredCourses(departmentCourses || []);

          // Reset dependent fields
          setFormData(prev => ({ ...prev, courseId: '', section: '', sectionId: '', rollNumber: '' }));
          setAcademicYears([]);
          setSections([]);
        } catch (error) {
          console.error('Failed to load courses for department:', error);
          setCourses([]);
          setFilteredCourses([]);
        } finally {
          setLoading(false);
        }
      }
    };

    loadCoursesForDepartment();
  }, [formData.collegeId, formData.departmentId, formData.role]);
  console.log(filteredCourses,"filteredCourses");
  // Load academic years when course changes (for student invitations)
  useEffect(() => {
    const loadAcademicYearsForCourse = async () => {
      if (formData.courseId && formData.role === 'student') {
        try {
          setLoading(true);
          const courseAcademicYears = await ApiService.getAcademicYearsByCourse(formData.courseId);
          setAcademicYears(courseAcademicYears || []);

          // Reset dependent fields
          setFormData(prev => ({ ...prev, academicYearId: '', section: '', sectionId: '', rollNumber: '' }));
          setSections([]);
        } catch (error) {
          console.error('Failed to load academic years for course:', error);
          setAcademicYears([]);
        } finally {
          setLoading(false);
        }
      }
    };

    loadAcademicYearsForCourse();
  }, [formData.courseId, formData.role]);

  // Load sections when course, department, and academic year change (for student invitations)
  useEffect(() => {
    const loadSectionsForCourseAndYear = async () => {
      if (formData.courseId && formData.departmentId && formData.academicYearId && formData.role === 'student') {
        try {
          setLoading(true);
          const courseSections = await ApiService.getSectionsByCourseDepYear(formData.courseId, formData.departmentId, formData.academicYearId);
          setSections(courseSections || []);

          // Reset dependent fields
          setFormData(prev => ({ ...prev, section: '', sectionId: '', rollNumber: '' }));
        } catch (error) {
          console.error('Failed to load sections for course and year:', error);
          setSections([]);
        } finally {
          setLoading(false);
        }
      }
    };

    loadSectionsForCourseAndYear();
  }, [formData.courseId, formData.departmentId, formData.academicYearId, formData.role]);

  // Get allowed roles based on current user's role (Hierarchical permissions)
  const getAllowedRoles = (userRole: string | undefined) => {
    switch (userRole) {
      case 'admin':
        return ['principal', 'hod', 'staff', 'student'];
      case 'principal':
        return ['hod', 'staff', 'student']; // Principal can invite HODs, staff, and students
      case 'hod':
        return ['staff', 'student']; // HOD can invite staff and students
      case 'staff':
        return ['student']; // Staff can only invite students
      default:
        return [];
    }
  };

  // Get filtered colleges based on user role and invited role
  const getFilteredColleges = () => {
    // If inviting a principal, always show all colleges (principals can work at any college)
    if (formData.role === 'principal') {
      return colleges;
    }

    // If current user is admin or principal, they can invite to any college
    if (currentUser?.role === 'admin' || currentUser?.role === 'principal') {
      return colleges;
    }

    // HOD, staff, and students can only invite to their own college
    const filtered = colleges.filter(college => college.id === currentUser?.collegeId);
    return filtered;
  };

  // Get filtered departments based on user role and selected college
  const getFilteredDepartments = () => {
    let filteredDepts = departments.filter(d => d.collegeId === formData.collegeId);
    
    if (currentUser?.role === 'hod' || currentUser?.role === 'staff') {
      // HODs and staff can only invite to their own department
      filteredDepts = filteredDepts.filter(d => d.id === currentUser?.departmentId);
    }
    
    return filteredDepts;
  };

  const allowedRoles = getAllowedRoles(currentUser?.role);
  const filteredColleges = getFilteredColleges();
  const filteredDepartments = getFilteredDepartments();



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const invitationData = {
        email: formData.email,
        role: formData.role,
        college_id: formData.collegeId,
        department_id: formData.departmentId || undefined,
        name: formData.name,
        phone: formData.phone || undefined,
        // Include role-specific fields
        ...(formData.role === 'student' && {
          yearOfStudy: formData.yearOfStudy,
          section: formData.section,
          rollNumber: formData.rollNumber,
          academicYearId: formData.academicYearId,
          courseId: formData.courseId,
          sectionId: formData.sectionId
        }),
        ...((['staff', 'hod'].includes(formData.role)) && {
          designation: formData.designation || undefined,
          qualification: formData.qualification || undefined,
          experience: formData.experience || undefined
        })
      };

      const newInvitation = await ApiService.createInvitation(invitationData);
      onSend(newInvitation as any); // Type assertion to handle interface mismatch
      alert(`Invitation sent to ${formData.name} (${formData.email})!`);
    } catch (error) {
      console.error('Failed to send invitation:', error);
      alert('Failed to send invitation. Please try again.');
    }
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Send Invitation</h2>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <OptimizedDropdown
              options={allowedRoles.map(role => ({
                value: role,
                label: role.charAt(0).toUpperCase() + role.slice(1)
              }))}
              value={formData.role}
              onChange={(value) => setFormData({...formData, role: value})}
              placeholder="Select role"
              required
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">College *</label>
            <OptimizedDropdown
              options={filteredColleges.map(college => ({
                value: college.id,
                label: college.name
              }))}
              value={formData.collegeId}
              onChange={(value) => setFormData({...formData, collegeId: value, departmentId: ''})}
              placeholder="🏫 Select college"
              required
              disabled={filteredColleges.length <= 1}
              searchable={filteredColleges.length > 5}
              className="w-full"
            />
          </div>

          {(formData.role === 'hod' || formData.role === 'staff' || formData.role === 'student') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <OptimizedDropdown
                options={filteredDepartments.map(dept => ({
                  value: dept.id,
                  label: dept.name
                }))}
                value={formData.departmentId}
                onChange={(value) => setFormData({...formData, departmentId: value})}
                placeholder="🏢 Select department"
                required
                disabled={!formData.collegeId || filteredDepartments.length === 0}
                searchable={filteredDepartments.length > 5}
                className="w-full"
              />
            </div>
          )}

          {/* Note: Principals don't need department selection as they oversee the entire college */}

          {/* Course Selection for Staff and Students */}
          {(formData.role === 'staff' || formData.role === 'student') && filteredCourses.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
              <OptimizedDropdown
                options={filteredCourses.map(course => ({
                  value: course.id,
                  label: `${course.name} (${course.code})`
                }))}
                value={formData.courseId || ''}
                onChange={(value) => setFormData({...formData, courseId: value, academicYearId: '', section: '', sectionId: '', rollNumber: ''})}
                placeholder="📚 Select course"
                required
                searchable={filteredCourses.length > 5}
                className="w-full"
              />
            </div>
          )}

          {/* Student-specific fields */}
          {formData.role === 'student' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Student Information</h3>



              {/* Academic Year Selection */}
              {academicYears.length > 0 && formData.courseId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
                  <OptimizedDropdown
                    options={academicYears.map(year => ({
                      value: year.id,
                      label: year.yearName
                    }))}
                    value={formData.academicYearId || ''}
                    onChange={(value) => setFormData({...formData, academicYearId: value, section: '', sectionId: '', rollNumber: ''})}
                    placeholder="📅 Select academic year"
                    required
                    className="w-full"
                  />
                </div>
              )}

              <div className="grid grid-cols-1">
                

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
                  {sections.length > 0 ? (
                    <OptimizedDropdown
                      options={sections.map(section => ({
                        value: section.id,
                        label: section.name
                      }))}
                      value={formData.sectionId || ''}
                      onChange={(value) => {
                        const selectedSection = sections.find(s => s.id === value);
                        setFormData({
                          ...formData,
                          sectionId: value,
                          section: selectedSection?.name || ''
                        });
                      }}
                      placeholder="📋 Select section"
                      required
                      className="w-full"
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData.section}
                      onChange={(e) => setFormData({...formData, section: e.target.value.toUpperCase()})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      placeholder="A, B, C, etc."
                      maxLength={10}
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number *</label>
                <input
                  type="text"
                  value={formData.rollNumber}
                  onChange={(e) => setFormData({...formData, rollNumber: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="Enter student roll number"
                  maxLength={50}
                />
              </div>
            </div>
          )}

          {/* Staff-specific fields */}
          {(['staff', 'hod'].includes(formData.role)) && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Staff Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({...formData, designation: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={formData.role === 'hod' ? 'Head of Department' : 'Assistant Professor, Associate Professor, etc.'}
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                <input
                  type="text"
                  value={formData.qualification}
                  onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="M.Tech, Ph.D, etc."
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
                <input
                  type="number"
                  value={formData.experience}
                  onChange={(e) => setFormData({...formData, experience: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Years of teaching/industry experience"
                  min={0}
                  max={50}
                />
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Send Invitation</span>
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

export default InvitationManagement;