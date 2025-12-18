import React, { useState } from 'react';
import { Save, X, HelpCircle } from 'lucide-react';
import { QuestionBuilder, Question } from './QuestionBuilder';

interface QuizData {
  title: string;
  instructions: string;
  passingScore: number;
  allowRetry: boolean;
  timeLimit?: number;
  estimatedTime: string;
  isRequired: boolean;
}

interface QuizBuilderProps {
  initialData?: QuizData;
  initialQuestions?: Question[];
  onSave: (quizData: QuizData, questions: Question[]) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const QuizBuilder: React.FC<QuizBuilderProps> = ({
  initialData,
  initialQuestions = [],
  onSave,
  onCancel,
  loading = false
}) => {
  const [quizData, setQuizData] = useState<QuizData>(
    initialData || {
      title: '',
      instructions: '',
      passingScore: 70,
      allowRetry: true,
      timeLimit: undefined,
      estimatedTime: '30 minutes',
      isRequired: true
    }
  );

  const [questions, setQuestions] = useState<Question[]>(
    initialQuestions.length > 0 ? initialQuestions : []
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!quizData.title.trim()) {
      newErrors.title = 'Quiz title is required';
    }

    if (!quizData.instructions.trim()) {
      newErrors.instructions = 'Instructions are required';
    }

    if (quizData.passingScore < 0 || quizData.passingScore > 100) {
      newErrors.passingScore = 'Passing score must be between 0 and 100';
    }

    if (questions.length === 0) {
      newErrors.questions = 'At least one question is required';
    }

    // Validate each question
    questions.forEach((q, index) => {
      if (!q.questionText.trim()) {
        newErrors[`question_${index}_text`] = `Question ${index + 1} text is required`;
      }

      if (q.questionType === 'single_choice' || q.questionType === 'multiple_choice') {
        if (!q.options || q.options.length < 2) {
          newErrors[`question_${index}_options`] = `Question ${index + 1} must have at least 2 options`;
        }

        if (q.options?.some(opt => !opt.trim())) {
          newErrors[`question_${index}_options`] = `Question ${index + 1} has empty options`;
        }

        if (q.questionType === 'single_choice' && !q.correctAnswer) {
          newErrors[`question_${index}_answer`] = `Question ${index + 1} must have a correct answer`;
        }

        if (q.questionType === 'multiple_choice' && (!q.correctAnswer || (q.correctAnswer as string[]).length === 0)) {
          newErrors[`question_${index}_answer`] = `Question ${index + 1} must have at least one correct answer`;
        }
      }

      if (q.questionType === 'true_false' && !q.correctAnswer) {
        newErrors[`question_${index}_answer`] = `Question ${index + 1} must have a correct answer`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      alert('Please fix all validation errors before saving');
      return;
    }

    await onSave(quizData, questions);
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {initialData ? 'Edit Quiz' : 'Create Quiz'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Create a quiz with multiple choice, true/false, or text-based questions
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 inline mr-2" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
          >
            <Save className="w-5 h-5 mr-2" />
            {loading ? 'Saving...' : 'Save Quiz'}
          </button>
        </div>
      </div>

      {/* Quiz Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quiz Details</h3>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quiz Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={quizData.title}
            onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
            placeholder="e.g., Introduction to Programming Quiz"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Instructions <span className="text-red-500">*</span>
          </label>
          <textarea
            value={quizData.instructions}
            onChange={(e) => setQuizData({ ...quizData, instructions: e.target.value })}
            rows={3}
            placeholder="Provide instructions for students taking this quiz..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          {errors.instructions && <p className="text-red-500 text-sm mt-1">{errors.instructions}</p>}
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Passing Score (%) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={quizData.passingScore}
              onChange={(e) => setQuizData({ ...quizData, passingScore: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            {errors.passingScore && <p className="text-red-500 text-sm mt-1">{errors.passingScore}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time Limit (minutes)
            </label>
            <input
              type="number"
              min="1"
              value={quizData.timeLimit || ''}
              onChange={(e) => setQuizData({ ...quizData, timeLimit: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="No limit"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estimated Time
            </label>
            <input
              type="text"
              value={quizData.estimatedTime}
              onChange={(e) => setQuizData({ ...quizData, estimatedTime: e.target.value })}
              placeholder="e.g., 30 minutes"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Checkboxes */}
        <div className="flex items-center space-x-6">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={quizData.allowRetry}
              onChange={(e) => setQuizData({ ...quizData, allowRetry: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Allow Retry</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={quizData.isRequired}
              onChange={(e) => setQuizData({ ...quizData, isRequired: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Required for Course Completion</span>
          </label>
        </div>

        {/* Quiz Stats */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium mb-1">Quiz Statistics</p>
              <p>Total Questions: {questions.length} • Total Points: {totalPoints}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Questions <span className="text-red-500">*</span>
        </h3>
        {errors.questions && <p className="text-red-500 text-sm mb-4">{errors.questions}</p>}
        
        <QuestionBuilder
          questions={questions}
          onChange={setQuestions}
          maxQuestions={50}
        />
      </div>

      {/* Validation Errors Summary */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
            Please fix the following errors:
          </p>
          <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-400 space-y-1">
            {Object.values(errors).map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

