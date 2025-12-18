import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  CheckCircle,
  Clock,
  User,
  Save,
  X,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ApiService from '../../services/api';

interface ManualGrading {
  questionId: string;
  score: number;
  feedback?: string;
}

type TabMode = 'workflow' | 'lms';

export const ExaminationGradingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [tabMode, setTabMode] = useState<TabMode>('workflow');
  const [selectedAttempt, setSelectedAttempt] = useState<any | null>(null);
  const [manualGrades, setManualGrades] = useState<Record<string, ManualGrading>>({});

  // Fetch workflow pending examinations for grading
  const { data: pendingExaminations = [], isLoading } = useQuery({
    queryKey: ['pending-examination-grading'],
    queryFn: async () => {
      console.log('🔄 Fetching pending examinations for grading...');
      try {
        const data = await ApiService.getPendingExaminationGrading();
        console.log('✅ Fetched pending examinations:', data);
        return data;
      } catch (error: any) {
        console.error('❌ Error fetching pending examinations:', error);
        toast.error('Failed to load pending examinations');
        throw error;
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 2
  });

  // Fetch LMS examination attempts
  const { data: lmsAttempts = [], isLoading: loadingLMS } = useQuery({
    queryKey: ['lms-examination-attempts'],
    queryFn: async () => {
      console.log('🔄 Fetching LMS examination attempts...');
      try {
        const response = await ApiService.get('/lms-content/examinations/attempts');
        console.log('✅ Fetched LMS attempts:', response.data);
        return response.data || [];
      } catch (error: any) {
        console.error('❌ Error fetching LMS examination attempts:', error);
        toast.error('Failed to load LMS examination attempts');
        throw error;
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 2
  });

  // Fetch examination attempt details - ONLY for workflow examinations
  // LMS examination attempts already have answers embedded from the list query  
  const { data: attemptDetails } = useQuery({
    queryKey: ['examination-attempt', selectedAttempt?.id],
    queryFn: async () => {
      if (!selectedAttempt?.id) return null;
      console.log('🔄 Fetching workflow examination attempt details:', selectedAttempt.id);
      try {
        const data = await ApiService.getExaminationAttempt(selectedAttempt.id);
        console.log('✅ Fetched attempt details:', data);
        return data;
      } catch (error: any) {
        console.error('❌ Error fetching examination attempt details:', error);
        toast.error('Failed to load examination details');
        setSelectedAttempt(null);
        throw error;
      }
    },
    // Only fetch for workflow examinations - LMS attempts already have answers
    enabled: !!selectedAttempt?.id && tabMode === 'workflow',
    retry: 2
  });

  // Grade workflow examination mutation
  const gradeExaminationMutation = useMutation({
    mutationFn: async (data: { attemptId: string; manualGrades: ManualGrading[] }) => {
      console.log('✍️ Submitting workflow examination grades:', data);
      return await ApiService.gradeExamination(data.attemptId, { manualGrades: data.manualGrades });
    },
    onSuccess: () => {
      console.log('✅ Workflow examination graded successfully');
      toast.success('Examination graded successfully!');
      queryClient.invalidateQueries({ queryKey: ['pending-examination-grading'] });
      setSelectedAttempt(null);
      setManualGrades({});
    },
    onError: (error: any) => {
      console.error('❌ Error grading workflow examination:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to grade examination');
    }
  });

  // Grade LMS examination mutation
  const gradeLMSExaminationMutation = useMutation({
    mutationFn: async (data: { attemptId: string; subjectiveGrades: Array<{ answerId: string; score: number }> }) => {
      console.log('✍️ Submitting LMS examination grades:', data);
      return await ApiService.post('/lms-content/examinations/grade', data);
    },
    onSuccess: () => {
      console.log('✅ LMS examination graded successfully');
      toast.success('LMS Examination graded successfully!');
      queryClient.invalidateQueries({ queryKey: ['lms-examination-attempts'] });
      setSelectedAttempt(null);
      setManualGrades({});
    },
    onError: (error: any) => {
      console.error('❌ Error grading LMS examination:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to grade LMS examination');
    }
  });

  const handleScoreChange = (questionId: string, score: number, maxScore: number) => {
    if (score < 0 || score > maxScore) {
      toast.error(`Score must be between 0 and ${maxScore}`);
      return;
    }

    setManualGrades(prev => ({
      ...prev,
      [questionId]: {
        questionId,
        score,
        feedback: prev[questionId]?.feedback || ''
      }
    }));
  };

  const handleFeedbackChange = (questionId: string, feedback: string) => {
    setManualGrades(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        questionId,
        score: prev[questionId]?.score || 0,
        feedback
      }
    }));
  };

  const handleSubmitGrading = () => {
    if (!selectedAttempt) return;

    if (tabMode === 'lms') {
      // Handle LMS examination grading
      const subjectiveAnswers = selectedAttempt.answers?.filter((a: any) =>
        (a.question_type === 'short_answer' || a.question_type === 'essay' || a.question_type === 'long_answer') && a.points_awarded === null
      ) || [];

      const subjectiveGrades = subjectiveAnswers.map((answer: any) => ({
        questionId: answer.question_id,  // Send questionId not answerId
        score: manualGrades[answer.question_id]?.score || 0
      }));

      if (subjectiveGrades.length === 0) {
        toast.error('No subjective questions to grade');
        return;
      }

      // Validate all subjective questions are graded
      if (Object.keys(manualGrades).length !== subjectiveAnswers.length) {
        toast.error('Please grade all subjective questions before submitting');
        return;
      }

      gradeLMSExaminationMutation.mutate({
        attemptId: selectedAttempt.id,
        subjectiveGrades
      });
    } else {
      // Handle workflow examination grading
      const manualGradesList = Object.values(manualGrades);

      // Validate all manual questions are graded
      const manualQuestions = attemptDetails?.questions?.filter((q: any) =>
        q.questionType === 'short_answer' || q.questionType === 'long_answer'
      ) || [];

      if (manualGradesList.length !== manualQuestions.length) {
        toast.error('Please grade all subjective questions before submitting');
        return;
      }

      gradeExaminationMutation.mutate({
        attemptId: selectedAttempt.id,
        manualGrades: manualGradesList
      });
    }
  };

  const calculateTotalScore = () => {
    // For LMS examinations, use selectedAttempt data
    if (tabMode === 'lms' && selectedAttempt) {
      // Calculate auto-graded score from answers that have been graded (is_correct is not null)
      const autoGradedAnswers = selectedAttempt.answers?.filter((a: any) =>
        a.is_correct !== null &&
        (a.question_type === 'multiple_choice' || a.question_type === 'true_false' || a.question_type === 'single_choice')
      ) || [];

      const autoScore = autoGradedAnswers.reduce((sum: number, a: any) => sum + (a.points_awarded || 0), 0);
      const autoMax = autoGradedAnswers.reduce((sum: number, a: any) => sum + (a.points || 0), 0);

      // Calculate manual grading score
      const manualScore = Object.values(manualGrades).reduce((sum, g) => sum + g.score, 0);

      // Calculate manual max from subjective questions
      const subjectiveAnswers = selectedAttempt.answers?.filter((a: any) =>
        a.question_type === 'short_answer' || a.question_type === 'essay' || a.question_type === 'long_answer'
      ) || [];
      const manualMax = subjectiveAnswers.reduce((sum: number, a: any) => sum + (a.points || 0), 0);

      // Also add already graded subjective scores
      const gradedSubjectiveScore = subjectiveAnswers
        .filter((a: any) => a.points_awarded !== null)
        .reduce((sum: number, a: any) => sum + (a.points_awarded || 0), 0);

      return {
        total: autoScore + manualScore + gradedSubjectiveScore,
        max: autoMax + manualMax,
        autoScore,
        autoMax,
        manualScore: manualScore + gradedSubjectiveScore,
        manualMax
      };
    }

    // For workflow examinations
    if (!attemptDetails) return { total: 0, max: 0, autoScore: 0, autoMax: 0, manualScore: 0, manualMax: 0 };

    const autoScore = attemptDetails.autoGradedScore || 0;
    const autoMax = attemptDetails.autoGradedMaxScore || 0;
    const manualScore = Object.values(manualGrades).reduce((sum, g) => sum + g.score, 0);
    const manualMax = attemptDetails.questions
      ?.filter((q: any) => q.questionType === 'short_answer' || q.questionType === 'long_answer')
      .reduce((sum: number, q: any) => sum + q.points, 0) || 0;

    return {
      total: autoScore + manualScore,
      max: autoMax + manualMax,
      autoScore,
      autoMax,
      manualScore,
      manualMax
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!selectedAttempt) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Examination Grading</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Grade subjective questions in student examinations
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-t border-gray-200 dark:border-gray-700 pt-6">
            <button
              onClick={() => {
                setTabMode('workflow');
                setSelectedAttempt(null);
              }}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${tabMode === 'workflow'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              Workflow Examinations
            </button>
            <button
              onClick={() => {
                setTabMode('lms');
                setSelectedAttempt(null);
              }}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${tabMode === 'lms'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              LMS Examinations
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Grading</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                  {pendingExaminations.length}
                </p>
              </div>
              <Clock className="w-12 h-12 text-orange-600 dark:text-orange-400 opacity-20" />
            </div>
          </div>
        </div>

        {/* Workflow Examinations List */}
        {tabMode === 'workflow' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Workflow Examinations Pending Grading
              </h2>
            </div>

            {pendingExaminations.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No examinations pending grading. Great job!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {pendingExaminations.map((attempt: any) => (
                  <div
                    key={attempt.id}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer"
                    onClick={() => setSelectedAttempt(attempt)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {attempt.examinationTitle}
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            {attempt.studentName}
                          </div>
                          <div className="flex items-center">
                            <BookOpen className="w-4 h-4 mr-2" />
                            {attempt.subjectName}
                          </div>
                          <div className="flex items-center">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Auto-graded: {attempt.autoGradedScore}/{attempt.autoGradedMaxScore}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            Submitted: {new Date(attempt.submittedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Grade Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LMS Examinations List */}
        {tabMode === 'lms' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                LMS Examination Attempts
              </h2>
            </div>

            {loadingLMS ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : lmsAttempts.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No LMS examination attempts yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Examination</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Completed</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Score</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {lmsAttempts.map((attempt: any) => (
                      <tr key={attempt.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-white">{attempt.examination_title}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">{attempt.student_name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{attempt.student_email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">{attempt.subject_name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{attempt.subject_code}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(attempt.completed_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${attempt.status === 'completed'
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                            : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400'
                            }`}>
                            {attempt.status === 'completed' ? 'Completed' : 'Pending Grading'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {attempt.total_score}/{attempt.max_score}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {attempt.percentage}% • {attempt.is_passed ? 'PASSED' : 'FAILED'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedAttempt(attempt)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            {attempt.status === 'completed' ? 'View' : 'Grade'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Grading View
  const scoreData = calculateTotalScore();
  const { total, max } = scoreData;
  const percentage = max > 0 ? Math.round((total / max) * 100) : 0;
  const passingScore = tabMode === 'lms' ? 50 : (attemptDetails?.passingScore || 50);
  const isPassing = percentage >= passingScore;

  // For LMS examinations, use selectedAttempt data directly
  const examinationTitle = tabMode === 'lms' ? selectedAttempt.examination_title : attemptDetails?.examinationTitle;
  const studentName = tabMode === 'lms' ? selectedAttempt.student_name : attemptDetails?.studentName;
  const subjectName = tabMode === 'lms' ? selectedAttempt.subject_name : attemptDetails?.subjectName;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => setSelectedAttempt(null)}
            className="flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-2"
          >
            <X className="w-4 h-4 mr-1" />
            Back to List
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {examinationTitle}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Student: {studentName} • Subject: {subjectName}
          </p>
        </div>
        <button
          onClick={handleSubmitGrading}
          disabled={
            (tabMode === 'lms' ? gradeLMSExaminationMutation.isPending : gradeExaminationMutation.isPending) ||
            (tabMode === 'lms' && selectedAttempt?.status === 'completed')
          }
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
        >
          <Save className="w-5 h-5 mr-2" />
          {(tabMode === 'lms' ? gradeLMSExaminationMutation.isPending : gradeExaminationMutation.isPending)
            ? 'Submitting...'
            : (tabMode === 'lms' && selectedAttempt?.status === 'completed')
              ? 'Already Graded'
              : 'Submit Grading'}
        </button>
      </div>

      {/* Score Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Score Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Auto-graded</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {scoreData.autoScore}/{scoreData.autoMax}
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Manual Grading</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
              {scoreData.manualScore}/{scoreData.manualMax}
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Score</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              {total}/{max}
            </p>
          </div>
          <div className={`text-center p-4 rounded-lg ${isPassing ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
            <p className="text-sm text-gray-600 dark:text-gray-400">Percentage</p>
            <p className={`text-2xl font-bold mt-1 ${isPassing ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {percentage}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {isPassing ? 'PASS' : 'FAIL'} (Passing: {passingScore}%)
            </p>
          </div>
        </div>
      </div>

      {/* Auto-graded Questions (Read-only) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Auto-graded Questions (Read-only)
        </h2>
        <div className="space-y-4">
          {tabMode === 'lms' ? (
            // LMS examination answers
            selectedAttempt.answers
              ?.filter((a: any) => a.question_type === 'multiple_choice' || a.question_type === 'true_false' || a.question_type === 'single_choice')
              .map((answer: any, index: number) => (
                <div key={answer.question_id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-750">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-gray-900 dark:text-white">
                      Q{index + 1}. {answer.question_text}
                    </p>
                    <span className={`px-2 py-1 rounded text-sm ${answer.is_correct ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
                      {answer.is_correct ? `✓ ${answer.points_awarded || 0}` : `✗ 0`} / {answer.points}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Student Answer: <span className="font-medium">{answer.answer_text}</span>
                  </p>
                </div>
              ))
          ) : (
            // Workflow examination questions
            attemptDetails?.questions
              ?.filter((q: any) => q.questionType === 'single_choice' || q.questionType === 'multiple_choice' || q.questionType === 'true_false')
              .map((question: any, index: number) => (
                <div key={question.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-750">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-gray-900 dark:text-white">
                      Q{index + 1}. {question.questionText}
                    </p>
                    <span className={`px-2 py-1 rounded text-sm ${question.isCorrect ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
                      {question.isCorrect ? `✓ ${question.points}` : `✗ 0`} / {question.points}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Student Answer: <span className="font-medium">{Array.isArray(question.studentAnswer) ? question.studentAnswer.join(', ') : question.studentAnswer}</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Correct Answer: <span className="font-medium text-green-600 dark:text-green-400">{Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer}</span>
                  </p>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Manual Grading Questions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Subjective Questions (Manual Grading Required)
        </h2>
        <div className="space-y-6">
          {tabMode === 'lms' ? (
            // LMS examination answers - show all subjective questions (graded and ungraded)
            selectedAttempt.answers
              ?.filter((a: any) => a.question_type === 'short_answer' || a.question_type === 'essay' || a.question_type === 'long_answer')
              .map((answer: any, index: number) => {
                const isAlreadyGraded = answer.points_awarded !== null;
                return (
                  <div key={answer.question_id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <p className="font-medium text-gray-900 dark:text-white mb-3">
                      Q{index + 1}. {answer.question_text}
                    </p>
                    <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Student's Answer:</p>
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                        {answer.answer_text || '(No answer provided)'}
                      </p>
                    </div>
                    {isAlreadyGraded ? (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded text-green-700 dark:text-green-300">
                        <p className="font-medium">✓ Already graded: {answer.points_awarded}/{answer.points} points</p>
                        {answer.feedback && <p className="text-sm mt-1">Feedback: {answer.feedback}</p>}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Score (Max: {answer.points})
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={answer.points}
                            value={manualGrades[answer.question_id]?.score || 0}
                            onChange={(e) => handleScoreChange(answer.question_id, parseFloat(e.target.value), answer.points)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Feedback (Optional)
                          </label>
                          <input
                            type="text"
                            value={manualGrades[answer.question_id]?.feedback || ''}
                            onChange={(e) => handleFeedbackChange(answer.question_id, e.target.value)}
                            placeholder="Add feedback for student"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
          ) : (
            // Workflow examination questions
            attemptDetails?.questions
              ?.filter((q: any) => q.questionType === 'short_answer' || q.questionType === 'long_answer')
              .map((question: any, index: number) => (
                <div key={question.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <p className="font-medium text-gray-900 dark:text-white mb-3">
                    Q{index + 1}. {question.questionText}
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Student's Answer:</p>
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                      {question.studentAnswer || '(No answer provided)'}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Score <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={question.points}
                        value={manualGrades[question.id]?.score || 0}
                        onChange={(e) => handleScoreChange(question.id, parseInt(e.target.value) || 0, question.points)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Max: {question.points} points
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Feedback (Optional)
                      </label>
                      <textarea
                        value={manualGrades[question.id]?.feedback || ''}
                        onChange={(e) => handleFeedbackChange(question.id, e.target.value)}
                        rows={2}
                        placeholder="Provide feedback to the student..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
};

