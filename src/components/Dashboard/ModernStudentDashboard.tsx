import React from 'react';
import {
  BookOpenIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import { useDashboardData, useRecentActivity } from '../../hooks/api/useDashboard';
import { useAuth } from '../../hooks/useAuth';
import { useEnrolledSubjects } from '../../hooks/api/useStudentEnrollment';
import ModernDashboardCard from './ModernDashboardCard';

const ModernStudentDashboard: React.FC = () => {
  const { user } = useAuth();

  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useDashboardData();

  const {
    data: recentActivity,
    isLoading: activityLoading,
  } = useRecentActivity();

  // Use the proper hook for enrolled subjects (same as desktop pages)
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useEnrolledSubjects();

  // Calculate progress metrics from enrollments using correct field names
  const enrollments = enrollmentsData?.enrollments || [];
  const totalCourses = enrollments.length;
  const completedCourses = enrollments.filter(
    (e: any) => e.status === 'completed'
  ).length;
  const inProgressCourses = enrollments.filter(
    (e: any) => e.status === 'active'
  ).length;
  const pendingCourses = enrollments.filter(
    (e: any) => e.status === 'not_started' || (!e.progressPercentage)
  ).length;

  const completionRate = totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0;

  if (dashboardError) {
    return (
      <div className="container-xl">
        <div className="alert alert-error">
          <h3 className="text-heading-4 mb-2">Error Loading Dashboard</h3>
          <p>{dashboardError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-xl space-y-6">
      {/* Welcome Header */}
      <div className="card bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 border-primary-200 dark:border-primary-800">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-heading-1 text-neutral-900 dark:text-neutral-100">
                Welcome back, {user?.firstName || user?.name}!
              </h1>
              <p className="text-body text-neutral-600 dark:text-neutral-400 mt-1">
                Here's your learning progress and upcoming activities
              </p>
            </div>
            <div className="hidden sm:block">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center">
                <BookOpenIcon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ModernDashboardCard
          title="Total Courses"
          value={totalCourses}
          subtitle="Enrolled courses"
          icon={BookOpenIcon}
          color="primary"
          loading={enrollmentsLoading}
        />
        <ModernDashboardCard
          title="Completed"
          value={completedCourses}
          subtitle={`${completionRate.toFixed(1)}% completion rate`}
          icon={CheckCircleIcon}
          color="success"
          loading={enrollmentsLoading}
          trend={completionRate > 75 ? {
            value: Math.round(completionRate - 75),
            label: 'above target',
            direction: 'up' as const,
          } : undefined}
        />
        <ModernDashboardCard
          title="In Progress"
          value={inProgressCourses}
          subtitle="Currently working on"
          icon={ClockIcon}
          color="warning"
          loading={enrollmentsLoading}
        />
        <ModernDashboardCard
          title="Not Started"
          value={pendingCourses}
          subtitle="Awaiting start"
          icon={ExclamationTriangleIcon}
          color="error"
          loading={enrollmentsLoading}
        />
      </div>

      {/* Progress Chart and Recent Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Overview */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-heading-4 text-neutral-900 dark:text-neutral-100">
                Learning Progress
              </h3>
              <ChartBarIcon className="w-5 h-5 text-neutral-500" />
            </div>
          </div>
          <div className="card-body">
            {enrollmentsLoading ? (
              <div className="space-y-4">
                <div className="skeleton-text w-full h-4"></div>
                <div className="skeleton-text w-3/4 h-4"></div>
                <div className="skeleton-text w-1/2 h-4"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Completion Rate */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-body-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Overall Completion
                    </span>
                    <span className="text-body-sm font-bold text-primary-600 dark:text-primary-400">
                      {completionRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${completionRate}%` }}
                    ></div>
                  </div>
                </div>

                {/* Status Breakdown */}
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center">
                    <div className="text-heading-4 font-bold text-success-600 dark:text-success-400">
                      {completedCourses}
                    </div>
                    <div className="text-caption text-neutral-500 dark:text-neutral-400">
                      Completed
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-heading-4 font-bold text-warning-600 dark:text-warning-400">
                      {inProgressCourses}
                    </div>
                    <div className="text-caption text-neutral-500 dark:text-neutral-400">
                      In Progress
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-heading-4 font-bold text-error-600 dark:text-error-400">
                      {pendingCourses}
                    </div>
                    <div className="text-caption text-neutral-500 dark:text-neutral-400">
                      Not Started
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Courses */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-heading-4 text-neutral-900 dark:text-neutral-100">
              My Courses
            </h3>
          </div>
          <div className="card-body">
            {enrollmentsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="skeleton w-10 h-10 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="skeleton-text w-3/4 mb-1"></div>
                      <div className="skeleton-text w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : enrollments.length === 0 ? (
              <div className="text-center py-8">
                <BookOpenIcon className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                <p className="text-body text-neutral-500 dark:text-neutral-400">
                  No courses enrolled yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {enrollments.slice(0, 5).map((course: any, index: number) => (
                  <div key={course.subject_id || index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center
                      ${course.completion_percentage >= 100 ? 'bg-success-100 dark:bg-success-800' :
                        course.completion_percentage > 0 ? 'bg-warning-100 dark:bg-warning-800' :
                          'bg-neutral-100 dark:bg-neutral-700'}
                    `}>
                      {course.completion_percentage >= 100 ? (
                        <CheckCircleIcon className="w-5 h-5 text-success-600 dark:text-success-400" />
                      ) : course.completion_percentage > 0 ? (
                        <ClockIcon className="w-5 h-5 text-warning-600 dark:text-warning-400" />
                      ) : (
                        <BookOpenIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {course.subject_name || 'Untitled Course'}
                      </p>
                      <p className="text-caption text-neutral-500 dark:text-neutral-400">
                        {course.completion_percentage?.toFixed(0) || 0}% complete
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Achievement Section */}
      {completionRate >= 80 && (
        <div className="card bg-gradient-to-r from-success-50 to-primary-50 dark:from-success-900/20 dark:to-primary-900/20 border-success-200 dark:border-success-800">
          <div className="card-body">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-primary-500 rounded-xl flex items-center justify-center">
                <TrophyIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-heading-4 text-neutral-900 dark:text-neutral-100">
                  Excellent Progress! 🎉
                </h3>
                <p className="text-body text-neutral-600 dark:text-neutral-400">
                  You've completed {completionRate.toFixed(1)}% of your enrolled courses. Keep up the great work!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentActivity && recentActivity.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-heading-4 text-neutral-900 dark:text-neutral-100">
              Recent Activity
            </h3>
          </div>
          <div className="card-body">
            {activityLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <div className="skeleton w-2 h-2 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="skeleton-text w-full mb-1"></div>
                      <div className="skeleton-text w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.slice(0, 5).map((activity: any, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm text-neutral-900 dark:text-neutral-100">
                        {activity.description}
                      </p>
                      <p className="text-caption text-neutral-500 dark:text-neutral-400 mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernStudentDashboard;
