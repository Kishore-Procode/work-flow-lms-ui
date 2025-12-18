import React from 'react';
import {
  Users,
  Building,
  GraduationCap,
  UserPlus,
  TrendingUp,
  Calendar,
  RefreshCw,
  Upload,
  Award,
  BarChart3,
  Target,
  Activity,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  Medal,
  AlertTriangle
} from 'lucide-react';
import { useDashboardData } from '../../hooks/useDashboardData';
import { DepartmentData } from '../../types/dashboard';
import DepartmentComparisonChart from '../Charts/DepartmentComparisonChart';

interface PrincipalDashboardProps {
  onNavigate: (tab: string) => void;
}

const PrincipalDashboard: React.FC<PrincipalDashboardProps> = ({ onNavigate }) => {
  const { stats, recentActivity, departmentData, loading, error, refresh } = useDashboardData();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-40 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-80 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Try Again'}</span>
          </button>
        </div>
      </div>
    );
  }

  // Calculate enhanced real-time statistics from department data
  const totalCoursesEnrolled = departmentData.reduce((sum: number, dept: DepartmentData) => sum + dept.participated, 0);
  const totalAvailableCourses = departmentData.reduce((sum: number, dept: DepartmentData) => sum + (dept.availableResources || 0), 0);
  const totalCoursesInSystem = departmentData.reduce((sum: number, dept: DepartmentData) => sum + (dept.totalResources || 0), 0);
  const totalStudents = stats.totalStudents;
  const completionRate = totalStudents > 0 ? Math.round((totalCoursesEnrolled / totalStudents) * 100) : 0;
  const pendingStudents = Math.max(0, totalStudents - totalCoursesEnrolled);

  // Calculate average department performance
  const avgDeptPerformance = departmentData.length > 0
    ? Math.round(departmentData.reduce((sum: number, dept: DepartmentData) => sum + dept.percentage, 0) / departmentData.length)
    : 0;

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: GraduationCap,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      change: 'Active',
      changeType: 'stable' as const,
      subtitle: `Across ${stats.totalDepartments} departments`
    },
    {
      title: 'Courses Assigned',
      value: totalCoursesEnrolled,
      icon: BookOpen,
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      change: `${totalAvailableCourses} Available`,
      changeType: 'up' as const,
      subtitle: `${totalCoursesInSystem} total in system`
    },
    {
      title: 'Participation Rate',
      value: `${completionRate}%`,
      icon: Target,
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      change: completionRate >= 80 ? 'Excellent' : completionRate >= 60 ? 'Good' : 'Needs Improvement',
      changeType: completionRate >= 80 ? 'up' : completionRate >= 60 ? 'stable' : 'down' as const,
      subtitle: `Avg dept: ${avgDeptPerformance}%`
    },
    {
      title: 'Pending Assignments',
      value: pendingStudents,
      icon: AlertCircle,
      color: 'bg-gradient-to-r from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      change: pendingStudents > 0 ? 'Action Required' : 'All Assigned',
      changeType: pendingStudents > 0 ? 'down' : 'up' as const,
      subtitle: pendingStudents > 0 ? 'Students without courses' : 'Complete coverage'
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl p-4 sm:p-6 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">🏛️ Principal Dashboard</h1>
            <p className="text-blue-100 mb-3 sm:mb-4 text-sm sm:text-base">
              Welcome back! Monitor your college's learning programs and manage institutional operations.
            </p>
          </div>

        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center space-x-1 text-xs">
                  {stat.changeType === 'up' && <ArrowUpRight className="w-3 h-3 text-blue-500" />}
                  {stat.changeType === 'down' && <ArrowDownRight className="w-3 h-3 text-red-500" />}
                  <span className={`font-medium ${stat.changeType === 'up' ? 'text-blue-600' :
                    stat.changeType === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
                {stat.subtitle && (
                  <p className="text-xs text-gray-500">{stat.subtitle}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Department Comparison Chart - Following Wireframe Design */}
      <DepartmentComparisonChart data={departmentData} />


      {/* Department Performance Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">Department Performance Overview</h3>
            <p className="text-gray-600 text-sm">Top and lowest performing departments by completion rate</p>
          </div>
          <BarChart3 className="w-5 h-5 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top-Performing Departments */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
              <Medal className="w-4 h-4 text-yellow-500" />
              Top-Performing Departments
            </h4>
            <div className="space-y-3">
              {departmentData
                .sort((a, b) => b.percentage - a.percentage)
                .slice(0, 3)
                .map((dept, index) => (
                  <div key={dept.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-yellow-500 text-white rounded-full text-sm font-bold">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{dept.name}</div>
                        <div className="text-sm text-gray-600">{dept.percentage}% complete</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Medal className="w-5 h-5 text-yellow-500" />
                      <span className="text-sm font-medium text-blue-700">{dept.percentage}%</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Lowest-Performing Departments */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Lowest-Performing Departments
            </h4>
            <div className="space-y-3">
              {departmentData
                .sort((a, b) => a.percentage - b.percentage)
                .slice(0, 3)
                .map((dept, index) => (
                  <div key={dept.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-orange-500 text-white rounded-full text-sm font-bold">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{dept.name}</div>
                        <div className="text-sm text-gray-600">{dept.percentage}% complete</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      <span className="text-sm font-medium text-orange-700">{dept.percentage}%</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Department Performance Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">Department Performance Summary</h3>
            <p className="text-gray-600 text-sm">Detailed analytics for each department</p>
          </div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-gray-400" />
            <button className="text-gray-400 hover:text-gray-600 p-1">
              <span className="text-lg">⋯</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                <th className="pb-3 font-medium">Department</th>
                <th className="pb-3 font-medium">HOD</th>
                <th className="pb-3 font-medium">Students</th>
                <th className="pb-3 font-medium">Courses Assigned</th>
                <th className="pb-3 font-medium">Available</th>
                <th className="pb-3 font-medium">Participation</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {departmentData.map((dept, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${dept.percentage >= 90 ? 'bg-blue-500' :
                        dept.percentage >= 70 ? 'bg-yellow-500' :
                          dept.percentage >= 50 ? 'bg-orange-500' : 'bg-red-500'
                        }`} />
                      <div>
                        <span className="font-medium text-gray-900">{dept.name}</span>
                        <div className="text-xs text-gray-500">
                          {dept.totalResources} total resources
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-gray-700">
                    <div className="text-gray-900 font-medium">{dept.hodName}</div>

                  </td>
                  <td className="py-4">
                    <div className="text-gray-900 font-medium">{dept.students}</div>
                    <div className="text-xs text-gray-500">enrolled</div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900 font-medium">{dept.participated}</span>
                      <BookOpen className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-xs text-gray-500">assigned</div>
                  </td>
                  <td className="py-4">
                    <div className="text-gray-700 font-medium">{dept.availableResources || 0}</div>
                    <div className="text-xs text-gray-500">unassigned</div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${dept.percentage >= 90 ? 'bg-blue-100 text-blue-800' :
                        dept.percentage >= 70 ? 'bg-yellow-100 text-yellow-800' :
                          dept.percentage >= 50 ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                        }`}>
                        {dept.percentage}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4">
                    {(dept.students - dept.participated) > 0 ? (
                      <div className="flex items-center space-x-1 text-orange-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs">{dept.students - dept.participated} pending</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-blue-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs">Complete</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">Recent Activity</h3>
              <p className="text-gray-600 text-sm">Latest updates across your college</p>
            </div>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  {activity.type === 'course_assignment' ? (
                    <BookOpen className="w-4 h-4 text-blue-500" />
                  ) : activity.type === 'user_activity' ? (
                    <Users className="w-4 h-4 text-blue-500" />
                  ) : (
                    <UserPlus className="w-4 h-4 text-orange-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 mb-1">{activity.message}</p>
                  {activity.details && activity.type === 'course_assignment' && (
                    <div className="text-xs text-gray-600 mb-2">
                      Course: {activity.details.title} • Code: {activity.details.resourceCode}
                    </div>
                  )}
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span>{new Date(activity.timestamp).toLocaleDateString()}</span>
                    <span className={`px-2 py-1 rounded-full ${activity.status === 'active' ? 'bg-blue-100 text-blue-700' :
                      activity.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                      {activity.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${activity.type === 'course_assignment' ? 'bg-blue-50 text-blue-600' :
                      activity.type === 'user_activity' ? 'bg-blue-50 text-blue-600' :
                        'bg-orange-50 text-orange-600'
                      }`}>
                      {activity.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All Activity
            </button>
          </div>
        </div>

        {/* Enhanced Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">Quick Actions</h3>
              <p className="text-gray-600 text-sm">Common administrative tasks</p>
            </div>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            <button
              onClick={() => onNavigate('bulk-upload-staff')}
              className="w-full p-4 text-left bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl hover:from-orange-100 hover:to-red-100 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-orange-500 rounded-lg group-hover:bg-orange-600 transition-colors">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-orange-900">Bulk Upload Staff & HODs</p>
                  <p className="text-sm text-orange-700">Upload multiple staff members and HODs via CSV</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>

            <button
              onClick={() => onNavigate('invitations')}
              className="w-full p-4 text-left bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-emerald-100 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-500 rounded-lg group-hover:bg-blue-600 transition-colors">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-blue-900">Invite Staff</p>
                  <p className="text-sm text-blue-700">Send invitations to new staff members</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>

            <button
              onClick={() => onNavigate('departments')}
              className="w-full p-4 text-left bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-500 rounded-lg group-hover:bg-blue-600 transition-colors">
                  <Building className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-blue-900">Manage Departments</p>
                  <p className="text-sm text-blue-700">View and manage college departments</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>

            <button
              onClick={() => onNavigate('students')}
              className="w-full p-4 text-left bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl hover:from-purple-100 hover:to-violet-100 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-500 rounded-lg group-hover:bg-purple-600 transition-colors">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-purple-900">View Students</p>
                  <p className="text-sm text-purple-700">Monitor student registrations</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrincipalDashboard;