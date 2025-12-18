/**
 * Subject Content Modal Component
 * 
 * Displays detailed learning content/syllabus for an enrolled subject.
 * Fetches content from ACT application's course data.
 * 
 * @author Student-ACT LMS Team
 * @version 1.0.0
 */

import React from 'react';
import { X, BookOpen, Award, Clock, FileText, Target, CheckCircle, AlertCircle } from 'lucide-react';
import { useLearningContent } from '../../hooks/api/useStudentEnrollment';
import LoadingSpinner from '../UI/LoadingSpinner';
import ErrorMessage from '../UI/ErrorMessage';

interface SubjectContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  enrollmentId: string;
  subjectName: string;
  subjectCode: string;
}

const SubjectContentModal: React.FC<SubjectContentModalProps> = ({
  isOpen,
  onClose,
  enrollmentId,
  subjectName,
  subjectCode,
}) => {
  const { data: content, isLoading, error } = useLearningContent(enrollmentId, isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-6 h-6" />
              <span className="text-sm font-medium opacity-90">{subjectCode}</span>
            </div>
            <h2 className="text-2xl font-bold">{subjectName}</h2>
            <p className="text-sm opacity-90 mt-1">Course Content & Syllabus</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="large" message="Loading course content..." />
            </div>
          )}

          {error && (
            <ErrorMessage
              title="Failed to Load Content"
              message="We couldn't load the course content. Please try again."
              error={error}
            />
          )}

          {content && (
            <div className="space-y-6">
              {/* Course Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <Award className="w-5 h-5" />
                    <span className="text-sm font-medium">Credits</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{content.credits || 'N/A'}</p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm font-medium">Duration</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {content.durationWeeks ? `${content.durationWeeks} weeks` : 'N/A'}
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-purple-600 mb-2">
                    <FileText className="w-5 h-5" />
                    <span className="text-sm font-medium">Type</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{content.courseType || 'N/A'}</p>
                </div>
              </div>

              {/* Description */}
              {content.description && (
                <div className="bg-gray-50 rounded-lg p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    Course Description
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {content.description}
                  </p>
                </div>
              )}

              {/* Prerequisites */}
              {content.prerequisites && (
                <div className="bg-yellow-50 rounded-lg p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    Prerequisites
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {content.prerequisites}
                  </p>
                </div>
              )}

              {/* Learning Objectives */}
              {content.learningObjectives && (
                <div className="bg-blue-50 rounded-lg p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Learning Objectives
                  </h3>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {content.learningObjectives}
                  </div>
                </div>
              )}

              {/* Learning Outcomes */}
              {content.learningOutcomes && (
                <div className="bg-blue-50 rounded-lg p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    Learning Outcomes
                  </h3>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {content.learningOutcomes}
                  </div>
                </div>
              )}

              {/* Syllabus */}
              {content.syllabusContent && (
                <div className="bg-white border-2 border-gray-200 rounded-lg p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-gray-600" />
                    Detailed Syllabus
                  </h3>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {content.syllabusContent}
                  </div>
                </div>
              )}

              {/* Progress Info */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Your Progress</h3>
                    <p className="text-sm text-gray-600">
                      Status: <span className="font-medium capitalize">{content.status}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-blue-600">{content.progressPercentage}%</p>
                    <p className="text-sm text-gray-600">Complete</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                      style={{ width: `${content.progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* No Content Message */}
              {!content.description &&
                !content.prerequisites &&
                !content.learningObjectives &&
                !content.learningOutcomes &&
                !content.syllabusContent && (
                  <div className="text-center py-12">
                    <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Detailed Content Available
                    </h3>
                    <p className="text-gray-600">
                      The detailed course content has not been added yet. Please check back later or
                      contact your instructor.
                    </p>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubjectContentModal;

