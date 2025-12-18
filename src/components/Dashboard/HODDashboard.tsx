import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  BookOpen,
  Upload,
  AlertTriangle,
  GraduationCap,
  TrendingUp,
  Activity,
  Calendar,
  CheckCircle,
  Clock
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import { ApiService } from '../../services/api';

interface HODDashboardProps {
  onNavigate: (tab: string) => void;
}

interface DashboardStats {
  totalStudents: number;
  coursesEnrolled: number;
  avgSubmissionsPerStudent: number;
  coursesCompleted: number;
  avgUploadsPerStudent: number;
  missingUpdates: number;
}

interface YearWiseData {
  year: string;
  totalStudents: number;
  participated: number;
}

interface StudentMissingUpload {
  studentName: string;
  registerNumber: string;
  year: string;
  lastUpload: string;
  semMissed: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const HODDashboard: React.FC<HODDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  const {
    data: hodDashboardData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['hod-dashboard-consolidated', user?.departmentId],
    queryFn: () => ApiService.getHODDashboardData(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!user?.departmentId,
    refetchOnWindowFocus: false,
    refetchOnMount: true
  });

  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    coursesEnrolled: 0,
    avgSubmissionsPerStudent: 0,
    coursesCompleted: 0,
    avgUploadsPerStudent: 0,
    missingUpdates: 0
  });

  const [yearWiseData, setYearWiseData] = useState<YearWiseData[]>([]);
  const [studentsWithMissingUploads, setStudentsWithMissingUploads] = useState<StudentMissingUpload[]>([]);

  useEffect(() => {
    if (!isLoading && hodDashboardData) {
      processConsolidatedData();
    }
  }, [isLoading, hodDashboardData]);

  const processConsolidatedData = () => {
    try {
      if (!hodDashboardData) return;

      const {
        statistics,
        yearWiseStats: yearStats,
        studentsWithMissingUploads: missingUploads
      } = hodDashboardData;

      if (statistics) {
        setStats({
          totalStudents: statistics.departmentStudents || 0,
          coursesEnrolled: statistics.coursesEnrolled || 0,
          avgSubmissionsPerStudent: statistics.avgSubmissionsPerStudent || 0,
          coursesCompleted: statistics.activeTrees || 0,
          avgUploadsPerStudent: statistics.uploadCompletionRate ?
            parseFloat((statistics.uploadCompletionRate / 10).toFixed(1)) : 0,
          missingUpdates: missingUploads?.length || 0
        });
      }

      if (yearStats && Array.isArray(yearStats)) {
        const transformedYearData = yearStats.map((year: any) => ({
          year: year.yearName || year.year || year.name || 'Unknown',
          totalStudents: year.totalStudents || 0,
          participated: year.participatedStudents || year.participated || 0
        }));
        setYearWiseData(transformedYearData);
      }

      if (missingUploads && Array.isArray(missingUploads)) {
        const transformedMissingUploads = missingUploads.map((student: any) => ({
          studentName: student.studentName || student.name || 'Unknown',
          registerNumber: student.registrationNumber || student.registerNumber || student.regNo || 'N/A',
          year: student.yearOfStudy || student.year || 'N/A',
          lastUpload: student.lastUpload || student.lastUploadDate || 'Never',
          semMissed: student.semestersMissed || student.semMissed || 0
        }));
        setStudentsWithMissingUploads(transformedMissingUploads);
      }
    } catch (error) {
      console.error('Failed to process consolidated dashboard data:', error);
    }
  };

  const participationData = [
    { name: 'Participating', value: stats.coursesCompleted },
    { name: 'Not Participating', value: stats.totalStudents - stats.coursesCompleted }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">Failed to Load Dashboard</h2>
          <button onClick={() => window.location.reload()} className="text-red-600 underline">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Department Overview</h1>
          <p className="text-gray-500">Welcome back, {user?.name}</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
          <div className="bg-blue-100 p-2 rounded-md">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <span className="font-medium text-gray-700">{hodDashboardData?.departmentName || 'Department'}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{stats.totalStudents}</h3>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>Active across all years</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Courses</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{stats.coursesCompleted}</h3>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-blue-600">
            <Activity className="w-4 h-4 mr-1" />
            <span>Currently in progress</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg. Uploads</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{stats.avgUploadsPerStudent}</h3>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <Upload className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-purple-600">
            <CheckCircle className="w-4 h-4 mr-1" />
            <span>Per student average</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Actions</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{stats.missingUpdates}</h3>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-orange-600">
            <Clock className="w-4 h-4 mr-1" />
            <span>Require attention</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Year-wise Participation */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Student Participation by Year</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearWiseData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f3f4f6' }}
                />
                <Legend />
                <Bar dataKey="totalStudents" name="Total Students" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="participated" name="Participated" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Overall Participation distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Overall Participation Status</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={participationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {participationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity / Action Items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">Action Required: Missing Uploads</h3>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {studentsWithMissingUploads.length > 0 ? (
                studentsWithMissingUploads.slice(0, 5).map((student, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                          {student.studentName.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.studentName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.registerNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.year}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Missing Upload
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.lastUpload}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p>All students are up to date! Great job.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Simple Icon component used in title
const Building2 = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
    <path d="M10 6h4" />
    <path d="M10 10h4" />
    <path d="M10 14h4" />
    <path d="M10 18h4" />
  </svg>
);

export default HODDashboard;
