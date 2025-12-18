import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  TreePine, 
  Users, 
  GraduationCap, 
  Building, 
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { ApiService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface StudentProgress {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  yearOfStudy: number;
  section: string;
  courseName: string;
  departmentName: string;
  assignedTrees: number;
  healthyTrees: number;
  recentUploads: number;
  lastUploadDate: string | null;
  status: 'active' | 'inactive';
  treeAssignmentStatus: 'assigned' | 'pending' | 'not_assigned';
}

interface DepartmentHierarchy {
  courseId: string;
  courseName: string;
  departments: {
    departmentId: string;
    departmentName: string;
    years: {
      year: number;
      sections: {
        section: string;
        students: StudentProgress[];
        stats: {
          totalStudents: number;
          assignedTrees: number;
          activeStudents: number;
          completionRate: number;
        };
      }[];
    }[];
  }[];
}

export const PrincipalProgressMonitoring: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'hierarchy' | 'table'>('hierarchy');

  // Fetch progress monitoring data
  const {
    data: progressData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['principal-progress-monitoring', user?.collegeId, selectedCourse, selectedDepartment, selectedYear, selectedStatus],
    queryFn: () => ApiService.getPrincipalProgressMonitoring({
      courseId: selectedCourse !== 'all' ? selectedCourse : undefined,
      departmentId: selectedDepartment !== 'all' ? selectedDepartment : undefined,
      year: selectedYear !== 'all' ? parseInt(selectedYear) : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!user?.collegeId
  });

  // Fetch filter options
  const { data: filterOptions } = useQuery({
    queryKey: ['progress-filter-options', user?.collegeId],
    queryFn: () => ApiService.getProgressFilterOptions(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user?.collegeId
  });

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'not_assigned': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'not_assigned': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredData = progressData?.filter((course: DepartmentHierarchy) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return course.courseName.toLowerCase().includes(searchLower) ||
             course.departments.some(dept => 
               dept.departmentName.toLowerCase().includes(searchLower) ||
               dept.years.some(year => 
                 year.sections.some(section => 
                   section.students.some(student => 
                     student.name.toLowerCase().includes(searchLower) ||
                     student.email.toLowerCase().includes(searchLower) ||
                     student.rollNumber.toLowerCase().includes(searchLower)
                   )
                 )
               )
             );
    }
    return true;
  }) || [];

  const exportData = () => {
    // Implementation for exporting progress data
    console.log('Exporting progress data...');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading progress data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Failed to load progress monitoring data</p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Progress Monitoring</h2>
          <p className="text-gray-600">Monitor student tree assignment and progress across all departments</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={exportData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search students, courses, departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Course Filter */}
          <div>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Courses</option>
              {filterOptions?.courses?.map((course: any) => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Departments</option>
              {filterOptions?.departments?.map((dept: any) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="assigned">Assigned</option>
              <option value="pending">Pending</option>
              <option value="not_assigned">Not Assigned</option>
            </select>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="mt-4 flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">View Mode:</span>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('hierarchy')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'hierarchy' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Hierarchy
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'table' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Progress Data Display */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {viewMode === 'hierarchy' ? (
          <div className="p-6">
            {filteredData.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No progress data found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredData.map((course: DepartmentHierarchy) => (
                  <div key={course.courseId} className="border border-gray-200 rounded-lg">
                    {/* Course Level */}
                    <div
                      className="flex items-center justify-between p-4 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => toggleNode(`course-${course.courseId}`)}
                    >
                      <div className="flex items-center space-x-3">
                        {expandedNodes.has(`course-${course.courseId}`) ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-gray-900">{course.courseName}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{course.departments.length} Departments</span>
                      </div>
                    </div>

                    {/* Department Level */}
                    {expandedNodes.has(`course-${course.courseId}`) && (
                      <div className="border-t border-gray-200">
                        {course.departments.map((department) => (
                          <div key={department.departmentId} className="border-b border-gray-100 last:border-b-0">
                            <div
                              className="flex items-center justify-between p-4 pl-8 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                              onClick={() => toggleNode(`dept-${department.departmentId}`)}
                            >
                              <div className="flex items-center space-x-3">
                                {expandedNodes.has(`dept-${department.departmentId}`) ? (
                                  <ChevronDown className="w-4 h-4 text-gray-500" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-500" />
                                )}
                                <Building className="w-4 h-4 text-gray-600" />
                                <span className="font-medium text-gray-900">{department.departmentName}</span>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span>{department.years.length} Years</span>
                              </div>
                            </div>

                            {/* Year and Section Level */}
                            {expandedNodes.has(`dept-${department.departmentId}`) && (
                              <div className="bg-white">
                                {department.years.map((year) => (
                                  <div key={year.year} className="border-b border-gray-100 last:border-b-0">
                                    {year.sections.map((section) => (
                                      <div key={section.section} className="p-4 pl-12">
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-center space-x-3">
                                            <Users className="w-4 h-4 text-purple-600" />
                                            <span className="font-medium text-gray-900">
                                              Year {year.year} - Section {section.section}
                                            </span>
                                          </div>
                                          <div className="flex items-center space-x-4 text-sm">
                                            <span className="text-gray-600">
                                              {section.stats.totalStudents} Students
                                            </span>
                                            <span className="text-blue-600">
                                              {section.stats.assignedTrees} Trees
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                              section.stats.completionRate >= 80 
                                                ? 'bg-blue-100 text-blue-800'
                                                : section.stats.completionRate >= 60
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                              {section.stats.completionRate}% Complete
                                            </span>
                                          </div>
                                        </div>

                                        {/* Students List */}
                                        <div className="space-y-2">
                                          {section.students.slice(0, 5).map((student) => (
                                            <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                              <div className="flex items-center space-x-3">
                                                {getStatusIcon(student.treeAssignmentStatus)}
                                                <div>
                                                  <p className="font-medium text-gray-900">{student.name}</p>
                                                  <p className="text-sm text-gray-600">{student.rollNumber}</p>
                                                </div>
                                              </div>
                                              <div className="flex items-center space-x-4 text-sm">
                                                <div className="flex items-center space-x-1">
                                                  <TreePine className="w-4 h-4 text-blue-500" />
                                                  <span>{student.assignedTrees}</span>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.treeAssignmentStatus)}`}>
                                                  {student.treeAssignmentStatus.replace('_', ' ').toUpperCase()}
                                                </span>
                                              </div>
                                            </div>
                                          ))}
                                          {section.students.length > 5 && (
                                            <p className="text-sm text-gray-500 text-center py-2">
                                              +{section.students.length - 5} more students
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Table View Implementation would go here
          <div className="p-6">
            <p className="text-center text-gray-500">Table view implementation coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};
