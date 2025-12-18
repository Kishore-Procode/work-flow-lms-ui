import React from 'react';
import {
  UserGroupIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  BookOpenIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  UsersIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { ApiService } from '../../services/api';
import ModernDashboardCard from './ModernDashboardCard';

const ModernAdminDashboard: React.FC = () => {
  // Fetch dashboard overview data - working API endpoint
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin-dashboard-overview'],
    queryFn: () => ApiService.getDashboardOverview(),
  });

  // Extract data with proper typing
  const overview = (dashboardData as any)?.overview || {
    totalUsers: 0,
    totalColleges: 0,
    totalDepartments: 0,
    totalresources: 0,
  };

  const users = (dashboardData as any)?.users || { byRole: {}, byStatus: {} };
  const colleges = (dashboardData as any)?.colleges || { byStatus: {}, withPrincipal: 0, withoutPrincipal: 0 };
  const departments = (dashboardData as any)?.departments || { withHOD: 0, withoutHOD: 0, totalStudents: 0, totalStaff: 0 };
  const resources = (dashboardData as any)?.resources || { byStatus: {}, assigned: 0, unassigned: 0 };

  // Calculate additional metrics
  const studentCount = users.byRole?.student || users.byRole?.Student || 0;
  const staffCount = (users.byRole?.staff || users.byRole?.Staff || 0) + (users.byRole?.faculty || users.byRole?.Faculty || 0);
  const hodCount = users.byRole?.hod || users.byRole?.HOD || 0;
  const principalCount = users.byRole?.principal || users.byRole?.Principal || 0;
  const activeUsers = users.byStatus?.active || users.byStatus?.Active || 0;
  const activeColleges = colleges.byStatus?.active || colleges.byStatus?.Active || 0;

  if (error) {
    return (
      <div className="container-xl">
        <div className="card border-l-4 border-l-error-500">
          <div className="card-body">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-heading-4 text-neutral-900 dark:text-neutral-100 mb-2">
                  Error Loading Dashboard
                </h3>
                <p className="text-body text-neutral-600 dark:text-neutral-400 mb-4">
                  {error.message}
                </p>
                <button onClick={() => refetch()} className="btn-error btn-sm">
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-heading-1 text-neutral-900 dark:text-neutral-100">
            Admin Dashboard
          </h1>
          <p className="text-body text-neutral-600 dark:text-neutral-400 mt-1">
            System-wide overview of colleges, students, and course enrollments
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn-ghost btn-sm"
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ModernDashboardCard
          title="Total Colleges"
          value={overview.totalColleges}
          icon={BuildingOfficeIcon}
          color="primary"
          loading={isLoading}
          subtitle={`${activeColleges} active colleges`}
        />
        <ModernDashboardCard
          title="Total Users"
          value={overview.totalUsers}
          icon={UserGroupIcon}
          color="secondary"
          loading={isLoading}
          subtitle={`${activeUsers} active users`}
        />
        <ModernDashboardCard
          title="Total Students"
          value={studentCount}
          icon={AcademicCapIcon}
          color="success"
          loading={isLoading}
          subtitle={`${departments.totalStudents || studentCount} in departments`}
        />
        <ModernDashboardCard
          title="Learning Resources"
          value={overview.totalresources}
          icon={BookOpenIcon}
          color="academic"
          loading={isLoading}
          subtitle={`${resources.assigned || 0} assigned`}
        />
      </div>

      {/* User Role Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border-blue-200 dark:border-blue-700">
          <div className="card-body text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-300">
              {principalCount}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-200 font-medium">
              Principals
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-300 mt-1">
              {colleges.withPrincipal || 0} assigned
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 border-purple-200 dark:border-purple-700">
          <div className="card-body text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-300">
              {hodCount}
            </div>
            <div className="text-sm text-purple-700 dark:text-purple-200 font-medium">
              HODs
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-300 mt-1">
              {departments.withHOD || 0} assigned
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border-green-200 dark:border-green-700">
          <div className="card-body text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-300">
              {staffCount}
            </div>
            <div className="text-sm text-green-700 dark:text-green-200 font-medium">
              Staff/Faculty
            </div>
            <div className="text-xs text-green-600 dark:text-green-300 mt-1">
              {departments.totalStaff || staffCount} total
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 border-orange-200 dark:border-orange-700">
          <div className="card-body text-center">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-300">
              {overview.totalDepartments}
            </div>
            <div className="text-sm text-orange-700 dark:text-orange-200 font-medium">
              Departments
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-300 mt-1">
              {departments.withoutHOD || 0} need HOD
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* College Status Breakdown */}
        <div className="card">
          <div className="card-header bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900 dark:to-primary-800">
            <div className="flex items-center space-x-2">
              <BuildingOfficeIcon className="w-5 h-5 text-primary-600 dark:text-primary-300" />
              <h3 className="text-heading-4 text-neutral-900 dark:text-neutral-100">
                College Status
              </h3>
            </div>
          </div>
          <div className="card-body space-y-4">
            <div className="space-y-3">
              {Object.entries(colleges.byStatus || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      status.toLowerCase() === 'active' ? 'bg-green-500' :
                      status.toLowerCase() === 'inactive' ? 'bg-red-500' :
                      status.toLowerCase() === 'pending' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`}></div>
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 capitalize">
                      {status}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    {count as number}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">
                  <CheckCircleIcon className="w-4 h-4 inline mr-1" />
                  With Principal
                </span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {colleges.withPrincipal || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-neutral-600 dark:text-neutral-400">
                  <XCircleIcon className="w-4 h-4 inline mr-1" />
                  Without Principal
                </span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {colleges.withoutPrincipal || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* User Status Breakdown */}
        <div className="card">
          <div className="card-header bg-gradient-to-r from-secondary-50 to-secondary-100 dark:from-secondary-900 dark:to-secondary-800">
            <div className="flex items-center space-x-2">
              <UsersIcon className="w-5 h-5 text-secondary-600 dark:text-secondary-300" />
              <h3 className="text-heading-4 text-neutral-900 dark:text-neutral-100">
                User Status
              </h3>
            </div>
          </div>
          <div className="card-body space-y-4">
            <div className="space-y-3">
              {Object.entries(users.byStatus || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      status.toLowerCase() === 'active' ? 'bg-green-500' :
                      status.toLowerCase() === 'inactive' ? 'bg-red-500' :
                      status.toLowerCase() === 'suspended' ? 'bg-orange-500' :
                      status.toLowerCase() === 'pending' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`}></div>
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 capitalize">
                      {status}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    {count as number}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary-600 dark:text-secondary-400">
                  {((activeUsers / overview.totalUsers) * 100 || 0).toFixed(1)}%
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                  User Activation Rate
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resources Breakdown */}
        <div className="card">
          <div className="card-header bg-gradient-to-r from-academic-50 to-academic-100 dark:from-academic-900 dark:to-academic-800">
            <div className="flex items-center space-x-2">
              <BookOpenIcon className="w-5 h-5 text-academic-600 dark:text-academic-300" />
              <h3 className="text-heading-4 text-neutral-900 dark:text-neutral-100">
                Learning Resources
              </h3>
            </div>
          </div>
          <div className="card-body space-y-4">
            <div className="space-y-3">
              {Object.entries(resources.byStatus || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      status.toLowerCase() === 'published' ? 'bg-green-500' :
                      status.toLowerCase() === 'draft' ? 'bg-yellow-500' :
                      status.toLowerCase() === 'archived' ? 'bg-gray-500' :
                      'bg-blue-500'
                    }`}></div>
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 capitalize">
                      {status}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    {count as number}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-neutral-600 dark:text-neutral-400">
                  <CheckCircleIcon className="w-4 h-4 inline mr-1" />
                  Assigned
                </span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {resources.assigned || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">
                  <ClockIcon className="w-4 h-4 inline mr-1" />
                  Unassigned
                </span>
                <span className="font-semibold text-orange-600 dark:text-orange-400">
                  {resources.unassigned || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Department & Resource Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Details */}
        <div className="card">
          <div className="card-header bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800">
            <div className="flex items-center space-x-2">
              <BuildingLibraryIcon className="w-5 h-5 text-purple-600 dark:text-purple-300" />
              <h3 className="text-heading-4 text-neutral-900 dark:text-neutral-100">
                Department Overview
              </h3>
            </div>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {departments.withHOD || 0}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  With HOD
                </div>
                <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                  {((departments.withHOD || 0) / (overview.totalDepartments || 1) * 100).toFixed(1)}% Coverage
                </div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {departments.withoutHOD || 0}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  Without HOD
                </div>
                <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                  Needs Assignment
                </div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {departments.totalStudents || 0}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  Total Students
                </div>
                <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                  Across All Departments
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {departments.totalStaff || 0}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  Total Staff
                </div>
                <div className="mt-2 text-xs text-purple-600 dark:text-purple-400">
                  Teaching & Support
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  Average Students per Department
                </span>
                <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  {Math.round((departments.totalStudents || 0) / (overview.totalDepartments || 1))}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  Average Staff per Department
                </span>
                <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  {Math.round((departments.totalStaff || 0) / (overview.totalDepartments || 1))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Resource Categories */}
        <div className="card">
          <div className="card-header bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800">
            <div className="flex items-center space-x-2">
              <ChartBarIcon className="w-5 h-5 text-orange-600 dark:text-orange-300" />
              <h3 className="text-heading-4 text-neutral-900 dark:text-neutral-100">
                Resource Categories
              </h3>
            </div>
          </div>
          <div className="card-body">
            {resources.bycategory && (Array.isArray(resources.bycategory) ? resources.bycategory.length > 0 : Object.keys(resources.bycategory).length > 0) ? (
              <div className="space-y-3">
                {Array.isArray(resources.bycategory) ? (
                  // Handle array format: [{category, count}, ...]
                  resources.bycategory.map((item: any) => {
                    const category = item.category || 'Unknown';
                    const count = Number(item.count) || 0;
                    const percentage = (count / (overview.totalresources || 1)) * 100;
                    return (
                      <div key={category}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 capitalize">
                            {String(category).replace(/_/g, ' ')}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                              {count}
                            </span>
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">
                              ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  // Handle object format: {category: count, ...}
                  Object.entries(resources.bycategory).map(([category, count]) => {
                    const percentage = ((count as number) / (overview.totalresources || 1)) * 100;
                    return (
                      <div key={category}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 capitalize">
                            {category.replace(/_/g, ' ')}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                              {count as number}
                            </span>
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">
                              ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpenIcon className="w-12 h-12 mx-auto text-neutral-400 dark:text-neutral-600 mb-3" />
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  No category data available
                </p>
              </div>
            )}
            <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {((resources.assigned || 0) / (overview.totalresources || 1) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                    Assignment Rate
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {Math.round((overview.totalresources || 0) / (overview.totalColleges || 1))}
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                    Resources per College
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Summary */}
      <div className="card bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-neutral-800 dark:to-neutral-900">
        <div className="card-body">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                {((activeColleges / overview.totalColleges) * 100 || 0).toFixed(1)}%
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                College Activation
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-secondary-600 dark:text-secondary-400">
                {Math.round((overview.totalUsers || 0) / (overview.totalColleges || 1))}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                Users per College
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-success-600 dark:text-success-400">
                {Math.round((studentCount || 0) / (overview.totalDepartments || 1))}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                Students per Department
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-academic-600 dark:text-academic-400">
                {((colleges.withPrincipal || 0) / (overview.totalColleges || 1) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                Principal Assignment
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernAdminDashboard;
