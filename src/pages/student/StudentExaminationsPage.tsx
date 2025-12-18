import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  Lock,
  CheckCircle,
  Clock,
  Download,
  TrendingUp,
  BookOpen,
  AlertCircle,
  Eye,
  FileText
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import ApiService from '../../services/api';
import { toast } from 'react-hot-toast';

type ExaminationStatus = 'locked' | 'available' | 'completed';

interface StudentExamination {
  id: string;
  contentBlockId: string;
  title: string;
  subjectName: string;
  subjectCode: string;
  instructions: string;
  passingScore: number;
  timeLimit: number;
  status: ExaminationStatus;
  courseCompletionPercentage: number;
  attemptId?: string;
  completedAt?: string;
  totalScore?: number;
  maxScore?: number;
  percentage?: number;
  isPassed?: boolean;
  certificateUrl?: string;
  certificateNumber?: string;
}

interface ExaminationQuestion {
  id: string;
  questionText: string;
  questionType: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  options?: string[];
  points: number;
}

export const StudentExaminationsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedExamination, setSelectedExamination] = useState<StudentExamination | null>(null);
  const [isTakingExam, setIsTakingExam] = useState(false);
  const [viewingDetailedResults, setViewingDetailedResults] = useState(false);
  const [detailedResults, setDetailedResults] = useState<any>(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [examQuestions, setExamQuestions] = useState<ExaminationQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoadingExam, setIsLoadingExam] = useState(false);

  // Debug: Log when isTakingExam state changes
  React.useEffect(() => {
    console.log('🔍 isTakingExam state changed:', isTakingExam);
    console.log('🔍 examQuestions length:', examQuestions.length);
    console.log('🔍 selectedExamination:', selectedExamination?.id);
  }, [isTakingExam, examQuestions, selectedExamination]);

  // Fetch student examinations from LMS
  const { data: examinationsData = [], isLoading } = useQuery({
    queryKey: ['lms-student-examinations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Fetch LMS examinations for enrolled subjects
      const response = await ApiService.get('/lms-content/student/examinations');
      return response.data || response;
    },
    enabled: !!user?.id
  });

  // Fetch course completion for all subjects
  const { data: completionData = {} } = useQuery({
    queryKey: ['course-completion', user?.id, examinationsData],
    queryFn: async () => {
      console.log('🚀 Course completion queryFn called!');
      console.log('   User ID:', user?.id);
      console.log('   Examinations Data:', examinationsData);

      if (!user?.id || examinationsData.length === 0) {
        console.log('⚠️ Returning empty object - no user or no examinations');
        return {};
      }

      const completions: Record<string, any> = {};

      // Fetch completion for each subject
      for (const subjectData of examinationsData) {
        try {
          const response = await ApiService.get(`/lms-content/course-completion/${subjectData.subjectId}`);
          console.log(`🔍 Raw API response for subject ${subjectData.subjectId}:`, response);

          // Handle different response structures
          let completionData;
          if (response.data?.data) {
            // Structure: { success: true, data: { completionPercentage, ... } }
            completionData = response.data.data;
          } else if (response.data?.completionPercentage !== undefined) {
            // Structure: { completionPercentage, totalContentBlocks, ... }
            completionData = response.data;
          } else if (response.completionPercentage !== undefined) {
            // Structure: direct data (axios already unwrapped)
            completionData = response;
          }

          if (completionData) {
            console.log(`✅ Storing completion data for subject ${subjectData.subjectId}:`, completionData);
            completions[subjectData.subjectId] = completionData;
          } else {
            console.warn(`⚠️ Could not extract completion data for subject ${subjectData.subjectId}. Full response:`, response);
          }
        } catch (error) {
          console.error(`Error fetching completion for subject ${subjectData.subjectId}:`, error);
        }
      }

      console.log('✅ Returning completions:', completions);
      return completions;
    },
    enabled: !!user?.id && examinationsData.length > 0,
    staleTime: 0, // Always refetch
    gcTime: 0, // Don't cache
  });

  // Fetch examination attempts for all examinations
  const { data: attemptsData = {} } = useQuery({
    queryKey: ['lms-examination-attempts', user?.id, examinationsData],
    queryFn: async () => {
      console.log('🔍 Fetching examination attempts...');
      if (!user?.id || examinationsData.length === 0) return {};

      const attempts: Record<string, any> = {};

      // Fetch attempt status for each examination
      for (const subjectData of examinationsData) {
        for (const examination of subjectData.examinations) {
          try {
            const response = await ApiService.get(`/lms-content/examinations/${examination.id}/attempt-status`);
            console.log(`📝 Examination ${examination.id} attempt response:`, response);

            const data = response.data || response;
            console.log(`📝 Examination ${examination.id} extracted data:`, data);

            if (data.hasAttempt || data.attempt) {
              const attempt = data.attempt || data;
              console.log(`✅ Examination ${examination.id} has attempt:`, attempt);
              attempts[examination.id] = attempt;
            } else {
              console.log(`⚠️ Examination ${examination.id} has no attempt`);
            }
          } catch (error) {
            console.error(`Error fetching attempt for examination ${examination.id}:`, error);
          }
        }
      }

      console.log('📊 Final attempts object:', attempts);
      return attempts;
    },
    enabled: !!user?.id && examinationsData.length > 0,
    staleTime: 0, // Always refetch
    gcTime: 0, // Don't cache
  });

  // Transform the data to match the component's expected format
  const examinations: StudentExamination[] = React.useMemo(() => {
    const allExaminations: StudentExamination[] = [];

    console.log('🔍 Completion Data:', completionData);
    console.log('🔍 Attempts Data:', attemptsData);

    for (const subjectData of examinationsData) {
      const { subjectCode, subjectName, subjectId, examinations: subjectExaminations } = subjectData;
      const completion = completionData[subjectId];
      const completionPercentage = completion?.completionPercentage || 0;
      const isFullyCompleted = completion?.isFullyCompleted || false;

      console.log(`📊 Subject: ${subjectName} (${subjectId})`);
      console.log(`   Completion: ${completionPercentage}%`);
      console.log(`   Fully Completed: ${isFullyCompleted}`);
      console.log(`   Completion Data:`, completion);

      for (const examination of subjectExaminations) {
        const attempt = attemptsData[examination.id];

        // Determine examination status based on attempt and course completion
        let status: 'locked' | 'available' | 'completed' = 'locked';

        if (attempt) {
          // Student has attempted this examination
          status = 'completed'; // Show as completed so they can view results
        } else if (isFullyCompleted) {
          // Course is fully completed and no attempt yet
          status = 'available';
        } else {
          // Course not completed, exam is locked
          status = 'locked';
        }

        console.log(`   📝 Examination: ${examination.title} - Status: ${status}, Has Attempt: ${!!attempt}`);

        allExaminations.push({
          id: examination.id,
          contentBlockId: examination.id, // LMS examination ID
          title: examination.title,
          subjectName,
          subjectCode,
          instructions: examination.instructions || '',
          passingScore: examination.passingPercentage || 50,
          timeLimit: examination.duration || 60,
          status,
          courseCompletionPercentage: completionPercentage,
          attemptId: attempt?.id,
          completedAt: attempt?.completedAt,
          totalScore: attempt?.totalScore,
          maxScore: examination.totalPoints,
          percentage: attempt?.percentage,
          isPassed: attempt?.isPassed,
          certificateUrl: attempt?.certificateUrl,
          certificateNumber: attempt?.certificateNumber
        });
      }
    }

    return allExaminations;
  }, [examinationsData, completionData, attemptsData]);

  // Start examination
  const handleStartExam = async (examination: StudentExamination) => {
    setIsLoadingExam(true);
    try {
      console.log('🚀 Starting examination:', examination);
      console.log('🔍 Fetching examination questions from:', `/lms-content/examinations/${examination.contentBlockId}`);

      // Fetch examination questions
      const response = await ApiService.get(`/lms-content/examinations/${examination.contentBlockId}`);
      console.log('📝 Full Examination API response:', JSON.stringify(response, null, 2));

      // Handle different response structures
      let examData;
      let questions;

      // Try multiple possible response structures
      if (response.data?.data?.questions) {
        // Structure: { success: true, data: { ...exam, questions: [...] } }
        console.log('✅ Found questions in response.data.data.questions');
        examData = response.data.data;
        questions = response.data.data.questions;
      } else if (response.data?.questions) {
        // Structure: { ...exam, questions: [...] }
        console.log('✅ Found questions in response.data.questions');
        examData = response.data;
        questions = response.data.questions;
      } else if (response.questions) {
        // Structure: direct data (axios already unwrapped)
        console.log('✅ Found questions in response.questions');
        examData = response;
        questions = response.questions;
      } else if (Array.isArray(response.data)) {
        // Structure: { data: [...questions] }
        console.log('✅ Found questions as array in response.data');
        questions = response.data;
        examData = { questions: response.data };
      } else if (Array.isArray(response)) {
        // Structure: direct array
        console.log('✅ Found questions as direct array');
        questions = response;
        examData = { questions: response };
      } else {
        console.error('❌ Could not find questions in response structure');
        console.error('Response keys:', Object.keys(response));
        if (response.data) {
          console.error('Response.data keys:', Object.keys(response.data));
        }
      }

      console.log('✅ Extracted questions:', questions);
      console.log('📊 Questions count:', questions?.length || 0);

      if (questions && Array.isArray(questions) && questions.length > 0) {
        console.log('✅ Setting examination state...');

        // Set all state in sequence - React 18 will batch these automatically
        setExamQuestions(questions);
        setSelectedExamination(examination);
        setCurrentQuestionIndex(0);
        setAnswers({});
        setTimeRemaining(examination.timeLimit * 60); // Convert minutes to seconds

        // Set isTakingExam last to ensure other state is ready
        setIsTakingExam(true);

        console.log('✅ Examination started successfully');
        console.log('   isTakingExam:', true);
        console.log('   examQuestions length:', questions.length);
        console.log('   selectedExamination:', examination.id);
        toast.success('Examination started! Good luck!');
      } else {
        console.error('❌ No questions found in response or questions is not an array');
        console.error('Questions value:', questions);
        console.error('Questions type:', typeof questions);
        toast.error('No questions found for this examination. Please contact your instructor.');
      }
    } catch (error: any) {
      console.error('❌ Error starting examination:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load examination';
      toast.error(`Failed to start examination: ${errorMessage}`);
    } finally {
      setIsLoadingExam(false);
    }
  };

  // Timer effect
  React.useEffect(() => {
    if (!isTakingExam || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmitExam(); // Auto-submit when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTakingExam, timeRemaining]);

  // Download certificate
  const handleDownloadCertificate = (certificateUrl: string) => {
    window.open(certificateUrl, '_blank');
  };

  // Load detailed examination results
  const handleViewDetailedResults = async (examinationId: string) => {
    try {
      setLoadingResults(true);
      const response = await ApiService.get(`/lms-content/examinations/${examinationId}/results`);
      console.log('Detailed results response:', response);

      // API returns: { success: true, data: { ... } } - axios wraps this in response.data
      // So we need response.data (axios) -> then .data (our API structure)
      const resultsData = response.data?.data || response.data || response;
      console.log('Results data:', resultsData);

      if (resultsData) {
        setDetailedResults(resultsData);
        setViewingDetailedResults(true);
      } else {
        toast.error('No results found for this examination');
      }
    } catch (error: any) {
      console.error('Error loading detailed results:', error);
      toast.error('Failed to load detailed results');
    } finally {
      setLoadingResults(false);
    }
  };

  // Submit examination
  // Examination submission mutation
  const submitExaminationMutation = useMutation({
    mutationFn: async (data: { examinationId: string; answers: any[]; timeSpent: number }) => {
      return await ApiService.post('/lms-content/examinations/submit', data);
    },
    onSuccess: () => {
      toast.success('Examination submitted successfully!');
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['lms-student-examinations', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['course-completion', user?.id] });
      setIsTakingExam(false);
      setSelectedExamination(null);
      setAnswers({});
      setExamQuestions([]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to submit examination');
    }
  });

  const handleSubmitExam = async () => {
    if (!selectedExamination) return;

    const confirmed = window.confirm('Are you sure you want to submit your examination? You cannot change your answers after submission.');
    if (!confirmed && timeRemaining > 0) return;

    const answersArray = examQuestions.map(q => ({
      questionId: q.id,
      answer: answers[q.id] || ''
    }));

    const timeSpent = (selectedExamination.timeLimit * 60) - timeRemaining;

    submitExaminationMutation.mutate({
      examinationId: selectedExamination.contentBlockId,
      answers: answersArray,
      timeSpent
    });
  };

  const getStatusBadge = (status: ExaminationStatus) => {
    switch (status) {
      case 'locked':
        return (
          <span className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 flex items-center">
            <Lock className="w-4 h-4 mr-1" />
            Locked
          </span>
        );
      case 'available':
        return (
          <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            Available
          </span>
        );
      case 'completed':
        return (
          <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 flex items-center">
            <CheckCircle className="w-4 h-4 mr-1" />
            Completed
          </span>
        );
    }
  };

  const getStatusIcon = (status: ExaminationStatus) => {
    switch (status) {
      case 'locked':
        return <Lock className="w-6 h-6 text-red-600 dark:text-red-400" />;
      case 'available':
        return <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />;
    }
  };

  const filterExaminations = (status: ExaminationStatus) => {
    return examinations.filter((e: StudentExamination) => e.status === status);
  };

  const locked = filterExaminations('locked');
  const available = filterExaminations('available');
  const completed = filterExaminations('completed');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (selectedExamination) {
    return (
      <>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <button
              onClick={() => setSelectedExamination(null)}
              className="text-blue-600 dark:text-blue-400 hover:underline mb-2"
            >
              ← Back to Examinations
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{selectedExamination.title}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {selectedExamination.subjectCode} - {selectedExamination.subjectName}
            </p>
          </div>

          {/* Examination Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                <div className="mt-2">{getStatusBadge(selectedExamination.status)}</div>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Passing Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {selectedExamination.passingScore}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Time Limit</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {selectedExamination.timeLimit} min
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Instructions</h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {selectedExamination.instructions}
              </p>
            </div>

            {selectedExamination.status === 'locked' && (
              <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <div className="flex items-start">
                  <Lock className="w-6 h-6 text-red-600 dark:text-red-400 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
                      Examination Locked
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                      You must complete 100% of the course content before you can take this examination.
                    </p>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Course Progress</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {selectedExamination.courseCompletionPercentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all"
                          style={{ width: `${selectedExamination.courseCompletionPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedExamination.status === 'available' && (
              <div className="mt-6">
                <button
                  onClick={() => handleStartExam(selectedExamination)}
                  disabled={isLoadingExam}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingExam ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Loading Examination...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      Start Examination
                    </>
                  )}
                </button>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-3">
                  You have one attempt for this examination. Make sure you're ready before starting.
                </p>
              </div>
            )}

            {selectedExamination.status === 'completed' && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Examination Results</h3>
                <div className={`rounded-lg p-6 ${selectedExamination.isPassed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Your Score</p>
                      <p className={`text-4xl font-bold mt-1 ${selectedExamination.isPassed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {selectedExamination.totalScore}/{selectedExamination.maxScore}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {selectedExamination.percentage}% • {selectedExamination.isPassed ? 'PASSED' : 'FAILED'}
                      </p>
                    </div>
                    <Award className={`w-16 h-16 opacity-20 ${selectedExamination.isPassed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                  </div>

                  {selectedExamination.isPassed && selectedExamination.certificateUrl && (
                    <div className="border-t border-green-200 dark:border-green-800 pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Certificate Available
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Certificate No: {selectedExamination.certificateNumber}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDownloadCertificate(selectedExamination.certificateUrl!)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Certificate
                        </button>
                      </div>
                    </div>
                  )}

                  {!selectedExamination.isPassed && (
                    <div className="border-t border-red-200 dark:border-red-800 pt-4">
                      <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-800 dark:text-red-300">
                            Unfortunately, you did not pass this examination.
                          </p>
                          <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                            Required: {selectedExamination.passingScore}% • Your Score: {selectedExamination.percentage}%
                          </p>
                          <p className="text-sm text-red-700 dark:text-red-400 mt-2">
                            Note: Examinations allow only one attempt. Please contact your instructor for guidance.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* View Detailed Results Button */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <button
                      onClick={() => handleViewDetailedResults(selectedExamination.id)}
                      disabled={loadingResults}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {loadingResults ? 'Loading...' : 'View Detailed Results & Answers'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Examination Taking Modal */}
        {isTakingExam && examQuestions.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header with Timer */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedExamination.title}</h2>
                    <p className="text-blue-100 mt-1">
                      Question {currentQuestionIndex + 1} of {examQuestions.length}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                      <Clock className="w-5 h-5" />
                      <span className="text-xl font-bold">
                        {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
                      </span>
                    </div>
                    <p className="text-xs text-blue-100 mt-1">Time Remaining</p>
                  </div>
                </div>
              </div>

              {/* Question Content */}
              <div className="p-8">
                <div className="mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {examQuestions[currentQuestionIndex].questionText}
                    </h3>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded-full text-sm font-semibold">
                      {examQuestions[currentQuestionIndex].points} pts
                    </span>
                  </div>

                  {/* Answer Input */}
                  <div className="mt-6">
                    {examQuestions[currentQuestionIndex].questionType === 'multiple_choice' && examQuestions[currentQuestionIndex].options && (
                      <div className="space-y-3">
                        {examQuestions[currentQuestionIndex].options!.map((option, idx) => (
                          <label
                            key={idx}
                            className="flex items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={(answers[examQuestions[currentQuestionIndex].id] || '').split(',').filter(Boolean).includes(option)}
                              onChange={(e) => {
                                const currentAnswers = (answers[examQuestions[currentQuestionIndex].id] || '').split(',').filter(Boolean);
                                const newAnswers = e.target.checked
                                  ? [...currentAnswers, option]
                                  : currentAnswers.filter(a => a !== option);
                                setAnswers({ ...answers, [examQuestions[currentQuestionIndex].id]: newAnswers.join(',') });
                              }}
                              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-3 text-gray-900 dark:text-white">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {examQuestions[currentQuestionIndex].questionType === 'single_choice' && examQuestions[currentQuestionIndex].options && (
                      <div className="space-y-3">
                        {examQuestions[currentQuestionIndex].options!.map((option, idx) => (
                          <label
                            key={idx}
                            className="flex items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                          >
                            <input
                              type="radio"
                              name={`question-${examQuestions[currentQuestionIndex].id}`}
                              value={option}
                              checked={answers[examQuestions[currentQuestionIndex].id] === option}
                              onChange={(e) => setAnswers({ ...answers, [examQuestions[currentQuestionIndex].id]: e.target.value })}
                              className="w-5 h-5 text-blue-600"
                            />
                            <span className="ml-3 text-gray-900 dark:text-white">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {examQuestions[currentQuestionIndex].questionType === 'true_false' && (
                      <div className="space-y-3">
                        {['True', 'False'].map((option) => (
                          <label
                            key={option}
                            className="flex items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                          >
                            <input
                              type="radio"
                              name={`question-${examQuestions[currentQuestionIndex].id}`}
                              value={option}
                              checked={answers[examQuestions[currentQuestionIndex].id] === option}
                              onChange={(e) => setAnswers({ ...answers, [examQuestions[currentQuestionIndex].id]: e.target.value })}
                              className="w-5 h-5 text-blue-600"
                            />
                            <span className="ml-3 text-gray-900 dark:text-white">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {(examQuestions[currentQuestionIndex].questionType === 'short_answer' || examQuestions[currentQuestionIndex].questionType === 'long_answer') && (
                      <textarea
                        value={answers[examQuestions[currentQuestionIndex].id] || ''}
                        onChange={(e) => setAnswers({ ...answers, [examQuestions[currentQuestionIndex].id]: e.target.value })}
                        rows={examQuestions[currentQuestionIndex].questionType === 'long_answer' ? 10 : 4}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="Type your answer here..."
                      />
                    )}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  <div className="flex gap-3">
                    {currentQuestionIndex < examQuestions.length - 1 ? (
                      <button
                        onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmitExam}
                        disabled={submitExaminationMutation.isPending}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {submitExaminationMutation.isPending ? 'Submitting...' : 'Submit Examination'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Question Navigator */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Question Navigator</p>
                  <div className="flex flex-wrap gap-2">
                    {examQuestions.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`w-10 h-10 rounded-lg font-semibold transition-colors ${idx === currentQuestionIndex
                          ? 'bg-blue-600 text-white'
                          : answers[examQuestions[idx].id]
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  console.log('🎨 StudentExaminationsPage RENDER:', {
    isTakingExam,
    hasSelectedExamination: !!selectedExamination,
    examQuestionsLength: examQuestions.length
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Examinations</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View your examination status and results
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Locked</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{locked.length}</p>
            </div>
            <Lock className="w-12 h-12 text-red-600 dark:text-red-400 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Available</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{available.length}</p>
            </div>
            <Clock className="w-12 h-12 text-blue-600 dark:text-blue-400 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{completed.length}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 opacity-20" />
          </div>
        </div>
      </div>

      {/* Examinations List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">All Examinations</h2>
        </div>

        {examinations.length === 0 ? (
          <div className="p-12 text-center">
            <Award className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No examinations found</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Examinations will appear here once your instructors create them
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {examinations.map((examination: StudentExamination) => (
              <div
                key={examination.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer"
                onClick={() => setSelectedExamination(examination)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {getStatusIcon(examination.status)}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {examination.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <div className="flex items-center">
                          <BookOpen className="w-4 h-4 mr-1" />
                          {examination.subjectCode}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {examination.timeLimit} minutes
                        </div>
                        <div className="flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          Passing: {examination.passingScore}%
                        </div>
                      </div>
                      {examination.status === 'completed' && (
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${examination.isPassed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            Score: {examination.totalScore}/{examination.maxScore} ({examination.percentage}%)
                          </span>
                          {examination.isPassed && examination.certificateUrl && (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded">
                              Certificate Available
                            </span>
                          )}
                        </div>
                      )}
                      {examination.status === 'locked' && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Course Progress: {examination.courseCompletionPercentage}% (100% required)
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(examination.status)}
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

      {/* Detailed Results Modal */}
      {viewingDetailedResults && detailedResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{detailedResults.examinationTitle}</h2>
                  <p className="text-blue-100 mt-1">
                    Score: {detailedResults.totalScore}/{detailedResults.maxScore} ({Number(detailedResults.percentage || 0).toFixed(1)}%)
                  </p>
                </div>
                <button
                  onClick={() => { setViewingDetailedResults(false); setDetailedResults(null); }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Questions and Answers */}
            <div className="p-6 space-y-6">
              {detailedResults.answers?.map((answer: any, index: number) => {
                const isCorrect = answer.isCorrect === true || (answer.pointsAwarded > 0 && answer.pointsAwarded >= answer.maxPoints);
                const isPartiallyCorrect = answer.pointsAwarded > 0 && answer.pointsAwarded < answer.maxPoints;
                const isSubjective = answer.questionType === 'short_answer' || answer.questionType === 'long_answer' || answer.questionType === 'essay';

                return (
                  <div
                    key={answer.questionId}
                    className={`border-2 rounded-lg p-5 ${isCorrect
                      ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                      : isPartiallyCorrect
                        ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10'
                        : 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
                      }`}
                  >
                    {/* Question Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm font-semibold mr-2">
                            Q{index + 1}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded text-sm font-semibold">
                            {answer.maxPoints} pts
                          </span>
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs ml-2">
                            {answer.questionType}
                          </span>
                        </div>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {answer.questionText}
                        </p>
                      </div>
                      <div className="ml-4">
                        {isCorrect ? (
                          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                        ) : isPartiallyCorrect ? (
                          <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                        ) : (
                          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                    </div>

                    {/* Your Answer */}
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Your Answer:
                      </p>
                      <div className="bg-white dark:bg-gray-750 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                        <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                          {answer.studentAnswer || '(No answer provided)'}
                        </p>
                      </div>
                    </div>

                    {/* Correct Answer (show if incorrect and not subjective) */}
                    {!isCorrect && !isSubjective && answer.correctAnswer && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">
                          Correct Answer:
                        </p>
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-700">
                          <p className="text-green-900 dark:text-green-100 whitespace-pre-wrap">
                            {answer.correctAnswer}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Feedback (for manually graded questions) */}
                    {answer.feedback && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                          Staff Feedback:
                        </p>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                          <p className="text-blue-900 dark:text-blue-100 whitespace-pre-wrap">
                            {answer.feedback}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Score */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Points Awarded:
                      </span>
                      <span className={`text-lg font-bold ${isCorrect ? 'text-green-600 dark:text-green-400'
                        : isPartiallyCorrect ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                        }`}>
                        {answer.pointsAwarded ?? 0} / {answer.maxPoints}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Close Button */}
              <div className="pt-4">
                <button
                  onClick={() => { setViewingDetailedResults(false); setDetailedResults(null); }}
                  className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )
      }
    </div >
  );
};
