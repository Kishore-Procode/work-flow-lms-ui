import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  FileText,
  CheckCircle,
  Clock,
  User,
  Calendar,
  Download,
  Eye,
  X,
  Save,
  AlertCircle,
  ChevronLeft,
  BookOpen,
  Award,
  TrendingUp,
  ArrowRight,
  GraduationCap
} from 'lucide-react';
import { AssignmentService, SubjectWithAssignments, AssignmentWithSubmissions, AssignmentSubmissionForStaff } from '../../services/assignmentService';

type ViewMode = 'subjects' | 'assignments' | 'submissions';
type TabMode = 'workflow' | 'lms';

const AssignmentManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [tabMode, setTabMode] = useState<TabMode>('workflow');
  const [viewMode, setViewMode] = useState<ViewMode>('subjects');
  const [selectedSubject, setSelectedSubject] = useState<SubjectWithAssignments | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithSubmissions | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmissionForStaff | null>(null);
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');

  // Fetch workflow staff assignments
  const { data: assignmentsData, isLoading, error } = useQuery({
    queryKey: ['staff-assignments'],
    queryFn: async () => {
      const response = await AssignmentService.getStaffAssignmentSubmissions();
      console.log('📊 API Response:', response);

      // Check if response has the data structure directly
      if (response && response.subjects) {
        console.log('✅ Data extracted (direct):', response);
        return response;
      }

      // Check if response has nested data property
      if (response && response.data && response.data.subjects) {
        console.log('✅ Data extracted (nested):', response.data);
        return response.data;
      }

      // Fallback to default structure
      console.warn('⚠️ No data in response, using default structure');
      return {
        subjects: [],
        totalSubmissions: 0,
        totalPendingGrading: 0,
        totalGraded: 0
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  });

  // Fetch LMS staff assignments (subjects with assignments)
  const { data: lmsAssignmentsData, isLoading: isLoadingLMS } = useQuery({
    queryKey: ['lms-staff-assignments'],
    queryFn: async () => {
      const response = await AssignmentService.getLMSStaffAssignments();
      console.log('📊 LMS Staff Assignments API Response:', response);

      // The backend returns { success: true, data: { subjects: [...], ... } }
      // Axios unwraps response.data, so the service returns { success: true, data: { subjects: [...], ... } }
      // We need to check if response has success and data properties
      if (response && response.success && response.data) {
        console.log('✅ LMS Data extracted (from response.data):', response.data);
        return response.data;
      }

      // If response is already the data object (has subjects property directly)
      if (response && response.subjects) {
        console.log('✅ LMS Data extracted (direct):', response);
        return response;
      }

      // Fallback to default structure
      console.warn('⚠️ No data in LMS response, using default structure');
      return {
        subjects: [],
        totalSubmissions: 0,
        totalPendingGrading: 0,
        totalGraded: 0
      };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  });

  // Grade assignment mutation
  const gradeAssignmentMutation = useMutation({
    mutationFn: async (data: { submissionId: string; score: number; maxScore: number; feedback: string }) => {
      // Use different endpoints based on tab mode
      if (tabMode === 'lms') {
        const response = await AssignmentService.gradeLMSAssignment(data);
        return response;
      } else {
        const response = await AssignmentService.gradeAssignment(data);
        return response.data;
      }
    },
    onSuccess: (data) => {
      toast.success('Assignment graded successfully!');
      // Invalidate staff assignments cache (both workflow and LMS)
      queryClient.invalidateQueries({ queryKey: ['staff-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['lms-staff-assignments'] });
      // Invalidate student's assignment submission status cache so they see the grade immediately
      if (selectedSubmission) {
        queryClient.invalidateQueries({
          queryKey: ['assignment-submission-status', selectedSubmission.contentBlockId]
        });
        queryClient.invalidateQueries({
          queryKey: ['lms-student-assignments']
        });
      }
      setSelectedSubmission(null);
      setScore(0);
      setFeedback('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to grade assignment');
    },
  });

  const handleGradeSubmission = () => {
    if (!selectedSubmission) return;

    if (score < 0 || score > (selectedSubmission.maxScore || 100)) {
      toast.error(`Score must be between 0 and ${selectedSubmission.maxScore || 100}`);
      return;
    }

    gradeAssignmentMutation.mutate({
      submissionId: selectedSubmission.id,
      score,
      maxScore: selectedSubmission.maxScore || 100,
      feedback,
    });
  };

  const handleSelectSubmission = (submission: AssignmentSubmissionForStaff) => {
    setSelectedSubmission(submission);
    setScore(submission.score || 0);
    setFeedback(submission.feedback || '');
  };

  const handleSelectSubject = (subject: SubjectWithAssignments) => {
    setSelectedSubject(subject);
    setViewMode('assignments');
  };

  const handleSelectAssignment = async (assignment: any) => {
    // For LMS assignments, we need to fetch submissions separately
    if (tabMode === 'lms') {
      try {
        // Fetch all LMS submissions
        const response = await AssignmentService.getLMSAssignmentSubmissions();
        console.log('🔍 Fetched LMS submissions response:', response);
        console.log('🔍 Response type:', typeof response);
        console.log('🔍 Response.data:', response.data);
        console.log('🔍 Response.success:', response.success);
        console.log('🔍 Assignment ID to match:', assignment.assignmentId);
        console.log('🔍 Assignment object:', assignment);

        // The backend returns { success: true, data: [...] }
        // The service returns { success: true, data: [...] }
        // Extract the submissions array from the response
        const submissions = response.data || [];
        console.log(`📊 Total submissions in response.data: ${submissions.length}`);

        // Log each submission's assignmentId (camelCase from backend)
        if (submissions.length > 0) {
          submissions.forEach((sub: any, index: number) => {
            console.log(`📝 Submission ${index + 1}:`, {
              id: sub.id,
              assignmentId: sub.assignmentId,
              studentName: sub.studentName,
              status: sub.status,
              match: sub.assignmentId === assignment.assignmentId
            });
          });
        } else {
          console.log('⚠️ No submissions in response.data');
        }

        // Filter submissions for this specific assignment
        // Backend returns assignmentId in camelCase
        const assignmentSubmissions = submissions.filter(
          (sub: any) => sub.assignmentId === assignment.assignmentId
        );

        console.log(`📝 Found ${assignmentSubmissions.length} submissions for assignment ${assignment.assignmentId}`);

        // Add submissions to the assignment object
        // Backend already returns camelCase properties, so we can use them directly
        const assignmentWithSubmissions = {
          ...assignment,
          submissions: assignmentSubmissions.map((sub: any) => ({
            id: sub.id,
            studentName: sub.studentName,
            studentEmail: sub.studentEmail,
            submittedAt: sub.submittedAt,
            status: sub.status,
            score: sub.score,
            maxScore: sub.maxScore,
            feedback: sub.feedback,
            submissionText: sub.submissionText,
            submissionFiles: sub.submissionFiles,
            isLate: sub.isLate
          }))
        };

        setSelectedAssignment(assignmentWithSubmissions);
        setSelectedSubmission(null);
        setViewMode('submissions');
      } catch (error) {
        console.error('Failed to fetch LMS submissions:', error);
        toast.error('Failed to load assignment submissions');
      }
    } else {
      // For workflow assignments, submissions are already included
      setSelectedAssignment(assignment);
      setSelectedSubmission(null);
      setViewMode('submissions');
    }
  };

  const handleBackToSubjects = () => {
    setSelectedSubject(null);
    setSelectedAssignment(null);
    setSelectedSubmission(null);
    setViewMode('subjects');
  };

  const handleBackToAssignments = () => {
    setSelectedAssignment(null);
    setSelectedSubmission(null);
    setViewMode('assignments');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-4"></div>
        <p className="text-gray-600 font-medium">Loading assignments...</p>
      </div>
    );
  }

  // Always ensure we have valid data structure for workflow assignments
  const subjects = assignmentsData?.subjects || [];
  const stats = {
    totalSubmissions: assignmentsData?.totalSubmissions || 0,
    totalPendingGrading: assignmentsData?.totalPendingGrading || 0,
    totalGraded: assignmentsData?.totalGraded || 0,
  };

  // Always ensure we have valid data structure for LMS assignments
  const lmsSubjects = lmsAssignmentsData?.subjects || [];
  const lmsStats = {
    totalSubmissions: lmsAssignmentsData?.totalSubmissions || 0,
    totalPendingGrading: lmsAssignmentsData?.totalPendingGrading || 0,
    totalGraded: lmsAssignmentsData?.totalGraded || 0,
  };

  console.log('📋 Rendering with subjects:', subjects.length, 'subjects');
  console.log('📋 Rendering with LMS subjects:', lmsSubjects.length, 'subjects');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center space-x-2 text-sm mb-4">
            <button
              onClick={handleBackToSubjects}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'subjects'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-gray-600 hover:bg-white hover:text-blue-600 hover:shadow-sm'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Subjects
            </button>
            {viewMode !== 'subjects' && (
              <>
                <ChevronLeft className="w-4 h-4 text-gray-400 rotate-180" />
                <button
                  onClick={handleBackToAssignments}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                    viewMode === 'assignments'
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'text-gray-600 hover:bg-white hover:text-blue-600 hover:shadow-sm'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  {selectedSubject?.subjectName}
                </button>
              </>
            )}
            {viewMode === 'submissions' && (
              <>
                <ChevronLeft className="w-4 h-4 text-gray-400 rotate-180" />
                <span className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white font-semibold rounded-lg shadow-sm">
                  <FileText className="w-4 h-4" />
                  {selectedAssignment?.assignmentTitle}
                </span>
              </>
            )}
          </nav>

          {/* Page Title */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-neutral-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-neutral-100 mb-2 flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  Assignment Management
                </h1>
                <p className="text-gray-600 dark:text-neutral-300 text-lg">Review and grade student assignment submissions</p>
              </div>
              <div className="hidden lg:block">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-neutral-400">
                  <TrendingUp className="w-5 h-5" />
                  <span>Track student progress</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-t border-gray-200 pt-6">
              <button
                onClick={() => {
                  setTabMode('workflow');
                  setViewMode('subjects');
                  setSelectedSubject(null);
                  setSelectedAssignment(null);
                }}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  tabMode === 'workflow'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Workflow Assignments
              </button>
              <button
                onClick={() => {
                  setTabMode('lms');
                  setViewMode('subjects');
                  setSelectedSubject(null);
                  setSelectedAssignment(null);
                }}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  tabMode === 'lms'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                LMS Assignments
              </button>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FileText className="w-8 h-8" />
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm font-medium mb-1">Total Submissions</p>
                <p className="text-4xl font-bold">{stats.totalSubmissions}</p>
              </div>
            </div>
            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white/40 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Clock className="w-8 h-8" />
              </div>
              <div className="text-right">
                <p className="text-amber-100 text-sm font-medium mb-1">Pending Grading</p>
                <p className="text-4xl font-bold">{stats.totalPendingGrading}</p>
              </div>
            </div>
            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/40 rounded-full transition-all"
                style={{ width: stats.totalSubmissions > 0 ? `${(stats.totalPendingGrading / stats.totalSubmissions) * 100}%` : '0%' }}
              ></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="text-right">
                <p className="text-emerald-100 text-sm font-medium mb-1">Graded</p>
                <p className="text-4xl font-bold">{stats.totalGraded}</p>
              </div>
            </div>
            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/40 rounded-full transition-all"
                style={{ width: stats.totalSubmissions > 0 ? `${(stats.totalGraded / stats.totalSubmissions) * 100}%` : '0%' }}
              ></div>
            </div>
          </div>
        </div>

      {/* Subjects View - Workflow Assignments */}
      {viewMode === 'subjects' && tabMode === 'workflow' && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">My Subjects - Workflow Assignments</h2>
            <p className="text-gray-600">Select a subject to view workflow assignments and submissions</p>
          </div>

          {subjects.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <GraduationCap className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Subjects Assigned</h3>
                <p className="text-gray-600">You don't have any subjects assigned yet. Contact your administrator for assistance.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject) => (
                <div
                  key={subject.subjectId}
                  onClick={() => handleSelectSubject(subject)}
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100 overflow-hidden transform hover:-translate-y-1"
                >
                  {/* Card Header with Gradient */}
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold">
                          {subject.assignments.length} {subject.assignments.length === 1 ? 'Assignment' : 'Assignments'}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-1">{subject.subjectName}</h3>
                      <p className="text-blue-100 text-sm font-medium">{subject.subjectCode}</p>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{subject.totalSubmissions}</p>
                        <p className="text-xs text-gray-500 mt-1">Total</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                          <Clock className="w-6 h-6 text-amber-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{subject.pendingGrading}</p>
                        <p className="text-xs text-gray-500 mt-1">Pending</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                          <CheckCircle className="w-6 h-6 text-emerald-600" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{subject.graded}</p>
                        <p className="text-xs text-gray-500 mt-1">Graded</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                        <span>Grading Progress</span>
                        <span className="font-semibold">
                          {subject.totalSubmissions > 0
                            ? Math.round((subject.graded / subject.totalSubmissions) * 100)
                            : 0}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full transition-all duration-500"
                          style={{
                            width: subject.totalSubmissions > 0
                              ? `${(subject.graded / subject.totalSubmissions) * 100}%`
                              : '0%'
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-lg">
                      View Assignments
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LMS Assignments View - Subjects */}
      {viewMode === 'subjects' && tabMode === 'lms' && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">LMS Assignments</h2>
            <p className="text-gray-600 dark:text-gray-400">View and grade LMS assignment submissions</p>
          </div>

          {isLoadingLMS ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400">Loading LMS assignments...</p>
            </div>
          ) : lmsSubjects.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center border border-gray-100 dark:border-gray-700">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No LMS Subjects</h3>
                <p className="text-gray-600 dark:text-gray-400">You don't have any subjects assigned yet.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lmsSubjects.map((subject: any, index: number) => (
                <div
                  key={subject.subjectId}
                  onClick={() => {
                    setSelectedSubject({
                      subjectId: subject.subjectId,
                      subjectCode: subject.subjectCode,
                      subjectName: subject.subjectName,
                      semesterNumber: subject.semesterNumber,
                      academicYear: subject.academicYear,
                      totalAssignments: subject.totalAssignments,
                      totalSubmissions: subject.totalSubmissions,
                      pendingGrading: subject.pendingGrading,
                      assignments: subject.assignments
                    });
                    setViewMode('assignments');
                  }}
                  className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 overflow-hidden"
                >
                  <div className="p-6">
                    {/* Subject Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {subject.subjectName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{subject.subjectCode}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Semester {subject.semesterNumber} • {subject.academicYear}
                        </p>
                      </div>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        index % 3 === 0
                          ? 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20'
                          : index % 3 === 1
                          ? 'bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20'
                          : 'bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-900/20 dark:to-teal-900/20'
                      }`}>
                        <BookOpen className={`w-6 h-6 ${
                          index % 3 === 0
                            ? 'text-blue-600 dark:text-blue-400'
                            : index % 3 === 1
                            ? 'text-purple-600 dark:text-purple-400'
                            : 'text-green-600 dark:text-green-400'
                        }`} />
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{subject.totalAssignments}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Assignments</div>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{subject.pendingGrading}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Pending</div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{subject.totalSubmissions}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total</div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-lg">
                      View Assignments
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assignments View */}
      {viewMode === 'assignments' && selectedSubject && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {selectedSubject.subjectName} - Assignments
            </h2>
            <p className="text-gray-600">Select an assignment to view student submissions</p>
          </div>

          {selectedSubject.assignments.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-12 h-12 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Assignments Yet</h3>
                <p className="text-gray-600">There are no assignments in this subject yet.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedSubject.assignments.map((assignment, index) => (
                <div
                  key={assignment.assignmentId}
                  onClick={() => handleSelectAssignment(assignment)}
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-100 overflow-hidden transform hover:-translate-y-1"
                >
                  <div className="p-6">
                    <div className="flex items-start gap-6">
                      {/* Assignment Number Badge */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                          {index + 1}
                        </div>
                      </div>

                      {/* Assignment Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                              {assignment.assignmentTitle}
                            </h3>
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                              <BookOpen className="w-4 h-4" />
                              {assignment.sessionTitle}
                            </p>
                          </div>
                          {assignment.dueDate && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm">
                              <Calendar className="w-4 h-4" />
                              Due: {new Date(assignment.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center gap-6 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{assignment.totalSubmissions}</p>
                              <p className="text-xs text-gray-500">Submissions</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                              <Clock className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{assignment.pendingGrading}</p>
                              <p className="text-xs text-gray-500">Pending</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{assignment.graded}</p>
                              <p className="text-xs text-gray-500">Graded</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm ml-auto">
                            <span className="text-xs text-gray-500">Max Points:</span>
                            <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg font-bold">
                              {assignment.maxPoints}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                            <span>Grading Progress</span>
                            <span className="font-semibold">
                              {assignment.totalSubmissions > 0
                                ? Math.round((assignment.graded / assignment.totalSubmissions) * 100)
                                : 0}%
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full transition-all duration-500"
                              style={{
                                width: assignment.totalSubmissions > 0
                                  ? `${(assignment.graded / assignment.totalSubmissions) * 100}%`
                                  : '0%'
                              }}
                            ></div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <button className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-lg">
                          View Submissions
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submissions View */}
      {viewMode === 'submissions' && selectedAssignment && (
        <div className="space-y-6">
          {/* Assignment Details Card */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg p-8 text-white">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{selectedAssignment.assignmentTitle}</h2>
                <p className="text-blue-100 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  {selectedAssignment.sessionTitle}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl">
                  <p className="text-xs text-blue-100 mb-1">Max Points</p>
                  <p className="text-2xl font-bold">{selectedAssignment.maxPoints}</p>
                </div>
              </div>
            </div>

            {/* Assignment Instructions */}
            {(selectedAssignment.assignmentDescription || selectedAssignment.assignmentInstructions) && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                {selectedAssignment.assignmentDescription && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Description
                    </h3>
                    <div
                      className="text-sm text-blue-50 prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedAssignment.assignmentDescription }}
                    />
                  </div>
                )}

                {selectedAssignment.assignmentInstructions && (
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Instructions
                    </h3>
                    <div
                      className="text-sm text-blue-50 prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedAssignment.assignmentInstructions }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submissions List-and-Details View */}
          <div>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Student Submissions</h3>
              <p className="text-gray-600">Select a submission from the list to view details and grade</p>
            </div>

            {selectedAssignment.submissions.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileText className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Submissions Yet</h3>
                  <p className="text-gray-600">Students haven't submitted their assignments yet.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel - Submissions List */}
                <div className="lg:col-span-1 space-y-3">
                  {selectedAssignment.submissions.map((submission) => (
                    <div
                      key={submission.id}
                      onClick={() => handleSelectSubmission(submission)}
                      className={`cursor-pointer bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-4 border-2 ${
                        selectedSubmission?.id === submission.id
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-100 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        {/* Student Avatar */}
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                          {submission.studentName.charAt(0).toUpperCase()}
                        </div>

                        {/* Student Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate text-sm">{submission.studentName}</h4>
                          <p className="text-xs text-gray-500 truncate">{submission.studentEmail}</p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                          submission.status === 'graded'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {submission.status === 'graded' ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Graded
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              Pending
                            </>
                          )}
                        </span>

                        {/* Score (if graded) */}
                        {submission.status === 'graded' && (
                          <span className="text-sm font-bold text-emerald-700">
                            {submission.score}/{submission.maxScore}
                          </span>
                        )}
                      </div>

                      {/* Submission Date */}
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(submission.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Panel - Submission Details */}
                <div className="lg:col-span-2">
                  {!selectedSubmission ? (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100 h-full flex items-center justify-center">
                      <div className="max-w-md mx-auto">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Eye className="w-10 h-10 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Submission</h3>
                        <p className="text-gray-600 text-sm">Choose a submission from the list to view details and grade</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden h-full">
                      {/* Header */}
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg flex-shrink-0">
                            {selectedSubmission.studentName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold mb-1">{selectedSubmission.studentName}</h3>
                            <p className="text-blue-100 text-sm mb-3">{selectedSubmission.studentEmail}</p>
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                                selectedSubmission.status === 'graded'
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-amber-500 text-white'
                              }`}>
                                {selectedSubmission.status === 'graded' ? (
                                  <>
                                    <CheckCircle className="w-4 h-4" />
                                    Graded
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-4 h-4" />
                                    Pending Grading
                                  </>
                                )}
                              </span>
                              <span className="text-sm text-blue-100 flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {new Date(selectedSubmission.submittedAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6 space-y-6 max-h-[calc(100vh-400px)] overflow-y-auto">
                        {/* Assignment Instructions Reference */}
                        {(selectedAssignment.assignmentDescription || selectedAssignment.assignmentInstructions) && (
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Assignment Instructions
                            </h4>
                            {selectedAssignment.assignmentDescription && (
                              <div
                                className="text-sm text-blue-800 prose prose-sm max-w-none mb-2"
                                dangerouslySetInnerHTML={{ __html: selectedAssignment.assignmentDescription }}
                              />
                            )}
                            {selectedAssignment.assignmentInstructions && (
                              <div
                                className="text-sm text-blue-800 prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: selectedAssignment.assignmentInstructions }}
                              />
                            )}
                          </div>
                        )}

                        {/* Student Submission */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Student Submission
                          </h4>

                          {selectedSubmission.submissionText && (
                            <div className="mb-4">
                              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedSubmission.submissionText}</p>
                              </div>
                            </div>
                          )}

                          {selectedSubmission.submissionFiles && selectedSubmission.submissionFiles.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Attached Files:</p>
                              <div className="space-y-2">
                                {selectedSubmission.submissionFiles.map((file, fileIndex) => (
                                  <a
                                    key={fileIndex}
                                    href={file.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors border border-blue-200"
                                  >
                                    <Download className="w-5 h-5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate">{file.fileName}</p>
                                      <p className="text-xs text-blue-600">{(file.fileSize / 1024).toFixed(1)} KB</p>
                                    </div>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Grading Section */}
                        <div className="border-t border-gray-200 pt-6">
                          <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <Award className="w-4 h-4" />
                            Grading
                          </h4>

                          {selectedSubmission.status === 'graded' ? (
                            <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6">
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-semibold text-emerald-900">Final Score</span>
                                <span className="text-3xl font-bold text-emerald-700">
                                  {selectedSubmission.score}/{selectedSubmission.maxScore}
                                  <span className="text-lg ml-2">({selectedSubmission.percentage}%)</span>
                                </span>
                              </div>
                              {selectedSubmission.feedback && (
                                <div className="pt-4 border-t border-emerald-200">
                                  <p className="text-sm font-semibold text-emerald-900 mb-2">Feedback:</p>
                                  <p className="text-sm text-emerald-800 whitespace-pre-wrap">{selectedSubmission.feedback}</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Score (out of {selectedSubmission.maxScore || 100})
                                  <span className="text-xs text-gray-500 ml-2">(Passing: 50%)</span>
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max={selectedSubmission.maxScore || 100}
                                  value={score}
                                  onChange={(e) => setScore(Number(e.target.value))}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                                  placeholder="Enter score"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Feedback
                                </label>
                                <textarea
                                  value={feedback}
                                  onChange={(e) => setFeedback(e.target.value)}
                                  rows={5}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                  placeholder="Provide detailed feedback to the student..."
                                />
                              </div>

                              <button
                                onClick={handleGradeSubmission}
                                disabled={gradeAssignmentMutation.isPending}
                                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {gradeAssignmentMutation.isPending ? (
                                  <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Saving Grade...
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-5 h-5" />
                                    Save Grade
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AssignmentManagementPage;

