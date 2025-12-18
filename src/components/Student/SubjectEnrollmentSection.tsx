/**
 * Subject Enrollment Section Component
 * 
 * Allows students to enroll in available subjects for a semester.
 * 
 * @author Student-ACT LMS Team
 * @version 1.0.0
 */

import React, { useState, useMemo } from 'react';
import { Search, Filter, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { useAvailableSubjects, useEnrollSubjects } from '../../hooks/api/useStudentEnrollment';
import { StudentEnrollmentService } from '../../services/studentEnrollmentService';
import LoadingSpinner from '../UI/LoadingSpinner';
import ErrorMessage from '../UI/ErrorMessage';

interface SubjectEnrollmentSectionProps {
  semesterNumber: number;
  academicYearId: string;
}

const SubjectEnrollmentSection: React.FC<SubjectEnrollmentSectionProps> = ({
  semesterNumber,
  academicYearId,
}) => {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEnrolledOnly, setShowEnrolledOnly] = useState(false);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  // Fetch available subjects
  const {
    data: availableSubjectsData,
    isLoading,
    error,
  } = useAvailableSubjects(semesterNumber);

  // Enroll mutation
  const enrollMutation = useEnrollSubjects();

  // Filter and search subjects
  const filteredSubjects = useMemo(() => {
    if (!availableSubjectsData) return [];

    let subjects = availableSubjectsData.subjects;

    // Apply search filter
    if (searchQuery) {
      subjects = StudentEnrollmentService.filterSubjectsBySearch(subjects, searchQuery);
    }

    // Apply enrollment status filter
    if (showEnrolledOnly) {
      subjects = subjects.filter((s) => s.isEnrolled);
    } else if (showAvailableOnly) {
      subjects = subjects.filter((s) => !s.isEnrolled);
    }

    return subjects;
  }, [availableSubjectsData, searchQuery, showEnrolledOnly, showAvailableOnly]);

  // Handle subject selection
  const toggleSubjectSelection = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    const availableSubjectIds = filteredSubjects
      .filter((s) => !s.isEnrolled)
      .map((s) => s.id);
    setSelectedSubjects(availableSubjectIds);
  };

  // Handle clear selection
  const handleClearSelection = () => {
    setSelectedSubjects([]);
  };

  // Handle enrollment
  const handleEnroll = async () => {
    if (selectedSubjects.length === 0) {
      return;
    }

    await enrollMutation.mutateAsync({
      semesterNumber,
      academicYearId,
      subjectIds: selectedSubjects,
    });

    // Clear selection after successful enrollment
    setSelectedSubjects([]);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="large" message="Loading available subjects..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorMessage
        title="Failed to Load Subjects"
        message="We couldn't load the available subjects. Please try again."
        error={error}
      />
    );
  }

  const availableCount = filteredSubjects.filter((s) => !s.isEnrolled).length;
  const enrolledCount = filteredSubjects.filter((s) => s.isEnrolled).length;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Available Subjects - Semester {semesterNumber}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {availableCount} available • {enrolledCount} already enrolled
          </p>
        </div>
        {selectedSubjects.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {selectedSubjects.length} selected
            </span>
            <button
              onClick={handleClearSelection}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Clear
            </button>
            <button
              onClick={handleEnroll}
              disabled={enrollMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {enrollMutation.isPending ? 'Enrolling...' : `Enroll in ${selectedSubjects.length} Subject${selectedSubjects.length > 1 ? 's' : ''}`}
            </button>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search subjects by code or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowAvailableOnly(!showAvailableOnly);
              setShowEnrolledOnly(false);
            }}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              showAvailableOnly
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Available Only
          </button>
          <button
            onClick={() => {
              setShowEnrolledOnly(!showEnrolledOnly);
              setShowAvailableOnly(false);
            }}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              showEnrolledOnly
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Enrolled Only
          </button>
        </div>

        {/* Select All */}
        {availableCount > 0 && (
          <button
            onClick={handleSelectAll}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Select All Available
          </button>
        )}
      </div>

      {/* Subjects Grid */}
      {filteredSubjects.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No subjects found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubjects.map((subject) => {
            const isSelected = selectedSubjects.includes(subject.id);
            const isEnrolled = subject.isEnrolled;

            return (
              <div
                key={subject.id}
                onClick={() => !isEnrolled && toggleSubjectSelection(subject.id)}
                className={`
                  relative p-4 rounded-lg border-2 transition-all cursor-pointer
                  ${
                    isEnrolled
                      ? 'bg-blue-50 border-blue-300 cursor-not-allowed'
                      : isSelected
                      ? 'bg-blue-50 border-blue-500 shadow-md'
                      : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                  }
                `}
              >
                {/* Selection Indicator */}
                <div className="absolute top-3 right-3">
                  {isEnrolled ? (
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  ) : isSelected ? (
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-300" />
                  )}
                </div>

                {/* Subject Info */}
                <div className="pr-8">
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    {subject.actSubjectCode}
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {subject.actSubjectName}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{subject.actSubjectCredits} Credits</span>
                    {isEnrolled && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        Enrolled
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SubjectEnrollmentSection;

