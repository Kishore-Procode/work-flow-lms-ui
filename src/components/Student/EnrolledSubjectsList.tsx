/**
 * Enrolled Subjects List Component
 * 
 * Displays list of enrolled subjects with progress tracking.
 * 
 * @author Student-ACT LMS Team
 * @version 1.0.0
 */

import React, { useState, useMemo } from 'react';
import { Search, Calendar, Award, TrendingUp, ExternalLink, Filter, Play, FileText, BookOpen, X } from 'lucide-react';
import { useEnrolledSubjects } from '../../hooks/api/useStudentEnrollment';
import { StudentEnrollmentService } from '../../services/studentEnrollmentService';
import { ENROLLMENT_STATUS_LABELS, ENROLLMENT_STATUS_COLORS } from '../../types/studentEnrollment';
import type { EnrollmentStatus, SortField, SortOrder, LessonPlan } from '../../types/studentEnrollment';
import LoadingSpinner from '../UI/LoadingSpinner';
import ErrorMessage from '../UI/ErrorMessage';
import PDFViewerModal from '../UI/PDFViewerModal';
import { router } from '../../utils/router';
import { getImageUrl } from '../../config/environment';

interface EnrolledSubjectsListProps {
  viewMode: 'grid' | 'list';
}

const EnrolledSubjectsList: React.FC<EnrolledSubjectsListProps> = ({ viewMode }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatus | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('enrollmentDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedPdf, setSelectedPdf] = useState<{
    url: string;
    title: string;
    fileName: string;
  } | null>(null);
  const [showLessonPlansModal, setShowLessonPlansModal] = useState(false);
  const [selectedSubjectLessonPlans, setSelectedSubjectLessonPlans] = useState<{
    subjectName: string;
    lessonPlans: LessonPlan[];
  } | null>(null);

  // Fetch enrolled subjects
  const { data: enrolledData, isLoading, error } = useEnrolledSubjects();

  // Filter, search, and sort subjects
  const processedSubjects = useMemo(() => {
    if (!enrolledData) return [];

    let subjects = enrolledData.enrollments;

    // Apply search filter
    if (searchQuery) {
      subjects = StudentEnrollmentService.filterSubjectsBySearch(subjects, searchQuery);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      subjects = subjects.filter((s) => s.status === statusFilter);
    }

    // Apply sorting
    subjects = StudentEnrollmentService.sortSubjects(subjects, sortField, sortOrder);

    return subjects;
  }, [enrolledData, searchQuery, statusFilter, sortField, sortOrder]);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="large" message="Loading your enrolled subjects..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorMessage
        title="Failed to Load Enrolled Subjects"
        message="We couldn't load your enrolled subjects. Please try again."
        error={error}
      />
    );
  }

  // Empty state
  if (!enrolledData || enrolledData.enrollments.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Enrolled Subjects</h3>
        <p className="text-gray-600 mb-6">
          You haven't enrolled in any subjects yet. Click on "Enroll in Subjects" to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search enrolled subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as EnrollmentStatus | 'all')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="dropped">Dropped</option>
          <option value="failed">Failed</option>
        </select>

        {/* Sort */}
        <select
          value={`${sortField}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split('-');
            setSortField(field as SortField);
            setSortOrder(order as SortOrder);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="enrollmentDate-desc">Newest First</option>
          <option value="enrollmentDate-asc">Oldest First</option>
          <option value="subjectCode-asc">Code (A-Z)</option>
          <option value="subjectCode-desc">Code (Z-A)</option>
          <option value="subjectName-asc">Name (A-Z)</option>
          <option value="subjectName-desc">Name (Z-A)</option>
          <option value="progress-desc">Progress (High-Low)</option>
          <option value="progress-asc">Progress (Low-High)</option>
        </select>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {processedSubjects.length} of {enrolledData.enrollments.length} subjects
      </div>

      {/* Subjects Display */}
      {processedSubjects.length === 0 ? (
        <div className="text-center py-12">
          <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No subjects found matching your criteria.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedSubjects.map((enrollment) => (
            <EnrollmentCard
              key={enrollment.enrollmentId}
              enrollment={enrollment}
              onViewSyllabus={() => {
                if (enrollment.syllabusPdfUrl) {
                  // Convert relative path to full URL
                  const fullPdfUrl = getImageUrl(enrollment.syllabusPdfUrl);
                  setSelectedPdf({
                    url: fullPdfUrl,
                    title: `${enrollment.subjectCode} - ${enrollment.subjectName} Syllabus`,
                    fileName: `${enrollment.subjectCode}_Syllabus.pdf`,
                  });
                }
              }}
              onViewLessonPlans={() => {
                setSelectedSubjectLessonPlans({
                  subjectName: `${enrollment.subjectCode} - ${enrollment.subjectName}`,
                  lessonPlans: enrollment.lessonPlans || [],
                });
                setShowLessonPlansModal(true);
              }}
              onPlaySession={() => {
                console.log('🎬 Course Player button clicked:', {
                  subjectId: enrollment.subjectId,
                  subjectName: enrollment.subjectName,
                  enrollmentId: enrollment.enrollmentId,
                });
                router.navigateToCoursePlayer(enrollment.subjectId);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {processedSubjects.map((enrollment) => (
            <EnrollmentListItem
              key={enrollment.enrollmentId}
              enrollment={enrollment}
              onViewSyllabus={() => {
                if (enrollment.syllabusPdfUrl) {
                  // Convert relative path to full URL
                  const fullPdfUrl = getImageUrl(enrollment.syllabusPdfUrl);
                  setSelectedPdf({
                    url: fullPdfUrl,
                    title: `${enrollment.subjectCode} - ${enrollment.subjectName} Syllabus`,
                    fileName: `${enrollment.subjectCode}_Syllabus.pdf`,
                  });
                }
              }}
              onViewLessonPlans={() => {
                setSelectedSubjectLessonPlans({
                  subjectName: `${enrollment.subjectCode} - ${enrollment.subjectName}`,
                  lessonPlans: enrollment.lessonPlans || [],
                });
                setShowLessonPlansModal(true);
              }}
              onPlaySession={() => {
                console.log('🎬 Course Player button clicked (list view):', {
                  subjectId: enrollment.subjectId,
                  subjectName: enrollment.subjectName,
                  enrollmentId: enrollment.enrollmentId,
                });
                router.navigateToCoursePlayer(enrollment.subjectId);
              }}
            />
          ))}
        </div>
      )}

      {/* PDF Viewer Modal */}
      {selectedPdf && (
        <PDFViewerModal
          isOpen={!!selectedPdf}
          onClose={() => setSelectedPdf(null)}
          pdfUrl={selectedPdf.url}
          title={selectedPdf.title}
          fileName={selectedPdf.fileName}
        />
      )}

      {/* Lesson Plans Modal */}
      {showLessonPlansModal && selectedSubjectLessonPlans && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Lesson Plans</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedSubjectLessonPlans.subjectName}</p>
              </div>
              <button
                onClick={() => {
                  setShowLessonPlansModal(false);
                  setSelectedSubjectLessonPlans(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {selectedSubjectLessonPlans.lessonPlans.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No lesson plans available for this subject.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedSubjectLessonPlans.lessonPlans.map((lessonPlan) => (
                    <div
                      key={lessonPlan.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                              {lessonPlan.moduleName}
                            </span>
                            {lessonPlan.duration && (
                              <span className="text-xs text-gray-500">
                                {lessonPlan.duration} mins
                              </span>
                            )}
                          </div>
                          <h4 className="font-medium text-gray-900 mb-2">{lessonPlan.title}</h4>
                        </div>
                        {lessonPlan.pdfUrl ? (
                          <button
                            onClick={() => {
                              const fullPdfUrl = getImageUrl(lessonPlan.pdfUrl!);
                              setSelectedPdf({
                                url: fullPdfUrl,
                                title: `${lessonPlan.moduleName} - ${lessonPlan.title}`,
                                fileName: `${lessonPlan.moduleName}_LessonPlan.pdf`,
                              });
                              setShowLessonPlansModal(false);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                          >
                            <FileText className="w-4 h-4" />
                            View PDF
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No PDF available</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Enrollment Card Component (Grid View)
const EnrollmentCard: React.FC<{
  enrollment: any;
  onViewSyllabus: () => void;
  onViewLessonPlans: () => void;
  onPlaySession: () => void;
}> = ({
  enrollment,
  onViewSyllabus,
  onViewLessonPlans,
  onPlaySession,
}) => {
  const statusColor = ENROLLMENT_STATUS_COLORS[enrollment.status as EnrollmentStatus];
  const progressColor = StudentEnrollmentService.getProgressColor(enrollment.progressPercentage);

  // Determine button text based on progress
  const getCourseButtonText = () => {
    if (enrollment.progressPercentage === 0) {
      return 'Start Course';
    }
    return 'Continue Course';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-500">
              {enrollment.subjectCode}
            </span>
            {enrollment.regulationName && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-xs text-gray-500">
                  {enrollment.regulationName}
                </span>
              </>
            )}
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            {enrollment.subjectName}
          </h4>
        </div>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full bg-${statusColor}-100 text-${statusColor}-700`}
        >
          {ENROLLMENT_STATUS_LABELS[enrollment.status as EnrollmentStatus]}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium text-gray-900">{enrollment.progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`bg-${progressColor}-500 h-2 rounded-full transition-all`}
            style={{ width: `${enrollment.progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Award className="w-4 h-4" />
          <span>{enrollment.credits} Credits</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Enrolled {StudentEnrollmentService.formatDate(enrollment.enrollmentDate)}</span>
        </div>
        {enrollment.grade && (
          <div className="flex items-center gap-2 text-gray-600">
            <TrendingUp className="w-4 h-4" />
            <span>Grade: {enrollment.grade}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 space-y-2">
        {/* Primary Action: Start/Continue Course */}
        <button
          onClick={onPlaySession}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Play className="w-4 h-4" />
          {getCourseButtonText()}
        </button>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-2">
          {enrollment.syllabusPdfUrl && (
            <button
              onClick={onViewSyllabus}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <FileText className="w-4 h-4" />
              Syllabus
            </button>
          )}
          {enrollment.lessonPlans && enrollment.lessonPlans.length > 0 && (
            <button
              onClick={onViewLessonPlans}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <BookOpen className="w-4 h-4" />
              Lesson Plans
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Enrollment List Item Component (List View)
const EnrollmentListItem: React.FC<{
  enrollment: any;
  onViewSyllabus: () => void;
  onViewLessonPlans: () => void;
  onPlaySession: () => void;
}> = ({
  enrollment,
  onViewSyllabus,
  onViewLessonPlans,
  onPlaySession,
}) => {
  const statusColor = ENROLLMENT_STATUS_COLORS[enrollment.status as EnrollmentStatus];
  const progressColor = StudentEnrollmentService.getProgressColor(enrollment.progressPercentage);

  // Determine button text based on progress
  const getCourseButtonText = () => {
    if (enrollment.progressPercentage === 0) {
      return 'Start Course';
    }
    return 'Continue';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-4">
        {/* Subject Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-medium text-gray-500">{enrollment.subjectCode}</span>
            {enrollment.regulationName && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-xs text-gray-500">{enrollment.regulationName}</span>
              </>
            )}
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full bg-${statusColor}-100 text-${statusColor}-700`}
            >
              {ENROLLMENT_STATUS_LABELS[enrollment.status as EnrollmentStatus]}
            </span>
          </div>
          <h4 className="text-base font-semibold text-gray-900 mb-1">{enrollment.subjectName}</h4>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{enrollment.credits} Credits</span>
            <span>•</span>
            <span>Enrolled {StudentEnrollmentService.formatDate(enrollment.enrollmentDate)}</span>
            {enrollment.grade && (
              <>
                <span>•</span>
                <span>Grade: {enrollment.grade}</span>
              </>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="w-48">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium text-gray-900">{enrollment.progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`bg-${progressColor}-500 h-2 rounded-full transition-all`}
              style={{ width: `${enrollment.progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Primary Action: Start/Continue Course */}
          <button
            onClick={onPlaySession}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
          >
            <Play className="w-4 h-4" />
            {getCourseButtonText()}
          </button>

          {/* Syllabus PDF Button */}
          {enrollment.syllabusPdfUrl && (
            <button
              onClick={onViewSyllabus}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              title="View Syllabus PDF"
            >
              <FileText className="w-4 h-4" />
            </button>
          )}

          {/* Lesson Plans Button */}
          {enrollment.lessonPlans && enrollment.lessonPlans.length > 0 && (
            <button
              onClick={onViewLessonPlans}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              title="View Lesson Plans"
            >
              <BookOpen className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnrolledSubjectsList;

