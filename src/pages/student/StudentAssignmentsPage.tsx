import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Award,
  Calendar,
  TrendingUp,
  BookOpen,
  AlertCircle,
  Eye
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import ApiService from '../../services/api';
import { toast } from 'react-hot-toast';

type AssignmentStatus = 'not_started' | 'in_progress' | 'submitted' | 'graded';

interface StudentAssignment {
  id: string;
  contentBlockId: string;
  title: string;
  subjectName: string;
  subjectCode: string;
  description: string;
  maxPoints: number;
  dueDate?: string;
  status: AssignmentStatus;
  submittedAt?: string;
  gradedAt?: string;
  score?: number;
  feedback?: string;
  isLate?: boolean;
}

export const StudentAssignmentsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAssignment, setSelectedAssignment] = useState<StudentAssignment | null>(null);
  const [submissionText, setSubmissionText] = useState<string>('');
  const [submissionFiles, setSubmissionFiles] = useState<any[]>([]);

  // Fetch student assignments from LMS
  const { data: assignmentsData = [], isLoading } = useQuery({
    queryKey: ['lms-student-assignments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Fetch LMS assignments for enrolled subjects
      const response = await ApiService.get('/lms-content/student/assignments');
      return response.data || response;
    },
    enabled: !!user?.id
  });

  // Fetch submission status for all assignments
  const { data: submissionsData = {} } = useQuery({
    queryKey: ['lms-assignment-submissions', user?.id, assignmentsData],
    queryFn: async () => {
      console.log('🔍 Fetching assignment submissions...');
      if (!user?.id || assignmentsData.length === 0) return {};

      const submissions: Record<string, any> = {};

      // Fetch submission status for each assignment
      for (const subjectData of assignmentsData) {
        for (const assignment of subjectData.assignments) {
          try {
            const response = await ApiService.get(`/lms-content/assignments/${assignment.id}/status`);
            console.log(`📝 Assignment ${assignment.id} status response:`, response);
            console.log(`📝 Assignment ${assignment.id} response.data:`, response.data);
            console.log(`📝 Assignment ${assignment.id} response.data.data:`, response.data?.data);

            const data = response.data || response;
            console.log(`📝 Assignment ${assignment.id} extracted data:`, data);

            // Check multiple response structures
            let hasSubmitted = false;
            let submission = null;

            if (data.data?.hasSubmitted !== undefined) {
              // Structure: { success: true, data: { hasSubmitted: true, submission: {...} } }
              console.log(`   Using data.data structure`);
              hasSubmitted = data.data.hasSubmitted;
              submission = data.data.submission;
            } else if (data.hasSubmitted !== undefined) {
              // Structure: { hasSubmitted: true, submission: {...} }
              console.log(`   Using data structure`);
              hasSubmitted = data.hasSubmitted;
              submission = data.submission;
            }

            console.log(`   hasSubmitted: ${hasSubmitted}, submission:`, submission);

            if (hasSubmitted && submission) {
              console.log(`✅ Assignment ${assignment.id} has submission:`, submission);
              submissions[assignment.id] = submission;
            } else {
              console.log(`⚠️ Assignment ${assignment.id} has no submission (hasSubmitted: ${hasSubmitted})`);
            }
          } catch (error) {
            console.error(`Error fetching submission for assignment ${assignment.id}:`, error);
          }
        }
      }

      console.log('📊 Final submissions object:', submissions);
      return submissions;
    },
    enabled: !!user?.id && assignmentsData.length > 0,
    staleTime: 0, // Always refetch
    cacheTime: 0, // Don't cache
  });

  // Transform the data to match the component's expected format
  const assignments: StudentAssignment[] = React.useMemo(() => {
    const allAssignments: StudentAssignment[] = [];

    for (const subjectData of assignmentsData) {
      const { subjectCode, subjectName, assignments: subjectAssignments } = subjectData;

      for (const assignment of subjectAssignments) {
        const submission = submissionsData[assignment.id];

        let status: AssignmentStatus = 'not_started';
        if (submission) {
          if (submission.gradedAt) {
            status = 'graded';
          } else if (submission.submittedAt) {
            status = 'submitted';
          }
        }

        allAssignments.push({
          id: assignment.id,
          contentBlockId: assignment.id, // LMS assignment ID
          title: assignment.title,
          subjectName,
          subjectCode,
          description: assignment.description || '',
          maxPoints: assignment.maxPoints || 100,
          dueDate: assignment.dueDate,
          status,
          submittedAt: submission?.submittedAt,
          gradedAt: submission?.gradedAt,
          score: submission?.score,
          feedback: submission?.feedback,
          isLate: submission?.isLate || false
        });
      }
    }

    return allAssignments;
  }, [assignmentsData, submissionsData]);

  // Assignment submission mutation
  const submitAssignmentMutation = useMutation({
    mutationFn: async (data: { assignmentId: string; submissionText: string; submissionFiles: any[] }) => {
      return await ApiService.post('/lms-content/assignments/submit', data);
    },
    onSuccess: () => {
      toast.success('Assignment submitted successfully!');
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['lms-student-assignments', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['lms-assignment-submissions', user?.id] });
      setSelectedAssignment(null);
      setSubmissionText('');
      setSubmissionFiles([]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to submit assignment');
    }
  });

  // Handle assignment submission
  const handleSubmitAssignment = async () => {
    if (!selectedAssignment) return;

    if (!submissionText && submissionFiles.length === 0) {
      toast.error('Please provide either text submission or upload files');
      return;
    }

    submitAssignmentMutation.mutate({
      assignmentId: selectedAssignment.contentBlockId, // This is the LMS assignment ID
      submissionText,
      submissionFiles
    });
  };

  const getStatusBadge = (status: AssignmentStatus) => {
    switch (status) {
      case 'not_started':
        return (
          <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            Not Started
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 flex items-center">
            <FileText className="w-4 h-4 mr-1" />
            In Progress
          </span>
        );
      case 'submitted':
        return (
          <span className="px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            Submitted
          </span>
        );
      case 'graded':
        return (
          <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 flex items-center">
            <CheckCircle className="w-4 h-4 mr-1" />
            Graded
          </span>
        );
    }
  };

  const getStatusIcon = (status: AssignmentStatus) => {
    switch (status) {
      case 'not_started':
        return <Clock className="w-6 h-6 text-gray-600 dark:text-gray-400" />;
      case 'in_progress':
        return <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
      case 'submitted':
        return <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />;
      case 'graded':
        return <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />;
    }
  };

  const filterAssignments = (status: AssignmentStatus) => {
    return assignments.filter((a: StudentAssignment) => a.status === status);
  };

  const notStarted = filterAssignments('not_started');
  const inProgress = filterAssignments('in_progress');
  const submitted = filterAssignments('submitted');
  const graded = filterAssignments('graded');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (selectedAssignment) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => setSelectedAssignment(null)}
            className="text-blue-600 dark:text-blue-400 hover:underline mb-2"
          >
            ← Back to Assignments
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{selectedAssignment.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {selectedAssignment.subjectCode} - {selectedAssignment.subjectName}
          </p>
        </div>

        {/* Assignment Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <div className="mt-2">{getStatusBadge(selectedAssignment.status)}</div>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Max Points</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {selectedAssignment.maxPoints}
              </p>
            </div>
            {selectedAssignment.dueDate && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Due Date</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  {new Date(selectedAssignment.dueDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Description</h3>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {selectedAssignment.description}
            </p>
          </div>

          {selectedAssignment.status === 'graded' && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Grading Results</h3>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Your Score</p>
                    <p className="text-4xl font-bold text-green-600 dark:text-green-400 mt-1">
                      {selectedAssignment.score}/{selectedAssignment.maxPoints}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {Math.round(((selectedAssignment.score || 0) / selectedAssignment.maxPoints) * 100)}%
                    </p>
                  </div>
                  <Award className="w-16 h-16 text-green-600 dark:text-green-400 opacity-20" />
                </div>
                {selectedAssignment.feedback && (
                  <div className="border-t border-green-200 dark:border-green-800 pt-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Instructor Feedback:</p>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedAssignment.feedback}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedAssignment.isLate && (
            <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Late Submission</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  This assignment was submitted after the due date.
                </p>
              </div>
            </div>
          )}

          {/* Submission Form - Only show if not submitted */}
          {selectedAssignment.status === 'not_started' && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Submit Your Assignment</h3>

              {/* Text Submission */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Answer
                </label>
                <textarea
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Type your answer here..."
                />
              </div>

              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload Files (Optional)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    // TODO: Implement file upload to cloud storage
                    console.log('Files selected:', e.target.files);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  You can upload multiple files (PDF, DOC, DOCX, images, etc.)
                </p>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitAssignment}
                disabled={submitAssignmentMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitAssignmentMutation.isPending ? 'Submitting...' : 'Submit Assignment'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Assignments</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track your assignment submissions and grades
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Not Started</p>
              <p className="text-3xl font-bold text-gray-600 dark:text-gray-400 mt-2">{notStarted.length}</p>
            </div>
            <Clock className="w-12 h-12 text-gray-600 dark:text-gray-400 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{inProgress.length}</p>
            </div>
            <FileText className="w-12 h-12 text-blue-600 dark:text-blue-400 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Submitted</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">{submitted.length}</p>
            </div>
            <Clock className="w-12 h-12 text-orange-600 dark:text-orange-400 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Graded</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{graded.length}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 opacity-20" />
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">All Assignments</h2>
        </div>

        {assignments.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No assignments found</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Assignments will appear here once your instructors create them
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {assignments.map((assignment: StudentAssignment) => (
              <div
                key={assignment.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer"
                onClick={() => setSelectedAssignment(assignment)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {getStatusIcon(assignment.status)}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {assignment.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <div className="flex items-center">
                          <BookOpen className="w-4 h-4 mr-1" />
                          {assignment.subjectCode}
                        </div>
                        <div className="flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          {assignment.maxPoints} points
                        </div>
                        {assignment.dueDate && (
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            Due: {new Date(assignment.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      {assignment.status === 'graded' && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            Score: {assignment.score}/{assignment.maxPoints}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            ({Math.round(((assignment.score || 0) / assignment.maxPoints) * 100)}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(assignment.status)}
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

