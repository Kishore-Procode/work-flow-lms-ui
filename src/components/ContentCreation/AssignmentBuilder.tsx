import React, { useState } from 'react';
import { Save, X, FileText, Upload, Link as LinkIcon } from 'lucide-react';

interface AssignmentData {
  title: string;
  description: string;
  instructions: string;
  submissionFormat: 'text' | 'file' | 'both';
  maxPoints: number;
  dueDate?: string;
  allowLateSubmission: boolean;
  estimatedTime: string;
  isRequired: boolean;
  rubric?: Array<{
    criteria: string;
    maxScore: number;
    description: string;
  }>;
}

interface AssignmentBuilderProps {
  initialData?: AssignmentData;
  onSave: (assignmentData: AssignmentData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const AssignmentBuilder: React.FC<AssignmentBuilderProps> = ({
  initialData,
  onSave,
  onCancel,
  loading = false
}) => {
  const [assignmentData, setAssignmentData] = useState<AssignmentData>(
    initialData || {
      title: '',
      description: '',
      instructions: '',
      submissionFormat: 'both',
      maxPoints: 100,
      dueDate: undefined,
      allowLateSubmission: false,
      estimatedTime: '10080',
      isRequired: true,
      rubric: []
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!assignmentData.title.trim()) {
      newErrors.title = 'Assignment title is required';
    }

    if (!assignmentData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!assignmentData.instructions.trim()) {
      newErrors.instructions = 'Instructions are required';
    }

    if (assignmentData.maxPoints <= 0) {
      newErrors.maxPoints = 'Max points must be greater than 0';
    }

    // Validate rubric if present
    if (assignmentData.rubric && assignmentData.rubric.length > 0) {
      const totalRubricScore = assignmentData.rubric.reduce((sum, r) => sum + r.maxScore, 0);
      if (totalRubricScore !== assignmentData.maxPoints) {
        newErrors.rubric = `Rubric total (${totalRubricScore}) must equal max points (${assignmentData.maxPoints})`;
      }

      assignmentData.rubric.forEach((r, index) => {
        if (!r.criteria.trim()) {
          newErrors[`rubric_${index}_criteria`] = `Rubric item ${index + 1} criteria is required`;
        }
        if (r.maxScore <= 0) {
          newErrors[`rubric_${index}_score`] = `Rubric item ${index + 1} score must be greater than 0`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      alert('Please fix all validation errors before saving');
      return;
    }

    await onSave(assignmentData);
  };

  const addRubricItem = () => {
    setAssignmentData({
      ...assignmentData,
      rubric: [
        ...(assignmentData.rubric || []),
        { criteria: '', maxScore: 10, description: '' }
      ]
    });
  };

  const updateRubricItem = (index: number, updates: Partial<AssignmentData['rubric'][0]>) => {
    const newRubric = [...(assignmentData.rubric || [])];
    newRubric[index] = { ...newRubric[index], ...updates };
    setAssignmentData({ ...assignmentData, rubric: newRubric });
  };

  const deleteRubricItem = (index: number) => {
    const newRubric = assignmentData.rubric?.filter((_, i) => i !== index);
    setAssignmentData({ ...assignmentData, rubric: newRubric });
  };

  const totalRubricScore = assignmentData.rubric?.reduce((sum, r) => sum + r.maxScore, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {initialData ? 'Edit Assignment' : 'Create Assignment'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Create an assignment for students to submit text responses or file uploads
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
            {loading ? 'Saving...' : 'Save Assignment'}
          </button>
        </div>
      </div>

      {/* Assignment Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Assignment Details</h3>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Assignment Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={assignmentData.title}
            onChange={(e) => setAssignmentData({ ...assignmentData, title: e.target.value })}
            placeholder="e.g., Research Paper on Data Structures"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={assignmentData.description}
            onChange={(e) => setAssignmentData({ ...assignmentData, description: e.target.value })}
            rows={3}
            placeholder="Brief description of the assignment..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Instructions <span className="text-red-500">*</span>
          </label>
          <textarea
            value={assignmentData.instructions}
            onChange={(e) => setAssignmentData({ ...assignmentData, instructions: e.target.value })}
            rows={5}
            placeholder="Detailed instructions for completing the assignment..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          {errors.instructions && <p className="text-red-500 text-sm mt-1">{errors.instructions}</p>}
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Submission Format <span className="text-red-500">*</span>
            </label>
            <select
              value={assignmentData.submissionFormat}
              onChange={(e) => setAssignmentData({ ...assignmentData, submissionFormat: e.target.value as AssignmentData['submissionFormat'] })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="text">Text Only</option>
              <option value="file">File Upload Only</option>
              <option value="both">Text + File Upload</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Max Points <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={assignmentData.maxPoints}
              onChange={(e) => setAssignmentData({ ...assignmentData, maxPoints: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            {errors.maxPoints && <p className="text-red-500 text-sm mt-1">{errors.maxPoints}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estimated Time (minutes)
            </label>
            <input
              type="number"
              value={assignmentData.estimatedTime}
              onChange={(e) => setAssignmentData({ ...assignmentData, estimatedTime: e.target.value })}
              placeholder="e.g., 10080 (1 week)"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Common values: 60 (1 hour), 1440 (1 day), 10080 (1 week)
            </p>
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Due Date (Optional)
          </label>
          <input
            type="datetime-local"
            value={assignmentData.dueDate || ''}
            onChange={(e) => setAssignmentData({ ...assignmentData, dueDate: e.target.value || undefined })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Checkboxes */}
        <div className="flex items-center space-x-6">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={assignmentData.allowLateSubmission}
              onChange={(e) => setAssignmentData({ ...assignmentData, allowLateSubmission: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Allow Late Submission</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={assignmentData.isRequired}
              onChange={(e) => setAssignmentData({ ...assignmentData, isRequired: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Required for Course Completion</span>
          </label>
        </div>
      </div>

      {/* Grading Rubric (Optional) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Grading Rubric (Optional)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Define grading criteria for consistent evaluation
            </p>
          </div>
          <button
            type="button"
            onClick={addRubricItem}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Add Criteria
          </button>
        </div>

        {errors.rubric && <p className="text-red-500 text-sm mb-4">{errors.rubric}</p>}

        {assignmentData.rubric && assignmentData.rubric.length > 0 && (
          <div className="space-y-3">
            {assignmentData.rubric.map((item, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-5">
                    <input
                      type="text"
                      value={item.criteria}
                      onChange={(e) => updateRubricItem(index, { criteria: e.target.value })}
                      placeholder="Criteria (e.g., Content Quality)"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <input
                      type="number"
                      min="1"
                      value={item.maxScore}
                      onChange={(e) => updateRubricItem(index, { maxScore: parseInt(e.target.value) || 1 })}
                      placeholder="Points"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateRubricItem(index, { description: e.target.value })}
                      placeholder="Description (optional)"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>
                  <div className="md:col-span-1 flex items-center">
                    <button
                      type="button"
                      onClick={() => deleteRubricItem(index)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-3 text-sm">
              <span className="text-gray-700 dark:text-gray-300">
                Total Rubric Score: <span className={totalRubricScore === assignmentData.maxPoints ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{totalRubricScore}</span> / {assignmentData.maxPoints}
              </span>
            </div>
          </div>
        )}
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

