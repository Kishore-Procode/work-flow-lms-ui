/**
 * Student Enrollment Dashboard
 * 
 * Main dashboard for student subject enrollment and learning management.
 * 
 * @author Student-ACT LMS Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { BookOpen, Calendar, Award, TrendingUp, Plus, List, Grid } from 'lucide-react';
import { useCurrentSemester, useEnrollmentStats } from '../../hooks/api/useStudentEnrollment';
import SemesterInfoCard from './SemesterInfoCard';
import EnrollmentStatsCards from './EnrollmentStatsCards';
import SubjectEnrollmentSection from './SubjectEnrollmentSection';
import EnrolledSubjectsList from './EnrolledSubjectsList';
import LoadingSpinner from '../UI/LoadingSpinner';
import ErrorMessage from '../UI/ErrorMessage';

type ViewMode = 'grid' | 'list';

const StudentEnrollmentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'enroll' | 'enrolled'>('enrolled');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Fetch current semester
  const {
    data: semesterInfo,
    isLoading: semesterLoading,
    error: semesterError,
  } = useCurrentSemester();

  // Fetch enrollment stats
  const { stats, isLoading: statsLoading } = useEnrollmentStats();

  // Loading state
  if (semesterLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" message="Loading your enrollment information..." />
      </div>
    );
  }

  // Error state
  if (semesterError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage
          title="Failed to Load Enrollment Information"
          message="We couldn't load your enrollment information. Please try again."
          error={semesterError}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-600 mt-1">
            Manage your course enrollments and track your learning progress
          </p>
        </div>
      </div>

      {/* Semester Info Card */}
      {semesterInfo && <SemesterInfoCard semesterInfo={semesterInfo} />}

      {/* Stats Cards */}
      {stats && <EnrollmentStatsCards stats={stats} isLoading={statsLoading} />}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('enrolled')}
              className={`
                flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors
                ${
                  activeTab === 'enrolled'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <BookOpen className="w-5 h-5" />
              Enrolled Subjects
              {stats && (
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {stats.enrolledSubjects}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('enroll')}
              className={`
                flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors
                ${
                  activeTab === 'enroll'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <Plus className="w-5 h-5" />
              Enroll in Subjects
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'enrolled' && (
            <div>
              {/* View Mode Toggle */}
              <div className="flex justify-end mb-4">
                <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                      ${
                        viewMode === 'grid'
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Grid className="w-4 h-4" />
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                      ${
                        viewMode === 'list'
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <List className="w-4 h-4" />
                    List
                  </button>
                </div>
              </div>

              {/* Enrolled Subjects List */}
              <EnrolledSubjectsList viewMode={viewMode} />
            </div>
          )}

          {activeTab === 'enroll' && semesterInfo && (
            <SubjectEnrollmentSection
              semesterNumber={semesterInfo.currentSemester}
              academicYearId={semesterInfo.academicYearId}
            />
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Need Help with Enrollment?
            </h3>
            <p className="text-blue-800 mb-4">
              If you have questions about subject enrollment, prerequisites, or course content,
              please contact your academic advisor or department office.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-blue-700">
                <Calendar className="w-4 h-4" />
                <span>Enrollment Period: {semesterInfo?.semesterStartDate} - {semesterInfo?.semesterEndDate}</span>
              </div>
              <div className="flex items-center gap-2 text-blue-700">
                <Award className="w-4 h-4" />
                <span>Current Semester: {semesterInfo?.currentSemester}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentEnrollmentDashboard;

