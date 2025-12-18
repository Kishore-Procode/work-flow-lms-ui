/**
 * Examination Viewer Component
 * 
 * Displays examination questions with stricter rules than quizzes
 * - Single attempt only
 * - Time limit enforcement
 * - No navigation back to previous questions
 * - Full-screen mode recommended
 * 
 * @author Student-ACT LMS Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Award,
  AlertCircle,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { useQuizQuestions, useSubmitQuizAttempt } from '../../hooks/usePlaySession';
import type { SessionContentBlock } from '../../types/playSession';

interface ExaminationViewerProps {
  block: SessionContentBlock;
  enrollmentId?: string;
  onExamComplete?: () => void;
}

interface ExamAnswers {
  [questionId: string]: any;
}

const ExaminationViewer: React.FC<ExaminationViewerProps> = ({ block, enrollmentId, onExamComplete }) => {
  const [answers, setAnswers] = useState<ExamAnswers>({});
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [examStarted, setExamStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showWarning, setShowWarning] = useState(true);

  // Get time limit from block content data (in minutes)
  const timeLimitMinutes = block.contentData?.timeLimit || 60;
  const timeLimitSeconds = timeLimitMinutes * 60;

  // Fetch exam questions
  const { data: examData, isLoading, error } = useQuizQuestions(block.id);

  // Submit exam mutation
  const submitExamMutation = useSubmitQuizAttempt();

  // Check if examination was already attempted
  const alreadyAttempted = examData && !examData.canAttempt;

  // Timer effect
  useEffect(() => {
    if (!examStarted || !startTime || submitted) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
      const remaining = timeLimitSeconds - elapsed;

      if (remaining <= 0) {
        // Time's up - auto submit
        handleSubmit(true);
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [examStarted, startTime, submitted, timeLimitSeconds]);

  const startExam = () => {
    setExamStarted(true);
    setStartTime(new Date());
    setTimeRemaining(timeLimitSeconds);
    setShowWarning(false);
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    if (submitted) return;
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!examData || !startTime) return;

    // Validate all questions are answered (unless auto-submit)
    if (!autoSubmit) {
      const unansweredQuestions = examData.questions.filter(q => {
        const answer = answers[q.id];
        // Check if answer is missing or empty
        if (answer === undefined || answer === null || answer === '') return true;
        // For multiple_select, check if array is empty
        if (Array.isArray(answer) && answer.length === 0) return true;
        return false;
      });
      if (unansweredQuestions.length > 0) {
        const confirmSubmit = window.confirm(
          `You have ${unansweredQuestions.length} unanswered question(s). Submit anyway?`
        );
        if (!confirmSubmit) return;
      }
    }

    const timeSpentSeconds = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);

    try {
      const response = await submitExamMutation.mutateAsync({
        contentBlockId: block.id,
        answers,
        timeSpentSeconds,
        enrollmentId,
      });

      setResult(response);
      setSubmitted(true);

      // Call onExamComplete if exam is passed
      if (response.attempt.isPassed && onExamComplete) {
        onExamComplete();
      }
    } catch (error) {
      console.error('Failed to submit examination:', error);
      alert('Failed to submit examination. Please try again.');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderQuestion = (question: any, index: number) => {
    const questionNumber = index + 1;
    const userAnswer = answers[question.id];
    const isAnswered = userAnswer !== undefined && userAnswer !== null && userAnswer !== '';

    return (
      <div key={question.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-start gap-3 mb-4">
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
            isAnswered ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
          }`}>
            {questionNumber}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-gray-900">{question.questionText}</h3>
              <span className="text-sm text-gray-500">{question.points} {question.points === 1 ? 'point' : 'points'}</span>
            </div>
          </div>
        </div>

        <div className="ml-11">
          {renderQuestionInput(question, userAnswer)}
        </div>
      </div>
    );
  };

  const renderQuestionInput = (question: any, userAnswer: any) => {
    switch (question.questionType) {
      case 'single_choice':
      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option: string, idx: number) => (
              <label
                key={idx}
                className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  userAnswer === option
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${submitted ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={userAnswer === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  disabled={submitted}
                  className="mr-3"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'multiple_select':
        return (
          <div className="space-y-2">
            {question.options?.map((option: string, idx: number) => {
              const selectedOptions = Array.isArray(userAnswer) ? userAnswer : [];
              const isSelected = selectedOptions.includes(option);

              return (
                <label
                  key={idx}
                  className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${submitted ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const newSelection = e.target.checked
                        ? [...selectedOptions, option]
                        : selectedOptions.filter((o: string) => o !== option);
                      handleAnswerChange(question.id, newSelection);
                    }}
                    disabled={submitted}
                    className="mr-3"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              );
            })}
          </div>
        );

      case 'true_false':
        return (
          <div className="space-y-2">
            {['True', 'False'].map((option) => (
              <label
                key={option}
                className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  userAnswer === (option === 'True')
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${submitted ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                <input
                  type="radio"
                  name={question.id}
                  checked={userAnswer === (option === 'True')}
                  onChange={() => handleAnswerChange(question.id, option === 'True')}
                  disabled={submitted}
                  className="mr-3"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'fill_in_blank':
        return (
          <input
            type="text"
            value={userAnswer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            disabled={submitted}
            placeholder="Type your answer here..."
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        );

      default:
        return <p className="text-gray-500">Unsupported question type: {question.questionType}</p>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading examination...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 text-red-700">
          <AlertCircle className="h-6 w-6" />
          <div>
            <h3 className="font-semibold">Failed to load examination</h3>
            <p className="text-sm">{(error as any)?.message || 'An error occurred'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!examData || !examData.questions || examData.questions.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center gap-3 text-yellow-700">
          <AlertCircle className="h-6 w-6" />
          <p>No questions available for this examination.</p>
        </div>
      </div>
    );
  }

  // Show message if examination was already attempted
  if (alreadyAttempted) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border-2 border-red-400 rounded-lg p-8">
            <div className="flex items-center gap-4 mb-6">
              <Lock className="h-12 w-12 text-red-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Examination Already Completed</h2>
                <p className="text-gray-600">You have already attempted this examination</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Single Attempt Policy</h3>
                  <p className="text-gray-600 text-sm">
                    This examination can only be attempted once. You have already submitted your answers.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-red-200">
                <p className="text-sm text-gray-700">
                  <strong>Previous Attempts:</strong> {examData.previousAttempts}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  If you believe this is an error, please contact your instructor.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Warning screen before starting exam
  if (showWarning && !examStarted) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-8">
            <div className="flex items-center gap-4 mb-6">
              <AlertTriangle className="h-12 w-12 text-yellow-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Examination Instructions</h2>
                <p className="text-gray-600">Please read carefully before starting</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Single Attempt Only</h3>
                  <p className="text-gray-600 text-sm">You can only take this examination once. Make sure you're ready.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Time Limit: {timeLimitMinutes} Minutes</h3>
                  <p className="text-gray-600 text-sm">The exam will auto-submit when time expires.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Award className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">{examData.totalQuestions} Questions, {examData.totalPoints} Points</h3>
                  <p className="text-gray-600 text-sm">Passing score: 70%</p>
                </div>
              </div>
            </div>

            <button
              onClick={startExam}
              className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
            >
              Start Examination
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Exam Header with Timer */}
      {examStarted && !submitted && (
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg p-6 sticky top-0 z-10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">{block.title}</h2>
              <div className="flex items-center gap-6 text-red-100">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{examData.totalQuestions} Questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  <span>{examData.totalPoints} Points</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-red-100 mb-1">Time Remaining</div>
              <div className={`text-4xl font-bold ${
                timeRemaining && timeRemaining < 300 ? 'animate-pulse' : ''
              }`}>
                {timeRemaining !== null ? formatTime(timeRemaining) : '--:--'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Display */}
      {submitted && result && (
        <div className={`rounded-lg p-6 ${
          result.attempt.isPassed
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start gap-4">
            {result.attempt.isPassed ? (
              <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
            ) : (
              <XCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h3 className={`text-xl font-bold mb-2 ${
                result.attempt.isPassed ? 'text-green-900' : 'text-red-900'
              }`}>
                {result.feedback.message}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-600">Score</p>
                  <p className="text-2xl font-bold">{result.attempt.percentage}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Correct Answers</p>
                  <p className="text-2xl font-bold">{result.feedback.correctAnswers}/{result.feedback.totalQuestions}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Points Earned</p>
                  <p className="text-2xl font-bold">{result.attempt.score}/{result.attempt.maxScore}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Time Taken</p>
                  <p className="text-2xl font-bold">{formatTime(result.attempt.timeSpentSeconds)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Questions */}
      {examStarted && !submitted && (
        <>
          <div className="space-y-4">
            {examData.questions.map((question, index) => renderQuestion(question, index))}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4 sticky bottom-0 bg-gray-50 py-4">
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitExamMutation.isPending}
              className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-lg"
            >
              {submitExamMutation.isPending ? 'Submitting...' : 'Submit Examination'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ExaminationViewer;

