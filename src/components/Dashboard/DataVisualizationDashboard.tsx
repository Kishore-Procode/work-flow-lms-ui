import React, { useState, useEffect } from 'react';
import { BarChart3, LineChart, PieChart, TrendingUp, Activity, Users, TreePine } from 'lucide-react';
import { LineChart as CustomLineChart, BarChart as CustomBarChart, PieChart as CustomPieChart } from '../Charts/InteractiveCharts';
import { ApiService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface DashboardData {
  treeGrowthData: Array<{ label: string; value: number; color?: string }>;
  departmentData: Array<{ label: string; value: number; color?: string }>;
  healthStatusData: Array<{ label: string; value: number; color?: string }>;
  monthlyProgressData: Array<{ label: string; value: number; color?: string }>;
  studentEngagementData: Array<{ label: string; value: number; color?: string }>;
}

const DataVisualizationDashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [stats, setStats] = useState({
    totalTrees: 0,
    activeStudents: 0,
    photosUploaded: 0,
    avgGrowth: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, [selectedTimeframe]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load actual data from API
      const [treesData, usersData] = await Promise.all([
        ApiService.getTrees().catch(() => ({ data: [] })),
        ApiService.getUsers().catch(() => ({ data: [] }))
      ]);

      // Handle paginated responses
      const trees = Array.isArray(treesData) ? treesData : treesData?.data || [];
      const users = Array.isArray(usersData) ? usersData : usersData?.data || [];

      // Calculate stats
      const studentUsers = users.filter((u: any) => u.role === 'student');
      const assignedTrees = trees.filter((t: any) => t.assignedTo || t.assigned_to);
      
      setStats({
        totalTrees: trees.length,
        activeStudents: studentUsers.length,
        photosUploaded: 0, // Would need photos API
        avgGrowth: trees.length > 0 ? Math.round(trees.reduce((sum: number, t: any) => sum + (t.currentHeight || t.current_height || 0), 0) / trees.length) : 0
      });

      // Process data for visualizations
      const processedData: DashboardData = {
        treeGrowthData: generateTreeGrowthData(trees),
        departmentData: generateDepartmentData(trees),
        healthStatusData: generateHealthStatusData(trees),
        monthlyProgressData: generateMonthlyProgressData([]), // No photos API available
        studentEngagementData: generateStudentEngagementData(users, [])
      };

      setDashboardData(processedData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Generate empty data structure
      setDashboardData({
        treeGrowthData: [],
        departmentData: [],
        healthStatusData: [],
        monthlyProgressData: [],
        studentEngagementData: []
      });
      setStats({
        totalTrees: 0,
        activeStudents: 0,
        photosUploaded: 0,
        avgGrowth: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTreeGrowthData = (trees: any[]) => {
    // Generate growth data over the last 6 months
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: date.toLocaleDateString('en-US', { month: 'short' }),
        month: date.getMonth(),
        year: date.getFullYear()
      });
    }

    return months.map(({ label, month, year }) => {
      const treesPlantedInMonth = trees.filter(tree => {
        if (!tree.plantedDate && !tree.planted_date) return false;
        const plantedDate = new Date(tree.plantedDate || tree.planted_date);
        return plantedDate.getMonth() === month && plantedDate.getFullYear() === year;
      }).length;

      return {
        label,
        value: treesPlantedInMonth,
        color: '#10b981'
      };
    });
  };

  const generateDepartmentData = (trees: any[]) => {
    // Group trees by department with real data
    const departmentCounts: { [key: string]: number } = {};

    trees.forEach(tree => {
      const deptName = tree.departmentName || tree.department_name || 'Unknown';
      departmentCounts[deptName] = (departmentCounts[deptName] || 0) + 1;
    });

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];
    return Object.entries(departmentCounts)
      .sort(([,a], [,b]) => b - a) // Sort by count descending
      .slice(0, 7) // Top 7 departments
      .map(([dept, count], index) => ({
        label: dept,
        value: count,
        color: colors[index % colors.length]
      }));
  };

  const generateHealthStatusData = (trees: any[]) => {
    // Calculate health status based on real tree data
    const statusCounts = { healthy: 0, fair: 0, poor: 0, unknown: 0 };

    trees.forEach(tree => {
      const status = tree.status || tree.health_status;
      if (status === 'healthy' || status === 'good' || status === 'excellent') {
        statusCounts.healthy++;
      } else if (status === 'fair' || status === 'moderate') {
        statusCounts.fair++;
      } else if (status === 'poor' || status === 'bad') {
        statusCounts.poor++;
      } else {
        statusCounts.unknown++;
      }
    });

    return [
      { label: 'Healthy', value: statusCounts.healthy, color: '#10b981' },
      { label: 'Fair', value: statusCounts.fair, color: '#f59e0b' },
      { label: 'Poor', value: statusCounts.poor, color: '#ef4444' },
      { label: 'Unknown', value: statusCounts.unknown, color: '#6b7280' }
    ].filter(item => item.value > 0); // Only show categories with data
  };

  const generateMonthlyProgressData = (photos: any[]) => {
    // Generate photo upload data over the last 6 months
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: date.toLocaleDateString('en-US', { month: 'short' }),
        month: date.getMonth(),
        year: date.getFullYear()
      });
    }

    return months.map(({ label, month, year }) => {
      const photosInMonth = photos.filter(photo => {
        const uploadDate = new Date(photo.uploadDate || photo.upload_date || photo.createdAt || photo.created_at);
        return uploadDate.getMonth() === month && uploadDate.getFullYear() === year;
      }).length;

      return {
        label,
        value: photosInMonth,
        color: '#8b5cf6'
      };
    });
  };

  const generateStudentEngagementData = (users: any[], photos: any[]) => {
    const students = users.filter(u => u.role === 'student');
    const studentsWithPhotos = new Set(photos.map(photo => photo.studentId || photo.student_id));
    const activeStudents = students.filter(student => studentsWithPhotos.has(student.id));

    return [
      { label: 'Active Students', value: activeStudents.length, color: '#10b981' },
      { label: 'Inactive Students', value: students.length - activeStudents.length, color: '#ef4444' }
    ];
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="lg:p-6 md:p-4 p-3 space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-3 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1 lg:mb-2">Data Visualization Dashboard</h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">Interactive charts and analytics for tree monitoring program</p>
        </div>

        {/* Timeframe Selector */}
        <div className="w-full lg:w-auto flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {['week', 'month', 'year'].map(timeframe => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe as any)}
              className={`flex-1 lg:flex-none px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium rounded-md transition-colors ${
                selectedTimeframe === timeframe
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 lg:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">Total Trees</p>
              <p className="text-lg lg:text-3xl font-bold text-gray-900 dark:text-white">{stats.totalTrees.toLocaleString()}</p>
              <p className="text-xs lg:text-sm text-blue-600 flex items-center mt-1">
                <TreePine className="w-3 lg:w-4 h-3 lg:h-4 mr-1" />
                <span className="hidden sm:inline">Monitored trees</span>
                <span className="sm:hidden">Trees</span>
              </p>
            </div>
            <TreePine className="w-8 lg:w-12 h-8 lg:h-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 lg:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">Active Students</p>
              <p className="text-lg lg:text-3xl font-bold text-gray-900 dark:text-white">{stats.activeStudents.toLocaleString()}</p>
              <p className="text-xs lg:text-sm text-blue-600 flex items-center mt-1">
                <Users className="w-3 lg:w-4 h-3 lg:h-4 mr-1" />
                <span className="hidden sm:inline">Registered students</span>
                <span className="sm:hidden">Students</span>
              </p>
            </div>
            <Users className="w-8 lg:w-12 h-8 lg:h-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 lg:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">Photos Uploaded</p>
              <p className="text-lg lg:text-3xl font-bold text-gray-900 dark:text-white">{stats.photosUploaded.toLocaleString()}</p>
              <p className="text-xs lg:text-sm text-gray-500 flex items-center mt-1">
                <Activity className="w-3 lg:w-4 h-3 lg:h-4 mr-1" />
                <span className="hidden sm:inline">API not available</span>
                <span className="sm:hidden">N/A</span>
              </p>
            </div>
            <Activity className="w-8 lg:w-12 h-8 lg:h-12 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 lg:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">Avg Height</p>
              <p className="text-lg lg:text-3xl font-bold text-gray-900 dark:text-white">{stats.avgGrowth}cm</p>
              <p className="text-xs lg:text-sm text-blue-600 flex items-center mt-1">
                <TrendingUp className="w-3 lg:w-4 h-3 lg:h-4 mr-1" />
                <span className="hidden sm:inline">Average tree height</span>
                <span className="sm:hidden">Avg</span>
              </p>
            </div>
            <BarChart3 className="w-8 lg:w-12 h-8 lg:h-12 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
        {/* Tree Growth Over Time */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 lg:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <LineChart className="w-4 lg:w-5 h-4 lg:h-5 mr-2 text-blue-600" />
              <span className="hidden sm:inline">Tree Growth Trend</span>
              <span className="sm:hidden">Growth</span>
            </h3>
          </div>
          {dashboardData && (
            <CustomLineChart
              data={dashboardData.treeGrowthData}
              height={200}
              showGrid={true}
              animate={true}
            />
          )}
        </div>

        {/* Department Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 lg:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <BarChart3 className="w-4 lg:w-5 h-4 lg:h-5 mr-2 text-blue-600" />
              <span className="hidden sm:inline">Trees by Department</span>
              <span className="sm:hidden">Departments</span>
            </h3>
          </div>
          {dashboardData && (
            <CustomBarChart
              data={dashboardData.departmentData}
              height={200}
            />
          )}
        </div>

        {/* Health Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 lg:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <PieChart className="w-4 lg:w-5 h-4 lg:h-5 mr-2 text-purple-600" />
              <span className="hidden sm:inline">Tree Health Status</span>
              <span className="sm:hidden">Health</span>
            </h3>
          </div>
          {dashboardData && (
            <CustomPieChart
              data={dashboardData.healthStatusData}
            />
          )}
        </div>

        {/* Monthly Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 lg:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <h3 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Activity className="w-4 lg:w-5 h-4 lg:h-5 mr-2 text-orange-600" />
              <span className="hidden sm:inline">Monthly Photo Uploads</span>
              <span className="sm:hidden">Photos</span>
            </h3>
          </div>
          {dashboardData && (
            <CustomBarChart
              data={dashboardData.monthlyProgressData}
              height={200}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DataVisualizationDashboard;
