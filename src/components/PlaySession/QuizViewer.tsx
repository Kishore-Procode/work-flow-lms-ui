/**
 * Quiz Viewer Component
 * 
 * Displays quiz questions and handles quiz submission
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
  RefreshCw,
  Bookmark
} from 'lucide-react';
import { useQuizQuestions, useSubmitQuizAttempt } from '../../hooks/usePlaySession';
import type { SessionContentBlock } from '../../types/playSession';

interface QuizViewerProps {
  block: SessionContentBlock;
  enrollmentId?: string;
  onQuizComplete?: () => void;
}

interface QuizAnswers {
  [questionId: string]: any;
}

const QuizViewer: React.FC<QuizViewerProps> = ({ block, enrollmentId, onQuizComplete }) => {
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [startTime] = useState(new Date());
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showLowTimeWarning, setShowLowTimeWarning] = useState(false);
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Fetch quiz questions
  const { data: quizData, isLoading, error } = useQuizQuestions(block.id);

  // Submit quiz mutation
  const submitQuizMutation = useSubmitQuizAttempt();

  // Get time limit from contentData
  const timeLimit = block.contentData?.timeLimit; // in minutes
  const timeLimitSeconds = timeLimit ? timeLimit * 60 : null;

  // Reset state when block changes
  useEffect(() => {
    setAnswers({});
    setSubmitted(false);
    setResult(null);
    setTimeRemaining(timeLimitSeconds);
    setShowLowTimeWarning(false);
    setMarkedForReview(new Set());
    setCurrentQuestionIndex(0);
  }, [block.id, timeLimitSeconds]);

  // Timer effect
  useEffect(() => {
    if (!timeLimitSeconds || submitted) return;

    setTimeRemaining(timeLimitSeconds);

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(interval);
          // Auto-submit when time runs out
          handleSubmit(true);
          return 0;
        }

        // Show warning when less than 5 minutes remaining
        if (prev <= 300 && !showLowTimeWarning) {
          setShowLowTimeWarning(true);
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLimitSeconds, submitted]);

  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const toggleMarkForReview = (questionId: string) => {
    setMarkedForReview((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!quizData) return;

    // Validate all questions are answered (skip validation for auto-submit)
    if (!autoSubmit) {
      const unansweredQuestions = quizData.questions.filter(q => {
        const answer = answers[q.id];
        // Check if answer is missing or empty
        if (answer === undefined || answer === null || answer === '') return true;
        // For multiple_select, check if array is empty
        if (Array.isArray(answer) && answer.length === 0) return true;
        return false;
      });
      if (unansweredQuestions.length > 0) {
        alert(`Please answer all questions. ${unansweredQuestions.length} question(s) remaining.`);
        return;
      }
    }

    const timeSpentSeconds = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);

    try {
      const response = await submitQuizMutation.mutateAsync({
        contentBlockId: block.id,
        answers,
        timeSpentSeconds,
        enrollmentId,
      });

      setResult(response);
      setSubmitted(true);

      // Call onQuizComplete if quiz is passed
      if (response.attempt.isPassed && onQuizComplete) {
        onQuizComplete();
      }

      if (autoSubmit) {
        alert('Time is up! Your quiz has been automatically submitted.');
      }
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      alert('Failed to submit quiz. Please try again.');
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setResult(null);
  };

  const renderQuestion = (question: any, index: number) => {
    const questionNumber = index + 1;
    const userAnswer = answers[question.id];
    const isAnswered = userAnswer !== undefined && userAnswer !== null && userAnswer !== '';

    return (
      <div key={question.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
            {questionNumber}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-gray-900">{question.questionText}</h3>
              <span className="text-sm text-gray-500">{question.points} {question.points === 1 ? 'point' : 'points'}</span>
            </div>
            {question.difficulty && (
              <span className={`inline-block px-2 py-1 text-xs rounded ${
                question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {question.difficulty}
              </span>
            )}
          </div>
        </div>

        <div className="ml-11">
          {renderQuestionInput(question, userAnswer, isAnswered)}
        </div>
      </div>
    );
  };

  const renderQuestionInput = (question: any, userAnswer: any, isAnswered: boolean) => {
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
      case 'short_answer':
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

      case 'essay':
        return (
          <textarea
            value={userAnswer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            disabled={submitted}
            placeholder="Type your essay answer here..."
            rows={6}
            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed resize-y"
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
          <p className="text-gray-600">Loading quiz...</p>
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
            <h3 className="font-semibold">Failed to load quiz</h3>
            <p className="text-sm">{(error as any)?.message || 'An error occurred'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center gap-3 text-yellow-700">
          <AlertCircle className="h-6 w-6" />
          <p>No questions available for this quiz.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Quiz Header with Timer */}
      <div className={`rounded-lg p-6 ${
        !submitted && timeRemaining !== null && timeRemaining <= 300
          ? 'bg-gradient-to-r from-red-500 to-red-600'
          : 'bg-gradient-to-r from-blue-500 to-blue-600'
      } text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">{block.title}</h2>
            <div className="flex items-center gap-6 text-blue-100">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{quizData.totalQuestions} Questions</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                <span>{quizData.totalPoints} Points</span>
              </div>
            </div>
          </div>
          {/* Timer Display */}
          {!submitted && timeRemaining !== null && (
            <div className="text-right">
              <div className="text-sm text-blue-100 mb-1">Time Remaining</div>
              <div className={`text-3xl font-bold ${
                timeRemaining <= 300 ? 'animate-pulse' : ''
              }`}>
                {formatTimeRemaining(timeRemaining)}
              </div>
              {showLowTimeWarning && timeRemaining > 0 && (
                <div className="text-sm text-yellow-200 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>Hurry up!</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
                  <p className="text-sm text-gray-600">Attempt</p>
                  <p className="text-2xl font-bold">#{result.attempt.attemptNumber}</p>
                </div>
              </div>
              {!result.attempt.isPassed && (
                <button
                  onClick={handleRetry}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Question Navigation Grid */}
      {!submitted && quizData.questions.length > 5 && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Question Navigation</h3>
          <div className="grid grid-cols-10 gap-2">
            {quizData.questions.map((question, index) => {
              const isAnswered = answers[question.id] !== undefined && answers[question.id] !== null && answers[question.id] !== '';
              const isMarked = markedForReview.has(question.id);
              const isCurrent = index === currentQuestionIndex;

              return (
                <button
                  key={question.id}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`h-10 w-10 rounded-lg font-medium text-sm transition-colors ${
                    isCurrent
                      ? 'bg-blue-600 text-white'
                      : isMarked
                      ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-400'
                      : isAnswered
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={
                    isMarked
                      ? 'Marked for review'
                      : isAnswered
                      ? 'Answered'
                      : 'Not answered'
                  }
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-green-100 border border-green-200"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-yellow-100 border-2 border-yellow-400"></div>
              <span>Marked</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded bg-gray-100"></div>
              <span>Not answered</span>
            </div>
          </div>
        </div>
      )}

      {/* Questions */}
      {!submitted && (
        <>
          {/* Single Question View (for quizzes with many questions) */}
          {quizData.questions.length > 5 ? (
            <div className="space-y-4">
              {renderQuestion(quizData.questions[currentQuestionIndex], currentQuestionIndex)}

              {/* Mark for Review Button */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => toggleMarkForReview(quizData.questions[currentQuestionIndex].id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    markedForReview.has(quizData.questions[currentQuestionIndex].id)
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Bookmark className="h-4 w-4" />
                  {markedForReview.has(quizData.questions[currentQuestionIndex].id)
                    ? 'Unmark for Review'
                    : 'Mark for Review'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentQuestionIndex(
                        Math.min(quizData.questions.length - 1, currentQuestionIndex + 1)
                      )
                    }
                    disabled={currentQuestionIndex === quizData.questions.length - 1}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* All Questions View (for short quizzes) */
            <div className="space-y-4">
              {quizData.questions.map((question, index) => renderQuestion(question, index))}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitQuizMutation.isPending}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {submitQuizMutation.isPending ? 'Submitting...' : 'Submit Quiz'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default QuizViewer;

