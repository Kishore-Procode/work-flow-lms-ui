import React, { useState } from 'react';
import { Save, X, AlertTriangle, Award } from 'lucide-react';
import { QuestionBuilder, Question } from './QuestionBuilder';

interface ExaminationData {
  title: string;
  instructions: string;
  passingScore: number;
  timeLimit: number; // Required for examinations
  estimatedTime: string;
  isRequired: boolean;
  certificateTemplate?: string;
}

interface ExaminationBuilderProps {
  initialData?: ExaminationData;
  initialQuestions?: Question[];
  onSave: (examinationData: ExaminationData, questions: Question[]) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const ExaminationBuilder: React.FC<ExaminationBuilderProps> = ({
  initialData,
  initialQuestions = [],
  onSave,
  onCancel,
  loading = false
}) => {
  const [examinationData, setExaminationData] = useState<ExaminationData>(
    initialData || {
      title: '',
      instructions: '',
      passingScore: 50,
      timeLimit: 60,
      estimatedTime: '60 minutes',
      isRequired: true,
      certificateTemplate: undefined
    }
  );

  const [questions, setQuestions] = useState<Question[]>(
    initialQuestions.length > 0 ? initialQuestions : []
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!examinationData.title.trim()) {
      newErrors.title = 'Examination title is required';
    }

    if (!examinationData.instructions.trim()) {
      newErrors.instructions = 'Instructions are required';
    }

    if (examinationData.passingScore < 0 || examinationData.passingScore > 100) {
      newErrors.passingScore = 'Passing score must be between 0 and 100';
    }

    if (!examinationData.timeLimit || examinationData.timeLimit <= 0) {
      newErrors.timeLimit = 'Time limit is required for examinations';
    }

    if (questions.length === 0) {
      newErrors.questions = 'At least one question is required';
    }

    if (questions.length < 5) {
      newErrors.questions = 'Examinations should have at least 5 questions';
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

    await onSave(examinationData, questions);
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const autoGradedQuestions = questions.filter(q => 
    ['single_choice', 'multiple_choice', 'true_false'].includes(q.questionType)
  ).length;
  const manualGradedQuestions = questions.filter(q => 
    ['short_answer', 'long_answer'].includes(q.questionType)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {initialData ? 'Edit Examination' : 'Create Examination'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Create a final examination with certificate generation on pass
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
            {loading ? 'Saving...' : 'Save Examination'}
          </button>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800 dark:text-yellow-300">
            <p className="font-medium mb-1">Examination Rules</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Students can only attempt the examination ONCE</li>
              <li>Examination is only available after 100% course completion</li>
              <li>Certificate is automatically generated upon passing</li>
              <li>Time limit is strictly enforced</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Examination Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Examination Details</h3>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Examination Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={examinationData.title}
            onChange={(e) => setExaminationData({ ...examinationData, title: e.target.value })}
            placeholder="e.g., Final Examination - Data Structures"
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
            value={examinationData.instructions}
            onChange={(e) => setExaminationData({ ...examinationData, instructions: e.target.value })}
            rows={4}
            placeholder="Provide detailed instructions for the examination..."
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
              value={examinationData.passingScore}
              onChange={(e) => setExaminationData({ ...examinationData, passingScore: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            {errors.passingScore && <p className="text-red-500 text-sm mt-1">{errors.passingScore}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time Limit (minutes) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={examinationData.timeLimit}
              onChange={(e) => setExaminationData({ ...examinationData, timeLimit: parseInt(e.target.value) || 60 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            {errors.timeLimit && <p className="text-red-500 text-sm mt-1">{errors.timeLimit}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estimated Time
            </label>
            <input
              type="text"
              value={examinationData.estimatedTime}
              onChange={(e) => setExaminationData({ ...examinationData, estimatedTime: e.target.value })}
              placeholder="e.g., 60 minutes"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Certificate Template */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Certificate Template (Optional)
          </label>
          <input
            type="text"
            value={examinationData.certificateTemplate || ''}
            onChange={(e) => setExaminationData({ ...examinationData, certificateTemplate: e.target.value || undefined })}
            placeholder="Leave blank for default template"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Examination Stats */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <Award className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium mb-1">Examination Statistics</p>
              <div className="grid grid-cols-2 gap-2">
                <p>Total Questions: {questions.length}</p>
                <p>Total Points: {totalPoints}</p>
                <p>Auto-graded: {autoGradedQuestions}</p>
                <p>Manual Grading: {manualGradedQuestions}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Questions <span className="text-red-500">*</span>
          <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2">
            (Minimum 5 questions recommended)
          </span>
        </h3>
        {errors.questions && <p className="text-red-500 text-sm mb-4">{errors.questions}</p>}
        
        <QuestionBuilder
          questions={questions}
          onChange={setQuestions}
          maxQuestions={100}
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

