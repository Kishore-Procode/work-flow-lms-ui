import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { 
  Users, 
  UserCheck, 
  UserX, 
  BookOpen, 
  GraduationCap,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  Eye,
  BarChart3
} from 'lucide-react';

interface ClassInChargeManagementProps {
  onNavigate?: (view: string) => void;
}

interface Assignment {
  sectionId: string;
  sectionName: string;
  courseName: string;
  courseCode: string;
  courseType: string;
  academicYear: string;
  yearNumber: number;
  maxStudents: number;
  currentStudents: number;
  actualStudentCount: number;
  sectionStatus: string;
  academicSession: string;
  departmentName: string;
  departmentCode: string;
  facultyId?: string;
  facultyName?: string;
  facultyEmail?: string;
  facultyPhone?: string;
  facultyLastLogin?: string;
  assignmentStatus: 'assigned' | 'unassigned';
}

interface Faculty {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt?: string;
  lastLogin?: string;
  currentSectionsCount: number;
  totalStudentsManaged: number;
  totalCapacityManaged?: number;
  assignedSections?: Array<{
    sectionId: string;
    sectionName: string;
    courseName: string;
    courseCode: string;
    courseType: string;
    academicYear: string;
    yearNumber: number;
    studentCount: number;
    maxStudents: number;
    academicSession: string;
    sectionStatus: string;
  }>;
}

const ClassInChargeManagement: React.FC<ClassInChargeManagementProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'workload'>('overview');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');

  // Fetch overview data
  const { data: overviewData, isLoading: overviewLoading, error: overviewError } = useQuery({
    queryKey: ['class-incharge-overview', user?.id],
    queryFn: async () => {
      console.log('🔍 Fetching class in-charge overview...');
      const result = await ApiService.getClassInChargeOverview();
      console.log('🔍 Overview data received:', result);
      return result;
    },
    enabled: !!user && user.role === 'hod',
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch staff workload
  const { data: workloadData, isLoading: workloadLoading, error: workloadError } = useQuery({
    queryKey: ['staff-workload', user?.id],
    queryFn: async () => {
      console.log('🔍 Fetching staff workload...');
      const result = await ApiService.getStaffWorkload();
      console.log('🔍 Workload data received:', result);
      return result;
    },
    enabled: !!user && user.role === 'hod',
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch available faculty
  const { data: facultyData, isLoading: facultyLoading, error: facultyError } = useQuery({
    queryKey: ['available-faculty', user?.id],
    queryFn: async () => {
      console.log('🔍 Fetching available faculty...');
      const result = await ApiService.getAvailableFaculty();
      console.log('🔍 Faculty data received:', result);
      return result;
    },
    enabled: !!user && user.role === 'hod',
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  // Assignment mutation
  const assignMutation = useMutation({
    mutationFn: ({ sectionId, facultyId }: { sectionId: string; facultyId: string }) =>
      ApiService.assignClassInCharge(sectionId, facultyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-incharge-overview'] });
      queryClient.invalidateQueries({ queryKey: ['staff-workload'] });
      queryClient.invalidateQueries({ queryKey: ['available-faculty'] });
      setShowAssignModal(false);
      setSelectedSection(null);
      setSelectedFaculty(null);
    },
  });

  // Remove assignment mutation
  const removeMutation = useMutation({
    mutationFn: (sectionId: string) => ApiService.removeClassInCharge(sectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-incharge-overview'] });
      queryClient.invalidateQueries({ queryKey: ['staff-workload'] });
      queryClient.invalidateQueries({ queryKey: ['available-faculty'] });
    },
  });

  // Sync student counts mutation
  const syncMutation = useMutation({
    mutationFn: () => ApiService.syncSectionStudentCounts(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-incharge-overview'] });
      queryClient.invalidateQueries({ queryKey: ['staff-workload'] });
      queryClient.invalidateQueries({ queryKey: ['available-faculty'] });
    },
  });

  const handleAssign = () => {
    if (selectedSection && selectedFaculty) {
      assignMutation.mutate({ sectionId: selectedSection, facultyId: selectedFaculty });
    }
  };

  const handleRemove = (sectionId: string) => {
    if (confirm('Are you sure you want to remove this class in-charge assignment?')) {
      removeMutation.mutate(sectionId);
    }
  };

  const assignments: Assignment[] = overviewData?.assignments || [];
  const summary = overviewData?.summary || {};
  const faculty: Faculty[] = facultyData || [];
  const workloadFaculty: Faculty[] = workloadData || [];

  // Get unique values for filters
  const uniqueSections = Array.from(new Set(assignments.map(a => a.sectionName))).sort();
  const uniqueCourses = Array.from(new Set(assignments.map(a => a.courseName))).sort();
  const uniqueYears = Array.from(new Set(assignments.map(a => a.academicYear))).sort();

  // Filter assignments based on all selected filters
  const filteredAssignments = assignments.filter(a => {
    const matchesSection = sectionFilter === 'all' || a.sectionName === sectionFilter;
    const matchesCourse = courseFilter === 'all' || a.courseName === courseFilter;
    const matchesYear = yearFilter === 'all' || a.academicYear === yearFilter;
    return matchesSection && matchesCourse && matchesYear;
  });

  // Debug logging
  React.useEffect(() => {
    if (workloadData) {
      console.log('Workload Data:', workloadData);
      console.log('First staff member:', workloadData[0]);
    }
  }, [workloadData]);

  if (overviewLoading || workloadLoading || facultyLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error handling
  const hasError = overviewError || workloadError || facultyError;
  const errorMessage = (overviewError as any)?.response?.data?.message || 
                      (workloadError as any)?.response?.data?.message || 
                      (facultyError as any)?.response?.data?.message || 
                      'An error occurred while loading data';

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Error Display */}
      {hasError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Failed to Load Data</h3>
              <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
              <button
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['class-incharge-overview'] });
                  queryClient.invalidateQueries({ queryKey: ['staff-workload'] });
                  queryClient.invalidateQueries({ queryKey: ['available-faculty'] });
                }}
                className="mt-2 text-sm text-red-800 underline hover:text-red-900"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Class In-Charge Management</h1>
            <p className="text-gray-600 mt-1">
              Manage staff assignments to class sections in your department
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50"
              title="Sync student counts to fix display issues"
            >
              <BarChart3 className="w-4 h-4" />
              <span>{syncMutation.isPending ? 'Syncing...' : 'Sync Counts'}</span>
            </button>
            <button
              onClick={() => setShowAssignModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Assignment</span>
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Sections</p>
                <p className="text-2xl font-bold text-blue-900">{summary.totalSections || 0}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Assigned</p>
                <p className="text-2xl font-bold text-blue-900">{summary.assignedSections || 0}</p>
              </div>
              <UserCheck className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Unassigned</p>
                <p className="text-2xl font-bold text-red-900">{summary.unassignedSections || 0}</p>
              </div>
              <UserX className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Assignment Rate</p>
                <p className="text-2xl font-bold text-purple-900">{summary.assignmentRate || 0}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Section Overview', icon: Eye },
              { id: 'assignments', label: 'Current Assignments', icon: Users },
              { id: 'workload', label: 'Staff Workload', icon: BarChart3 }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">All Sections</h3>
                <div className="flex items-center space-x-4">
                  {/* Course Filter */}
                  <div className="flex items-center space-x-2">
                    <label htmlFor="course-filter" className="text-sm font-medium text-gray-700">
                      Course:
                    </label>
                    <select
                      id="course-filter"
                      value={courseFilter}
                      onChange={(e) => setCourseFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="all">All Courses</option>
                      {uniqueCourses.map((course) => (
                        <option key={course} value={course}>
                          {course}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Academic Year Filter */}
                  <div className="flex items-center space-x-2">
                    <label htmlFor="year-filter" className="text-sm font-medium text-gray-700">
                      Year:
                    </label>
                    <select
                      id="year-filter"
                      value={yearFilter}
                      onChange={(e) => setYearFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="all">All Years</option>
                      {uniqueYears.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Section Filter */}
                  <div className="flex items-center space-x-2">
                    <label htmlFor="section-filter" className="text-sm font-medium text-gray-700">
                      Section:
                    </label>
                    <select
                      id="section-filter"
                      value={sectionFilter}
                      onChange={(e) => setSectionFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="all">All Sections</option>
                      {uniqueSections.map((section) => (
                        <option key={section} value={section}>
                          {section}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Section Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course & Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Students
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Class In-Charge
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
                    {filteredAssignments.map((assignment) => (
                      <tr key={assignment.sectionId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {assignment.sectionName}
                            </div>
                            <div className="text-sm text-gray-500">
                              Session: {assignment.academicSession || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-400">
                              Status: {assignment.sectionStatus}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {assignment.courseName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {assignment.courseCode} • {assignment.courseType}
                            </div>
                            <div className="text-xs text-gray-400">
                              {assignment.academicYear} (Year {assignment.yearNumber})
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {assignment.actualStudentCount} / {assignment.maxStudents}
                            </div>
                            <div className="text-xs text-gray-500">
                              {assignment.actualStudentCount > 0
                                ? `${Math.round((assignment.actualStudentCount / assignment.maxStudents) * 100)}% filled`
                                : 'No students'
                              }
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {assignment.facultyName ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {assignment.facultyName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {assignment.facultyEmail}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Not assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              assignment.assignmentStatus === 'assigned'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {assignment.assignmentStatus === 'assigned' ? (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <AlertCircle className="w-3 h-3 mr-1" />
                            )}
                            {assignment.assignmentStatus === 'assigned' ? 'Assigned' : 'Unassigned'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {assignment.assignmentStatus === 'assigned' ? (
                              <button
                                onClick={() => handleRemove(assignment.sectionId)}
                                className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                                disabled={removeMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Remove</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedSection(assignment.sectionId);
                                  setShowAssignModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                              >
                                <Plus className="w-4 h-4" />
                                <span>Assign</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Current Assignments</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Faculty Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned Section
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course & Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Students
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
                    {assignments
                      .filter(assignment => assignment.assignmentStatus === 'assigned')
                      .map((assignment) => (
                        <tr key={assignment.sectionId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {assignment.facultyName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {assignment.facultyEmail}
                              </div>
                              {assignment.facultyPhone && (
                                <div className="text-xs text-gray-400">
                                  {assignment.facultyPhone}
                                </div>
                              )}
                              {assignment.facultyLastLogin && (
                                <div className="text-xs text-gray-400">
                                  Last login: {new Date(assignment.facultyLastLogin).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {assignment.sectionName}
                              </div>
                              <div className="text-sm text-gray-500">
                                Session: {assignment.academicSession || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-400">
                                Status: {assignment.sectionStatus}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {assignment.courseName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {assignment.courseCode} • {assignment.courseType}
                              </div>
                              <div className="text-xs text-gray-400">
                                {assignment.academicYear} (Year {assignment.yearNumber})
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {assignment.actualStudentCount} / {assignment.maxStudents}
                              </div>
                              <div className="text-xs text-gray-500">
                                {assignment.actualStudentCount > 0
                                  ? `${Math.round((assignment.actualStudentCount / assignment.maxStudents) * 100)}% filled`
                                  : 'No students'
                                }
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Assigned
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleRemove(assignment.sectionId)}
                              className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                              disabled={removeMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Remove</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {assignments.filter(a => a.assignmentStatus === 'assigned').length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No current assignments found</p>
                    <p className="text-sm">Assign faculty to sections to see them here</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'workload' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Staff Workload Distribution</h3>
                <div className="text-sm text-gray-500">
                  Total Staff: {workloadFaculty.length}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {workloadFaculty.map((staff) => (
                  <div key={staff.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                    {/* Staff Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {staff.name ? staff.name.charAt(0).toUpperCase() : 'U'}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-base">{staff.name || 'Unknown Staff'}</h4>
                            <p className="text-sm text-gray-500">{staff.email || 'No email'}</p>
                          </div>
                        </div>

                        {staff.phone && (
                          <p className="text-xs text-gray-400 flex items-center space-x-1 mb-1">
                            <span>📞</span>
                            <span>{staff.phone}</span>
                          </p>
                        )}

                        {staff.lastLogin && (
                          <p className="text-xs text-gray-400 flex items-center space-x-1">
                            <span>🕒</span>
                            <span>Last login: {new Date(staff.lastLogin).toLocaleString()}</span>
                          </p>
                        )}

                        {staff.createdAt && (
                          <p className="text-xs text-gray-400 flex items-center space-x-1 mt-1">
                            <span>📅</span>
                            <span>Joined: {new Date(staff.createdAt).toLocaleDateString()}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Workload Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">
                            {staff.currentSectionsCount || 0}
                          </div>
                          <div className="text-xs text-gray-500 font-medium">Sections</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600">
                            {staff.totalStudentsManaged || 0}
                          </div>
                          <div className="text-xs text-gray-500 font-medium">Students</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600">
                            {staff.totalCapacityManaged || 0}
                          </div>
                          <div className="text-xs text-gray-500 font-medium">Capacity</div>
                        </div>
                      </div>

                      {/* Workload Indicator */}
                      {staff.totalCapacityManaged && staff.totalCapacityManaged > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Utilization</span>
                            <span>{Math.round((staff.totalStudentsManaged / staff.totalCapacityManaged) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                (staff.totalStudentsManaged / staff.totalCapacityManaged) > 0.8
                                  ? 'bg-red-500'
                                  : (staff.totalStudentsManaged / staff.totalCapacityManaged) > 0.6
                                    ? 'bg-yellow-500'
                                    : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min((staff.totalStudentsManaged / staff.totalCapacityManaged) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Assigned Sections */}
                    {staff.assignedSections && staff.assignedSections.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-semibold text-gray-700">Assigned Sections</h5>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            {staff.assignedSections.length} section{staff.assignedSections.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {staff.assignedSections.map((section, index) => (
                            <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900 text-sm">{section.sectionName}</div>
                                  <div className="text-gray-600 text-xs">
                                    {section.courseName} ({section.courseCode})
                                  </div>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  section.sectionStatus === 'active'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {section.sectionStatus}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>{section.academicYear} • {section.courseType}</span>
                                <span className="font-medium">
                                  {section.studentCount}/{section.maxStudents} students
                                </span>
                              </div>

                              {section.academicSession && (
                                <div className="text-gray-400 text-xs mt-1">
                                  Session: {section.academicSession}
                                </div>
                              )}

                              {/* Student count progress bar */}
                              <div className="mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${
                                      (section.studentCount / section.maxStudents) > 0.8
                                        ? 'bg-red-400'
                                        : (section.studentCount / section.maxStudents) > 0.6
                                          ? 'bg-yellow-400'
                                          : 'bg-blue-400'
                                    }`}
                                    style={{ width: `${Math.min((section.studentCount / section.maxStudents) * 100, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-400">
                        <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No sections assigned</p>
                        <p className="text-xs">This staff member is available for assignment</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Empty State */}
              {workloadFaculty.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Staff Found</h3>
                  <p className="text-gray-500 mb-4">
                    There are no staff members in your department yet.
                  </p>
                  <p className="text-sm text-gray-400">
                    Staff members will appear here once they are added to your department.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Class In-Charge</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Section
                </label>
                <select
                  value={selectedSection || ''}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a section...</option>
                  {assignments
                    .filter(a => a.assignmentStatus === 'unassigned')
                    .map((assignment) => (
                      <option key={assignment.sectionId} value={assignment.sectionId}>
                        {assignment.sectionName} - {assignment.courseName} ({assignment.courseCode}) - {assignment.academicYear} - {assignment.actualStudentCount}/{assignment.maxStudents} students
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Faculty
                </label>
                <select
                  value={selectedFaculty || ''}
                  onChange={(e) => setSelectedFaculty(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose faculty...</option>
                  {faculty.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} - {staff.currentSectionsCount || 0} sections, {staff.totalStudentsManaged || 0} students
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedSection(null);
                  setSelectedFaculty(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedSection || !selectedFaculty || assignMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {assignMutation.isPending ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassInChargeManagement;
