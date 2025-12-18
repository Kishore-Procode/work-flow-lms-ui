import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Download,
  Calendar,
  Users,
  TreePine,
  Building,
  Filter,
  RefreshCw,
  Activity,
  Target,
  Award,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ApiService } from '../../services/api';
import { useReports, useReportAnalytics, useGenerateReport, useExportReport } from '../../hooks/api/useReports';
import Card, { StatCard } from '../UI/Card';
import LoadingSpinner from '../UI/LoadingSpinner';
import {
  LineChart,
  BarChart,
  DonutChart,
  MetricCard,
  ProgressRing
} from '../Charts/InteractiveCharts';
import { FadeIn, Stagger } from '../UI/Animations';

interface ReportData {
  overview: {
    totalStudents: number;
    totalTrees: number;
    assignedTrees: number;
    availableTrees: number;
    totalColleges: number;
    totalDepartments: number;
    activeUsers: number;
    completionRate: number;
  };
  treesBySpecies: { label: string; value: number; color?: string }[];
  treesByDepartment: { label: string; value: number; color?: string }[];
  assignmentProgress: { department: string; assigned: number; total: number; percentage: number }[];
  monthlyGrowth: { label: string; value: number }[];
  userEngagement: { label: string; value: number }[];
  healthMetrics: { label: string; value: number; color?: string }[];
  recentActivity: {
    date: string;
    activity: string;
    user: string;
    type: 'assignment' | 'upload' | 'registration';
  }[];
  predictions: {
    nextMonthAssignments: number;
    growthTrend: 'up' | 'down' | 'stable';
    riskFactors: string[];
  };
}

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [selectedTimeRange, setSelectedTimeRange] = useState('30');
  const [selectedCollege, setSelectedCollege] = useState('all');

  // React Query hooks for data fetching
  const { data: colleges = [] } = useQuery({
    queryKey: ['colleges'],
    queryFn: () => ApiService.getColleges(),
    staleTime: 1000 * 60 * 10, // 10 minutes
    select: (data) => Array.isArray(data) ? data : data?.data || [],
    enabled: false // Temporarily disabled until reports API is implemented
  });

  const reportFilters = useMemo(() => ({
    timeRange: selectedTimeRange,
    collegeId: selectedCollege !== 'all' ? selectedCollege : undefined,
    userRole: user?.role,
    userCollegeId: user?.collegeId
  }), [selectedTimeRange, selectedCollege, user?.role, user?.collegeId]);

  const { data: reportData, isLoading: loading, error } = useReports(reportFilters);

  // Generate report data from React Query results
  const processedReportData = useMemo(() => {
    if (!reportData) return null;

    // Process the report data based on filters and user role
    return reportData;
  }, [reportData]);

  const exportReport = () => {
    if (!reportData) return;

    const csvContent = [
      ['Metric', 'Value'],
      ['Total Students', reportData.overview.totalStudents],
      ['Total Trees', reportData.overview.totalTrees],
      ['Assigned Trees', reportData.overview.assignedTrees],
      ['Available Trees', reportData.overview.availableTrees],
      ['Assignment Rate', `${((reportData.overview.assignedTrees / reportData.overview.totalTrees) * 100).toFixed(1)}%`],
      [''],
      ['Trees by Species'],
      ...reportData.treesBySpecies.map(item => [item.species, item.count]),
      [''],
      ['Trees by Department'],
      ...reportData.treesByDepartment.map(item => [item.department, item.count])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tree-monitoring-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSpinner size="lg" text="Generating reports..." />
      </div>
    );
  }

  if (!reportData || error) {
    return (
      <div className="p-6">
        <Card className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Reports Module Under Development</h3>
          <p className="text-gray-600 mb-4">
            {error 
              ? 'The reports API endpoints are not yet implemented on the backend.'
              : 'Unable to generate reports at this time.'
            }
          </p>
          <p className="text-sm text-gray-500">
            Please contact your system administrator or check back later.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="mr-3 text-blue-600" />
            Reports & Analytics
          </h1>
          <p className="text-gray-600 mt-2">
            Comprehensive insights into the tree monitoring program
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 lg:mt-0">
          <button
            onClick={loadReportData}
            disabled={loading}
            className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={exportReport}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {user?.role === 'admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
                <select
                  value={selectedCollege}
                  onChange={(e) => setSelectedCollege(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Colleges</option>
                  {colleges.map(college => (
                    <option key={college.id} value={college.id}>{college.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 3 months</option>
                <option value="365">Last year</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Overview Stats */}
      <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Students"
          value={reportData.overview.totalStudents}
          change={{
            value: '+12% from last month',
            type: 'increase'
          }}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Trees Assigned"
          value={reportData.overview.assignedTrees}
          change={{
            value: `${reportData.overview.completionRate.toFixed(1)}% completion`,
            type: reportData.overview.completionRate > 70 ? 'increase' : 'neutral'
          }}
          icon={TreePine}
          color="blue"
        />
        <MetricCard
          title="Active Users"
          value={reportData.overview.activeUsers}
          change={{
            value: '+8% engagement',
            type: 'increase'
          }}
          icon={Activity}
          color="purple"
        />
        <MetricCard
          title="Success Rate"
          value={`${reportData.overview.completionRate.toFixed(1)}%`}
          change={{
            value: reportData.predictions.growthTrend === 'up' ? '+5.2%' : 'Stable',
            type: reportData.predictions.growthTrend === 'up' ? 'increase' : 'neutral'
          }}
          icon={Target}
          color="yellow"
        />
      </Stagger>

      {/* Advanced Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Trend */}
        <FadeIn className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                Monthly Growth Trend
              </h3>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Zap className="w-4 h-4 mr-1" />
                Live Data
              </div>
            </div>
            <LineChart data={reportData.monthlyGrowth} height={250} />
          </Card>
        </FadeIn>

        {/* Completion Rate */}
        <FadeIn>
          <Card className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Overall Progress
            </h3>
            <ProgressRing
              percentage={reportData.overview.completionRate}
              size={150}
              label="Completion"
            />
            <div className="mt-4 space-y-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {reportData.overview.assignedTrees} of {reportData.overview.totalStudents} students
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                Target: 85% by year end
              </div>
            </div>
          </Card>
        </FadeIn>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Trees by Species */}
        <FadeIn>
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-blue-500" />
              Tree Species Distribution
            </h3>
            <DonutChart data={reportData.treesBySpecies} size={200} />
          </Card>
        </FadeIn>

        {/* Department Progress */}
        <FadeIn>
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-purple-500" />
              Department Progress
            </h3>
            <BarChart data={reportData.assignmentProgress.map(item => ({
              label: item.department.split(' ')[0], // Shorten labels
              value: item.percentage
            }))} />
          </Card>
        </FadeIn>

        {/* Tree Health */}
        <FadeIn>
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-500" />
              Tree Health Status
            </h3>
            <DonutChart data={reportData.healthMetrics} size={200} />
          </Card>
        </FadeIn>
      </div>

      {/* Predictions & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FadeIn>
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Predictive Insights
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-blue-800 dark:text-blue-200">Next Month Projection:</span>
                <span className="font-bold text-blue-900 dark:text-blue-100">
                  {reportData.predictions.nextMonthAssignments} assignments
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-800 dark:text-blue-200">Growth Trend:</span>
                <span className={`font-bold ${
                  reportData.predictions.growthTrend === 'up' ? 'text-blue-600' : 'text-blue-900 dark:text-blue-100'
                }`}>
                  {reportData.predictions.growthTrend === 'up' ? '📈 Increasing' : '📊 Stable'}
                </span>
              </div>
            </div>
          </Card>
        </FadeIn>

        <FadeIn>
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
            <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Areas for Attention
            </h3>
            <div className="space-y-2">
              {reportData.predictions.riskFactors.map((factor, index) => (
                <div key={index} className="flex items-start text-sm text-yellow-800 dark:text-yellow-200">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  {factor}
                </div>
              ))}
            </div>
          </Card>
        </FadeIn>
      </div>

      {/* Recent Activity */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {reportData.recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-3 ${
                  activity.type === 'assignment' ? 'bg-blue-500' :
                  activity.type === 'upload' ? 'bg-blue-500' : 'bg-purple-500'
                }`}></div>
                <div>
                  <p className="text-sm text-gray-900">{activity.activity}</p>
                  <p className="text-xs text-gray-500">{activity.user}</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">{activity.date}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Reports;
