import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  FileText,
  Award,
  HelpCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import ApiService from '../../services/api';
import { QuizBuilder } from '../../components/ContentCreation/QuizBuilder';
import { AssignmentBuilder } from '../../components/ContentCreation/AssignmentBuilder';
import { ExaminationBuilder } from '../../components/ContentCreation/ExaminationBuilder';
import type { Question } from '../../components/ContentCreation/QuestionBuilder';

type ContentType = 'quiz' | 'assignment' | 'examination' | null;

export const StaffContentCreationPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedContentType, setSelectedContentType] = useState<ContentType>(null);

  // Fetch assigned subjects for staff
  const { data: assignedSubjects = [], isLoading: loadingSubjects } = useQuery({
    queryKey: ['staff-assigned-subjects', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await ApiService.get(`/hod/subject-assignments/staff/${user.id}/subjects`);
      const data = response.data || response;
      // Map the response to match expected format
      return Array.isArray(data) ? data.map((subject: any) => ({
        id: subject.subject_id,
        code: subject.subject_code,
        name: subject.subject_name,
        semesterNumber: subject.semester_number,
        academicYear: subject.academic_year
      })) : [];
    },
    enabled: !!user?.id
  });

  // Session is no longer required for LMS content creation
  // Staff can create LMS assignments, examinations, and quizzes without a workflow session

  // Fetch existing LMS assignments for selected subject
  const { data: existingAssignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['lms-assignments', selectedSubjectId],
    queryFn: async () => {
      if (!selectedSubjectId) return [];
      try {
        const response = await ApiService.get(`/lms-content/assignments/subject/${selectedSubjectId}`);
        return response.data || [];
      } catch (error) {
        console.error('Error fetching assignments:', error);
        return [];
      }
    },
    enabled: !!selectedSubjectId
  });

  // Fetch existing LMS examinations for selected subject
  const { data: existingExaminations = [], isLoading: loadingExaminations } = useQuery({
    queryKey: ['lms-examinations', selectedSubjectId],
    queryFn: async () => {
      if (!selectedSubjectId) return [];
      try {
        const response = await ApiService.get(`/lms-content/examinations/subject/${selectedSubjectId}`);
        return response.data || [];
      } catch (error) {
        console.error('Error fetching examinations:', error);
        return [];
      }
    },
    enabled: !!selectedSubjectId
  });

  // Fetch existing LMS quizzes for selected subject
  const { data: existingQuizzes = [], isLoading: loadingQuizzes } = useQuery({
    queryKey: ['lms-quizzes', selectedSubjectId],
    queryFn: async () => {
      if (!selectedSubjectId) return [];
      try {
        const response = await ApiService.get(`/lms-content/quizzes/subject/${selectedSubjectId}`);
        return response.data || [];
      } catch (error) {
        console.error('Error fetching quizzes:', error);
        return [];
      }
    },
    enabled: !!selectedSubjectId
  });

  // Create LMS quiz mutation
  const createLMSQuizMutation = useMutation({
    mutationFn: async (data: any) => {
      return await ApiService.post('/lms-content/quizzes', data);
    }
  });

  const handleSaveQuiz = async (quizData: any, questions: Question[]) => {
    if (!selectedSubjectId) {
      toast.error('Please select a subject first');
      return;
    }

    try {
      // Create LMS quiz with questions
      await createLMSQuizMutation.mutateAsync({
        contentMapSubDetailsId: selectedSubjectId,
        title: quizData.title,
        description: quizData.description || null,
        instructions: quizData.instructions || null,
        duration: quizData.timeLimit || null,
        totalPoints: questions.reduce((sum, q) => sum + (q.points || 1), 0),
        passingPercentage: quizData.passingScore || 50,
        maxAttempts: quizData.allowRetry ? 3 : 1,
        showResults: true,
        showCorrectAnswers: true,
        shuffleQuestions: false,
        shuffleOptions: false,
        allowReview: true,
        isRequired: quizData.isRequired || false,
        questions: questions.map((q, index) => ({
          questionText: q.questionText,
          questionType: q.questionType,
          points: q.points || 1,
          orderIndex: index,
          options: q.options || null,
          correctAnswer: q.correctAnswer || null,
          explanation: q.explanation || null,
          isRequired: true
        }))
      });

      toast.success('Quiz created successfully!');
      setSelectedContentType(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create quiz');
    }
  };

  const handleSaveAssignment = async (assignmentData: any) => {
    if (!selectedSubjectId) {
      toast.error('Please select a subject first');
      return;
    }

    try {
      // Create LMS assignment (not workflow content block)
      const response = await ApiService.post('/lms-content/assignments', {
        contentMapSubDetailsId: selectedSubjectId,
        title: assignmentData.title,
        description: assignmentData.description,
        instructions: assignmentData.instructions,
        submissionFormat: assignmentData.submissionFormat,
        maxPoints: assignmentData.maxPoints,
        dueDate: assignmentData.dueDate,
        allowLateSubmission: assignmentData.allowLateSubmission,
        rubric: assignmentData.rubric,
        estimatedTime: parseInt(assignmentData.estimatedTime) || null,
        isRequired: assignmentData.isRequired
      });

      toast.success('Assignment created successfully!');
      setSelectedContentType(null);

      // Invalidate queries to refresh the existing content list
      queryClient.invalidateQueries(['lms-assignments', selectedSubjectId]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create assignment');
    }
  };

  const handleSaveExamination = async (examinationData: any, questions: Question[]) => {
    if (!selectedSubjectId) {
      toast.error('Please select a subject first');
      return;
    }

    try {
      // Create LMS examination (not workflow content block)
      const response = await ApiService.post('/lms-content/examinations', {
        contentMapSubDetailsId: selectedSubjectId,
        title: examinationData.title,
        instructions: examinationData.instructions,
        duration: examinationData.timeLimit,
        totalPoints: questions.reduce((sum, q) => sum + (q.points || 0), 0),
        passingPercentage: examinationData.passingScore,
        maxAttempts: 1,
        showResults: true,
        shuffleQuestions: false,
        shuffleOptions: false,
        allowReview: true,
        isProctored: false,
        isRequired: examinationData.isRequired,
        questions: questions.map((q, index) => ({
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options,
          correctAnswer: q.correctAnswer,
          points: q.points,
          explanation: q.explanation,
          orderIndex: index,
          isRequired: true
        }))
      });

      toast.success('Examination created successfully!');
      setSelectedContentType(null);

      // Invalidate queries to refresh the existing content list
      queryClient.invalidateQueries(['lms-examinations', selectedSubjectId]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create examination');
    }
  };

  // Staff can create content for any assigned subject
  const canCreateContent = !!selectedSubjectId;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Content Creation</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create quizzes, assignments, and examinations for your assigned subjects
          </p>
        </div>
      </div>

      {/* Subject Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-4">
          <BookOpen className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Select Subject</h2>
        </div>

        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Your Assigned Subjects <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            disabled={loadingSubjects}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
          >
            <option value="">Select Subject</option>
            {assignedSubjects.map((subject: any, index: number) => (
              <option key={subject.id || `subject-${index}`} value={subject.id}>
                {subject.code} - {subject.name}
              </option>
            ))}
          </select>

          {assignedSubjects.length === 0 && !loadingSubjects && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              No subjects assigned to you yet. Please contact your HOD.
            </p>
          )}
        </div>


      </div>

      {/* Existing Content Display */}
      {canCreateContent && !selectedContentType && (existingAssignments.length > 0 || existingExaminations.length > 0 || existingQuizzes.length > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Existing Content
          </h2>

          <div className="space-y-6">
            {/* Existing Assignments */}
            {existingAssignments.length > 0 && (
              <div>
                <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                  <FileText className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                  Assignments ({existingAssignments.length})
                </h3>
                <div className="space-y-2">
                  {existingAssignments.map((assignment: any) => (
                    <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{assignment.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Due: {new Date(assignment.dueDate).toLocaleDateString()} • {assignment.totalPoints} points
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${assignment.isActive
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                        {assignment.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing Examinations */}
            {existingExaminations.length > 0 && (
              <div>
                <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                  <Award className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
                  Examinations ({existingExaminations.length})
                </h3>
                <div className="space-y-2">
                  {existingExaminations.map((examination: any) => (
                    <div key={examination.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{examination.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Duration: {examination.duration} min • {examination.totalPoints} points • Pass: {examination.passingPercentage}%
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${examination.isActive
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                        {examination.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing Quizzes */}
            {existingQuizzes.length > 0 && (
              <div>
                <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                  <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                  Quizzes ({existingQuizzes.length})
                </h3>
                <div className="space-y-2">
                  {existingQuizzes.map((quiz: any) => (
                    <div key={quiz.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{quiz.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {quiz.questionCount || 0} questions
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${quiz.isActive
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                        {quiz.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content Type Selection */}
      {canCreateContent && !selectedContentType && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Create New Content
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setSelectedContentType('quiz')}
              className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
            >
              <HelpCircle className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Quiz</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create a quiz with multiple choice, true/false, or text-based questions
              </p>
            </button>

            <button
              onClick={() => setSelectedContentType('assignment')}
              className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group"
            >
              <FileText className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Assignment</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create an assignment for students to submit text or file uploads
              </p>
            </button>

            <button
              onClick={() => setSelectedContentType('examination')}
              className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
            >
              <Award className="w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Examination</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create a final examination with certificate generation on pass
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Content Builders */}
      {selectedContentType === 'quiz' && (
        <QuizBuilder
          onSave={handleSaveQuiz}
          onCancel={() => setSelectedContentType(null)}
          loading={createLMSQuizMutation.isLoading}
        />
      )}

      {selectedContentType === 'assignment' && (
        <AssignmentBuilder
          onSave={handleSaveAssignment}
          onCancel={() => setSelectedContentType(null)}
          loading={false}
        />
      )}

      {selectedContentType === 'examination' && (
        <ExaminationBuilder
          onSave={handleSaveExamination}
          onCancel={() => setSelectedContentType(null)}
          loading={false}
        />
      )}
    </div>
  );
};

