import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap, UserCheck, BookOpen, Users, TrendingUp, Calendar, Upload, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ApiService } from '../../services/api';

interface StaffDashboardProps {
  onNavigate: (tab: string) => void;
}

const StaffDashboard: React.FC<StaffDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  // Use staff-specific API endpoint
  const {
    data: staffDashboardData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['staff-dashboard', user?.id],
    queryFn: () => ApiService.getStaffDashboardData(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!user?.id && user?.role === 'staff',
    refetchOnWindowFocus: false,
    refetchOnMount: true
  });

  const [stats, setStats] = useState({
    assignedSections: 0,
    totalStudents: 0,
    studentsWithCourses: 0,
    recentSubmissions: 0,
    submissionCompletionRate: 0
  });

  useEffect(() => {
    if (staffDashboardData) {
      setStats({
        assignedSections: staffDashboardData.statistics?.assignedSections || 0,
        totalStudents: staffDashboardData.statistics?.totalStudents || 0,
        studentsWithTrees: staffDashboardData.statistics?.studentsWithTrees || 0,
        recentUploads: staffDashboardData.statistics?.recentUploads || 0,
        uploadCompletionRate: staffDashboardData.statistics?.uploadCompletionRate || 0
      });
    }
  }, [staffDashboardData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <p className="text-red-800">Failed to load staff dashboard data. Please try again.</p>
        </div>
      </div>
    );
  }

  const recentActivity = staffDashboardData?.recentActivity || [];
  const assignedSections = staffDashboardData?.assignedSections || [];
  const studentsWithMissingUploads = staffDashboardData?.studentsWithMissingUploads || [];

  const statCards = [
    {
      title: 'Assigned Sections',
      value: stats.assignedSections,
      icon: BookOpen,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'My Students',
      value: stats.totalStudents,
      icon: GraduationCap,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Students with Courses',
      value: stats.studentsWithCourses,
      icon: UserCheck,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Submission Rate',
      value: `${stats.submissionCompletionRate}%`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="p-3 sm:p-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Staff Dashboard</h1>
        <p className="text-gray-600 text-sm sm:text-base">Welcome back! Here's your class overview.</p>
        {user?.classInCharge && (
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Class In Charge: {user.classInCharge}</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`${stat.bgColor} p-4 sm:p-6 rounded-xl border border-gray-100`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs sm:text-sm font-medium">{stat.title}</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-2 sm:p-3 rounded-lg`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Activity</h3>
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div>{activity.description}</div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-gray-500 text-sm">No recent activity</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => onNavigate('bulk-upload-students')}
              className="w-full p-4 text-left bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Upload className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-900">Bulk Upload Students</p>
                  <p className="text-sm text-purple-600">Upload multiple students via CSV file</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => onNavigate('students')}
              className="w-full p-4 text-left bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Add Students</p>
                  <p className="text-sm text-blue-600">Register new students to your class</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => onNavigate('my-students')}
              className="w-full p-4 text-left bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">View My Students</p>
                  <p className="text-sm text-blue-600">Monitor your class students</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => onNavigate('student-requests')}
              className="w-full p-4 text-left bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <UserCheck className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-900">Review Requests</p>
                  <p className="text-sm text-orange-600">Approve student registrations</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;