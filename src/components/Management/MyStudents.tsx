import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { GraduationCap, Mail, Phone, User, Search, TreePine, Calendar, Award, Camera, RefreshCw, X, MapPin, AlertTriangle } from 'lucide-react';
import { User as UserType, Tree } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { ApiService, getImageUrl } from '../../services/api';
import { useToast } from '../UI/Toast';
import EnhancedPagination, { PaginationInfo } from '../UI/EnhancedPagination';
import LoadingSpinner from '../UI/LoadingSpinner';
import { queryKeys } from '../../lib/react-query';

interface StudentProgress {
  student: UserType;
  tree: Tree;
  images: any[];
  totalPhotos: number;
  lastUpdate: string;
  healthStatus: string;
}

const MyStudents: React.FC = () => {
  const { user } = useAuth();
  const toastHook = useToast();
  const queryClient = useQueryClient();

  // Pagination and filter states
  const [filters, setFilters] = useState({
    page: 1,
    limit: 25,
    sortBy: 'name',
    sortOrder: 'asc' as 'asc' | 'desc',
    search: '',
    class: '',
    status: 'active',
    staffId: user?.id || '',
  });

  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedProgress, setSelectedProgress] = useState<StudentProgress | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [showStudentProfile, setShowStudentProfile] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<UserType | null>(null);

  // Fetch students with React Query
  const {
    data: studentsResponse,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: queryKeys.users.list({ ...filters, role: 'student', staffId: user?.id }),
    queryFn: () => ApiService.getMyStudents(filters),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 3, // 3 minutes
    enabled: !!user?.id,
  });

  // Fetch trees for progress tracking
  const { data: treesResponse } = useQuery({
    queryKey: ['trees', { staffId: user?.id }],
    queryFn: () => ApiService.getTrees({ staffId: user?.id }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!user?.id,
  });

  // Process data
  const students = Array.isArray(studentsResponse) ? studentsResponse : studentsResponse?.data || [];
  const trees = Array.isArray(treesResponse) ? treesResponse : treesResponse?.data || [];
  const pagination: PaginationInfo = studentsResponse?.pagination || {
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

  // Filter handlers
  const handleSearchChange = (search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }));
  };

  const handleClassFilter = (classValue: string) => {
    setFilters(prev => ({ ...prev, class: classValue, page: 1 }));
  };

  const getStudentTreeInfo = (studentId: string) => {
    const assignedTree = trees.find(tree =>
      tree.assignedStudentId === studentId ||
      tree.assigned_student_id === studentId ||
      tree.assignedTo === studentId
    );
    return assignedTree;
  };

  const getTreeStatusColor = (tree: Tree | undefined) => {
    if (!tree) return 'text-gray-500';
    switch (tree.status) {
      case 'healthy': return 'text-blue-600';
      case 'needs_attention': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  const getTreeStatusText = (tree: Tree | undefined) => {
    if (!tree) return 'No tree assigned';
    return `${tree.species} - ${tree.status.replace('_', ' ')}`;
  };

  // Helper function to auto-assign semester based on year of study
  const getAutoAssignedSemester = (yearOfStudy: string): string => {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const isOddSemester = currentMonth >= 6 && currentMonth <= 11; // June to November

    switch (yearOfStudy) {
      case '1st Year':
      case 'First Year':
      case '1':
        return isOddSemester ? '1st Semester' : '2nd Semester';
      case '2nd Year':
      case 'Second Year':
      case '2':
        return isOddSemester ? '3rd Semester' : '4th Semester';
      case '3rd Year':
      case 'Third Year':
      case '3':
        return isOddSemester ? '5th Semester' : '6th Semester';
      case '4th Year':
      case 'Fourth Year':
      case '4':
        return isOddSemester ? '7th Semester' : '8th Semester';
      default:
        return 'Not Assigned';
    }
  };

  // Helper function to get last upload date for a student
  const getLastUploadDate = (studentId: string): string | null => {
    const studentTree = trees.find(tree => tree.assignedStudentId === studentId);
    if (!studentTree) return null;

    // This would typically come from tree monitoring data
    // For now, return a placeholder - this should be enhanced with actual upload data
    const mockLastUpload = new Date();
    mockLastUpload.setDate(mockLastUpload.getDate() - Math.floor(Math.random() * 30));
    return mockLastUpload.toLocaleDateString();
  };

  // Helper function to open student profile popup
  const openStudentProfile = (student: UserType) => {
    setSelectedStudent(student);
    setShowStudentProfile(true);
  };

  const handleViewProgress = async (student: UserType) => {
    const assignedTree = getStudentTreeInfo(student.id);
    if (!assignedTree) {
      toast.warning('No tree assigned', `${student.name} has not been assigned a tree yet.`);
      return;
    }

    setLoadingProgress(true);
    try {
      // Get tree images/progress for this student
      const imagesResponse = await ApiService.getTreeImages(assignedTree.id);
      const images = Array.isArray(imagesResponse) ? imagesResponse : imagesResponse?.data || [];

      // Fix image URLs
      const fixedImages = images.map(img => {
        let imageUrl = null;
        console.log('Image before fixing URL:', img);

        if (img.imageUrl && img.imageUrl.startsWith('http')) {
          imageUrl = img.imageUrl;
        } else if (img.photoUrl) {
          // Handle relative paths from database
          imageUrl = getImageUrl(img.photoUrl);
        } else if (img.imageUrl) {
          // Handle relative paths from database
          imageUrl = getImageUrl(img.imageUrl);
        } else if (img.filename) {
          imageUrl = getImageUrl(img.filename);
        }

        return {
          ...img,
          imageUrl
        };
      });

      const progressData: StudentProgress = {
        student,
        tree: assignedTree,
        images: fixedImages,
        totalPhotos: fixedImages.length,
        lastUpdate: fixedImages[0]?.createdAt || fixedImages[0]?.uploadDate || 'No photos yet',
        healthStatus: assignedTree.status || 'Unknown'
      };
      console.log("progressData",progressData)
      setSelectedProgress(progressData);
      setShowProgressModal(true);
    } catch (error) {
      console.error('Failed to load student progress:', error);
      toast.error('Failed to load progress', 'Please try again.');
    } finally {
      setLoadingProgress(false);
    }
  };

  const handleContact = (student: UserType) => {
    const subject = encodeURIComponent(`Tree Monitoring - ${student.name}`);
    const body = encodeURIComponent(`Dear ${student.name},\n\nI hope this message finds you well. I wanted to reach out regarding your tree monitoring progress.\n\nBest regards,\n${user?.name}`);

    // Open email client
    window.open(`mailto:${student.email}?subject=${subject}&body=${body}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">Loading students...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error loading students: {error.message}</p>
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
    <div className="lg:space-y-6 md:space-y-4 space-y-3">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm lg:p-6 md:p-4 p-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap className="h-6 lg:h-8 w-6 lg:w-8 text-blue-600" />
              My Students
            </h1>
            <p className="text-gray-600 mt-1 text-sm lg:text-base">
              {user?.role === 'staff' && user?.classInCharge
                ? `Students in class ${user.classInCharge}`
                : user?.role === 'hod'
                ? 'Students in my department'
                : 'Students under my supervision'
              }
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              title={isLoading ? 'Refreshing...' : 'Refresh Students'}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isLoading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <div className="text-left lg:text-right">
              <div className="text-xl lg:text-2xl font-bold text-blue-600">{students.length}</div>
              <div className="text-xs lg:text-sm text-gray-500">Total Students</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm lg:p-6 md:p-4 p-3">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 lg:h-5 w-4 lg:w-5" />
              <input
                type="text"
                placeholder="Search students..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-9 lg:pl-10 pr-4 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-6">
        {students.map((student) => {
          const assignedTree = getStudentTreeInfo(student.id);
          return (
            <div key={student.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow lg:p-6 md:p-4 p-3">
              {/* Student Header */}
              <div className="flex items-start justify-between mb-3 lg:mb-4">
                <div className="flex items-center space-x-2 lg:space-x-3">
                  <div className="w-10 lg:w-12 h-10 lg:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 lg:h-6 w-5 lg:w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm lg:text-base">{student.name}</h3>
                    <p className="text-xs lg:text-sm text-gray-500">{student.rollNumber}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  student.status === 'active' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {student.status}
                </span>
              </div>

              {/* Enhanced Student Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="truncate">{student.email}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  {student.phone}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  {student.yearOfStudy || student.class} | {getAutoAssignedSemester(student.yearOfStudy || student.class)}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  Reg: {student.rollNumber || student.registrationNumber || 'Not Assigned'}
                </div>
                {student.city && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    Location: {student.city}
                  </div>
                )}
                {assignedTree && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Camera className="h-4 w-4 mr-2" />
                    Last Upload: {getLastUploadDate(student.id) || 'No uploads yet'}
                  </div>
                )}
              </div>

              {/* Tree Assignment */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TreePine className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="text-sm font-medium">Tree Assignment</span>
                  </div>
                </div>
                <div className={`text-sm mt-1 ${getTreeStatusColor(assignedTree)}`}>
                  {getTreeStatusText(assignedTree)}
                </div>
                {assignedTree && (
                  <div className="text-xs text-gray-500 mt-1">
                    Code: {assignedTree.treeCode}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleViewProgress(student)}
                  className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  View Progress
                </button>
                <button
                  onClick={() => handleContact(student)}
                  className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Contact
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {students.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
          <p className="text-gray-500">
            {filters.search
              ? 'Try adjusting your search terms'
              : 'No students are currently assigned to you'
            }
          </p>
        </div>
      )}

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

      {/* Summary Stats */}
      {students.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {students.filter(s => s.status === 'active').length}
              </div>
              <div className="text-sm text-gray-500">Active Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {students.filter(s => getStudentTreeInfo(s.id)).length}
              </div>
              <div className="text-sm text-gray-500">Trees Assigned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {trees.filter(t => t.status === 'needs_attention' && students.some(s =>
                  s.id === t.assignedStudentId || s.id === t.assigned_student_id || s.id === t.assignedTo
                )).length}
              </div>
              <div className="text-sm text-gray-500">Need Attention</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {trees.filter(t => t.status === 'healthy' && students.some(s =>
                  s.id === t.assignedStudentId || s.id === t.assigned_student_id || s.id === t.assignedTo
                )).length}
              </div>
              <div className="text-sm text-gray-500">Healthy Trees</div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Modal */}
      {showProgressModal && selectedProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Tree Progress</h2>
                  <p className="text-gray-600">{selectedProgress.student.name} - {selectedProgress.tree.species}</p>
                </div>
                <button
                  onClick={() => setShowProgressModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Progress Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <TreePine className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm text-blue-600">Tree Code</p>
                      <p className="text-lg font-semibold text-blue-900">{selectedProgress.tree.treeCode}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Camera className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm text-blue-600">Total Photos</p>
                      <p className="text-lg font-semibold text-blue-900">{selectedProgress.totalPhotos}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-purple-600 mr-3" />
                    <div>
                      <p className="text-sm text-purple-600">Last Update</p>
                      <p className="text-lg font-semibold text-purple-900">
                        {selectedProgress.lastUpdate !== 'No photos yet'
                          ? new Date(selectedProgress.lastUpdate).toLocaleDateString()
                          : 'No photos yet'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Photos */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Photos</h3>
                {selectedProgress.images.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedProgress.images.map((image, index) => (
                      <div key={image.id || index} className="border border-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={image.imageUrl}
                          alt={image.caption || 'Tree progress'}
                          className="w-full h-48 object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900 capitalize">
                              {image.imageType || 'progress'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {image.uploadDate ? new Date(image.uploadDate).toLocaleDateString() : 'Unknown date'}
                            </span>
                          </div>
                          {image.caption && (
                            <p className="text-sm text-gray-600">{image.caption}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Progress Photos</h3>
                    <p className="text-gray-500">This student hasn't uploaded any progress photos yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Profile Popup */}
      {showStudentProfile && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    {selectedStudent.profileImageUrl ? (
                      <img
                        src={selectedStudent.profileImageUrl}
                        alt={selectedStudent.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedStudent.name}</h2>
                    <p className="text-gray-600">{selectedStudent.rollNumber || 'Registration Number Not Assigned'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStudentProfile(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Student Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Personal Information</h3>

                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{selectedStudent.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{selectedStudent.phone || 'Not provided'}</p>
                    </div>
                  </div>

                  {selectedStudent.city && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Current Location</p>
                        <p className="font-medium">{selectedStudent.city}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Academic Information</h3>

                  <div className="flex items-center space-x-3">
                    <GraduationCap className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Year of Study</p>
                      <p className="font-medium">{selectedStudent.yearOfStudy || selectedStudent.class || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Current Semester</p>
                      <p className="font-medium">{getAutoAssignedSemester(selectedStudent.yearOfStudy || selectedStudent.class)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Registration Number</p>
                      <p className="font-medium">{selectedStudent.rollNumber || selectedStudent.registrationNumber || 'Not assigned'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tree Assignment Status */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Tree Assignment Status</h3>
                {(() => {
                  const assignedTree = getStudentTreeInfo(selectedStudent.id);
                  return assignedTree ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <TreePine className="h-6 w-6 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">{assignedTree.species}</p>
                          <p className="text-sm text-gray-600">Status: {assignedTree.status?.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Last Upload</p>
                        <p className="font-medium">{getLastUploadDate(selectedStudent.id) || 'No uploads yet'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 text-gray-500">
                      <AlertTriangle className="h-6 w-6" />
                      <p>No tree assigned yet</p>
                    </div>
                  );
                })()}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => handleViewProgress(selectedStudent)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Camera className="h-4 w-4" />
                  <span>View Progress</span>
                </button>
                <button
                  onClick={() => setShowStudentProfile(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyStudents;
