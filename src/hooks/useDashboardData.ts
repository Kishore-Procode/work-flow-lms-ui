import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiService } from '../services/api';
import { useAuth } from './useAuth';
import {
  DashboardStats,
  DashboardHookReturn,
  DepartmentData,
  RecentActivity,
  StudentWithMissingUpload,
  ConsolidatedDashboardResponse,
  LearningResource,
  User
} from '../types/dashboard';

// Helper function to get assigned student ID from learning resource (prioritizes camelCase from API)
const getAssignedStudentId = (resource: LearningResource | any): string | null => {
  // API returns camelCase, so check assignedStudentId first
  return resource.assignedStudentId || resource.assigned_student_id || resource.studentId || resource.student_id || null;
};

export const useDashboardData = (refreshInterval: number = 30000): DashboardHookReturn => {
  const { user } = useAuth();

  // Initialize with proper types
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalColleges: 0,
    totalDepartments: 0,
    totalResources: 0,
    totalStaff: 0,
    totalStudents: 0,
    pendingInvitations: 0,
    pendingRequests: 0,
    activeUsers: 0,
    departmentStaff: 0,
    departmentStudents: 0,
    activeClasses: 0,
    assignedResources: 0,
    availableResources: 0,
    participationRate: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
  const [departmentPerformance, setDepartmentPerformance] = useState<DepartmentData[]>([]);
  const [studentsWithMissingUploads, setStudentsWithMissingUploads] = useState<StudentWithMissingUpload[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Use React Query for optimized data fetching - Principal Dashboard Only
  const {
    data: dashboardData,
    isLoading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['principal-dashboard-data', user?.collegeId],
    queryFn: async (): Promise<ConsolidatedDashboardResponse> => {
      if (!user?.collegeId) throw new Error('College ID not found');
      return await ApiService.getPrincipalDashboardData();
    },
    enabled: !!user?.collegeId && user?.role === 'principal',
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes (updated from cacheTime)
    refetchOnWindowFocus: false,
    refetchInterval: refreshInterval
  });

  // Update state when data changes
  useEffect(() => {
    if (dashboardData && user?.role === 'principal') {
      updateStateFromData(dashboardData);
    } else if (user && user.role !== 'principal') {
      // For non-principal users, use the legacy method
      loadDashboardDataLegacy();
    }
  }, [dashboardData, user]);

  const updateStateFromData = (data: ConsolidatedDashboardResponse) => {
    setStats(data.stats);
    setDepartmentData(data.departmentData);
    setRecentActivity(data.recentActivity);

    // Set department performance for backward compatibility
    const deptPerformance = data.departmentData.map(dept => ({
      ...dept,
      dept: dept.name // Add dept property for backward compatibility
    })) as (DepartmentData & { dept: string })[];
    setDepartmentPerformance(deptPerformance);

    setError(null);
  };

  // Legacy method for non-principal users
  const loadDashboardDataLegacy = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);

      // Load data based on user role
      if (user.role === 'admin') {
        await loadAdminData();
      } else if (user.role === 'hod') {
        await loadHODData();
      } else if (user.role === 'staff') {
        await loadStaffData();
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Failed to load dashboard data');
    }
  }, [user]);

  const loadAdminData = async () => {
    const [usersData, collegesData, departmentsData, invitationsData, requestsData, resourcesData] = await Promise.all([
      ApiService.getUsers(),
      ApiService.getColleges(),
      ApiService.getDepartments(),
      ApiService.getInvitations(),
      ApiService.getRegistrationRequests(),
      ApiService.getLearningResources()
    ]);

    // Handle paginated responses with proper typing
    const users = Array.isArray(usersData) ? usersData : (usersData as any)?.data || [];
    const colleges = Array.isArray(collegesData) ? collegesData : (collegesData as any)?.data || [];
    const departments = Array.isArray(departmentsData) ? departmentsData : (departmentsData as any)?.data || [];
    const invitations = Array.isArray(invitationsData) ? invitationsData : (invitationsData as any)?.data || [];
    const requests = Array.isArray(requestsData) ? requestsData : (requestsData as any)?.data || [];
    const resources = Array.isArray(resourcesData) ? resourcesData : (resourcesData as any)?.data || [];

    // Calculate assigned resources
    const assignedResources = resources.filter((resource: any) => getAssignedStudentId(resource));
    const availableResources = resources.filter((resource: any) => !getAssignedStudentId(resource));
    const students = users.filter((u: any) => u.role === 'student');
    const participationRate = students.length > 0 ? Math.round((assignedResources.length / students.length) * 100) : 0;

    setStats({
      totalUsers: users.length,
      totalColleges: colleges.length,
      totalDepartments: departments.length,
      totalResources: resources.length,
      totalStaff: users.filter((u: any) => u.role === 'staff' || u.role === 'hod').length,
      totalStudents: students.length,
      pendingInvitations: invitations.filter((inv: any) => inv.status === 'pending').length,
      pendingRequests: requests.filter((req: any) => req.status === 'pending').length,
      activeUsers: users.filter((u: any) => u.status === 'active').length,
      departmentStaff: 0,
      departmentStudents: 0,
      activeClasses: 0,
      assignedResources: assignedResources.length,
      availableResources: availableResources.length,
      participationRate
    });

    // Generate recent activity
    const activity = [
      ...users.slice(0, 3).map((u: any) => ({
        type: 'user_created' as const,
        message: `New user ${u.name} registered`,
        timestamp: u.createdAt,
        status: u.status
      })),
      ...requests.slice(0, 2).map((r: any) => ({
        type: 'registration_request' as const,
        message: `Registration request from ${r.name}`,
        timestamp: r.createdAt,
        status: r.status
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

    setRecentActivity(activity);
  };

  const loadPrincipalData = async () => {
    if (!user?.collegeId) return;

    try {
      try {
        // Try the new consolidated endpoint first for better performance
        const dashboardData = await ApiService.getPrincipalDashboardData();



        // Use the consolidated data from the new endpoint
        const { stats, departmentData, recentActivity } = dashboardData;

        // Set stats from the consolidated response
        setStats({
          totalUsers: stats.totalUsers || 0,
          totalColleges: 1,
          totalDepartments: stats.totalDepartments || 0,
          totalResources: stats.totalTrees || 0,
          totalStaff: stats.totalStaff || 0,
          totalStudents: stats.totalStudents || 0,
          pendingInvitations: 0,
          pendingRequests: stats.pendingRequests || 0,
          activeUsers: stats.totalUsers || 0,
          departmentStaff: 0,
          departmentStudents: 0,
          activeClasses: 0,
          assignedResources: stats.assignedTrees || 0,
          availableResources: stats.availableTrees || 0,
          participationRate: stats.participationRate || 0
        });

        // Set department data directly from the consolidated response
        setDepartmentData(departmentData || []);

        // For backward compatibility, also set departmentPerformance with the same data
        // but with field names expected by the table (if still needed elsewhere)
        const deptPerformance = (departmentData || []).map((dept: any) => ({
          ...dept,
          dept: dept.name,
          hod: dept.hodName || 'Not Assigned',
          students: dept.students,
          resources: dept.participated, // Use participated for resources count
          availableResources: dept.availableTrees,
          totalResources: dept.totalTrees,
          participation: dept.percentage,
          missing: dept.missing,
          status: dept.status
        }));

        setDepartmentPerformance(deptPerformance);

        // Set recent activity from the consolidated response
        setRecentActivity(recentActivity || []);



      } catch (consolidatedError) {
        console.warn('⚠️ Consolidated endpoint failed, falling back to individual API calls:', consolidatedError);

        // Fallback to original multiple API calls
        await loadPrincipalDataFallback();
      }
    } catch (error) {
      console.error('❌ Error loading Principal Dashboard data:', error);
      setError('Failed to load dashboard data. Please try refreshing.');
    }
  };

  // Fallback function using original multiple API calls
  const loadPrincipalDataFallback = async () => {

    const [collegeUsersData, collegeDepartmentsData, registrationRequestsData, resourcesData] = await Promise.all([
      ApiService.getUsersByCollege(user!.collegeId!),
      ApiService.getDepartmentsByCollege(user!.collegeId!),
      ApiService.getRegistrationRequestsByCollege(user!.collegeId!),
      ApiService.getLearningResourcesByCollege(user!.collegeId!)
    ]);

    // Handle paginated responses with better error handling
    const collegeUsers = Array.isArray(collegeUsersData) ? collegeUsersData : (collegeUsersData as any)?.data || [];
    const collegeDepartments = Array.isArray(collegeDepartmentsData) ? collegeDepartmentsData : (collegeDepartmentsData as any)?.data || [];
    const registrationRequests = Array.isArray(registrationRequestsData) ? registrationRequestsData : (registrationRequestsData as any)?.data || [];
    const resources = Array.isArray(resourcesData) ? resourcesData : (resourcesData as any)?.data || [];

    // Calculate learning resource statistics using helper function
    const assignedResources = resources.filter((r: any) => getAssignedStudentId(r));
    const availableResources = resources.filter((r: any) => !getAssignedStudentId(r));
    const students = collegeUsers.filter((u: any) => u.role === 'student');
    const participationRate = students.length > 0 ? Math.round((assignedResources.length / students.length) * 100) : 0;

    setStats({
      totalUsers: collegeUsers.length,
      totalColleges: 1,
      totalDepartments: collegeDepartments.length,
      totalResources: resources.length,
      totalStaff: collegeUsers.filter((u: any) => u.role === 'staff' || u.role === 'hod').length,
      totalStudents: students.length,
      pendingInvitations: 0,
      pendingRequests: registrationRequests.filter((r: any) => r.status === 'pending').length,
      activeUsers: collegeUsers.filter((u: any) => u.status === 'active').length,
      departmentStaff: 0,
      departmentStudents: 0,
      activeClasses: 0,
      assignedResources: assignedResources.length,
      availableResources: availableResources.length,
      participationRate
    });

    // Process department data for charts with enhanced tree tracking
    const deptData = collegeDepartments.map((dept: any) => {
      const deptUsers = collegeUsers.filter((u: any) => u.departmentId === dept.id);
      const students = deptUsers.filter((u: any) => u.role === 'student');

      // Get trees that belong to this department
      const deptTrees = trees.filter((t: any) => t.departmentId === dept.id || t.department_id === dept.id);

      // Count assigned trees in this department
      const assignedTreesInDept = deptTrees.filter((t: any) => getAssignedStudentId(t));
      const availableTreesInDept = deptTrees.filter((t: any) => !getAssignedStudentId(t));

      // Calculate participation percentage based on students with trees
      const studentsInDept = students.map((s: any) => s.id);
      const studentsWithTrees = trees.filter((t: any) => {
        const assignedId = getAssignedStudentId(t);
        return assignedId && studentsInDept.includes(assignedId);
      });
      const uniqueStudentsWithTrees = new Set(studentsWithTrees.map((t: any) => getAssignedStudentId(t))).size;
      const participationPercentage = students.length > 0 ? Math.round((uniqueStudentsWithTrees / students.length) * 100) : 0;

      return {
        dept: dept.name,
        students: students.length,
        participated: assignedTreesInDept.length, // Trees assigned in this department
        availableTrees: availableTreesInDept.length,
        totalTrees: deptTrees.length,
        percentage: participationPercentage
      };
    });

    setDepartmentData(deptData);

    // Set department performance data (for backward compatibility)
    const deptPerformance = deptData.map((dept: any) => ({
      dept: dept.dept,
      hod: 'Not Available',
      students: dept.students,
      trees: dept.participated,
      availableTrees: dept.availableTrees,
      totalTrees: dept.totalTrees,
      participation: dept.percentage,
      missing: Math.max(0, dept.students - dept.participated),
      status: dept.percentage >= 90 ? 'excellent' : dept.percentage >= 70 ? 'good' : dept.percentage >= 50 ? 'fair' : 'needs_improvement'
    }));

    setDepartmentPerformance(deptPerformance);

    // Generate recent activity
    const activity = assignedTrees
      .sort((a: any, b: any) => new Date(b.assignedDate || b.createdAt || '').getTime() - new Date(a.assignedDate || a.createdAt || '').getTime())
      .slice(0, 5)
      .map((tree: any) => {
        const assignedStudentId = getAssignedStudentId(tree);
        const student = collegeUsers.find((u: any) => u.id === assignedStudentId);
        return {
          type: 'tree_assignment',
          message: `Tree ${tree.treeCode || tree.tree_code || tree.id} assigned to ${student?.name || 'Unknown Student'}`,
          timestamp: tree.assignedDate || tree.createdAt,
          status: 'active',
          details: {
            treeCode: tree.treeCode || tree.tree_code,
            species: tree.species,
            studentName: student?.name
          }
        };
      });

    setRecentActivity(activity);

  };

  const loadHODData = async () => {
    if (!user?.departmentId) return;

    const [departmentUsersData, registrationRequestsData, treesData] = await Promise.all([
      ApiService.getUsersByDepartment(user.departmentId),
      ApiService.getRegistrationRequests(),
      ApiService.getTrees()
    ]);

    // Handle paginated responses
    const departmentUsers = Array.isArray(departmentUsersData) ? departmentUsersData : (departmentUsersData as any)?.data || [];
    const registrationRequests = Array.isArray(registrationRequestsData) ? registrationRequestsData : (registrationRequestsData as any)?.data || [];
    const trees = Array.isArray(treesData) ? treesData : (treesData as any)?.data || [];

    // Filter requests for this department
    const departmentRequests = registrationRequests.filter((r: any) => r.departmentId === user.departmentId);
    const departmentTrees = trees.filter((t: any) => {
      const assignedStudent = departmentUsers.find((u: any) => u.id === t.assignedStudentId);
      return assignedStudent && assignedStudent.role === 'student';
    });

    // Calculate additional stats
    const deptStudents = departmentUsers.filter((u: any) => u.role === 'student');
    const assignedTrees = departmentTrees.filter((t: any) => getAssignedStudentId(t));
    const availableTrees = trees.filter((t: any) => !getAssignedStudentId(t));
    const participationRate = deptStudents.length > 0 ? Math.round((assignedTrees.length / deptStudents.length) * 100) : 0;

    setStats({
      totalUsers: departmentUsers.length,
      totalColleges: 0,
      totalDepartments: 1,
      totalTrees: departmentTrees.length,
      totalStaff: departmentUsers.filter((u: any) => u.role === 'staff').length,
      totalStudents: deptStudents.length,
      pendingInvitations: 0,
      pendingRequests: departmentRequests.filter((r: any) => r.status === 'pending').length,
      activeUsers: departmentUsers.filter((u: any) => u.status === 'active').length,
      departmentStaff: departmentUsers.filter((u: any) => u.role === 'staff').length,
      departmentStudents: deptStudents.length,
      activeClasses: new Set(departmentUsers.filter((u: any) => u.role === 'student' && u.class).map((u: any) => u.class)).size,
      assignedTrees: assignedTrees.length,
      availableTrees: availableTrees.length,
      participationRate
    });

    // Process students with missing uploads
    const students = departmentUsers.filter((u: any) => u.role === 'student');
    const studentsWithMissing = students.map((student: any) => {
      const studentTrees = departmentTrees.filter((t: any) => t.assignedStudentId === student.id);
      const hasRecentUpload = studentTrees.some((t: any) => {
        const daysSinceCreated = Math.floor((new Date().getTime() - new Date(t.createdAt || new Date()).getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceCreated < 30;
      });

      return {
        name: student.name,
        regNo: student.rollNumber || 'N/A',
        year: student.semester ? `${student.semester} Year` : 'N/A',
        lastUpload: hasRecentUpload ? 'Recent' : 'No recent uploads',
        missed: hasRecentUpload ? 0 : Math.floor((new Date().getTime() - new Date(student.createdAt || new Date()).getTime()) / (1000 * 60 * 60 * 24 * 7)) // Weeks since joining
      };
    }).filter((s: any) => s.missed > 0).slice(0, 5);

    setStudentsWithMissingUploads(studentsWithMissing);

    // Generate recent activity
    const userActivity = departmentUsers
      .filter((u: any) => u.lastLogin)
      .slice(0, 3)
      .map((u: any) => ({
        type: 'user_activity' as const,
        message: `${u.name} (${u.role}) last active`,
        timestamp: u.lastLogin,
        status: u.status
      }));

    const requestActivity = departmentRequests
      .filter((r: any) => r.createdAt)
      .slice(0, 2)
      .map((r: any) => ({
        type: 'registration_request' as const,
        message: `New registration request from ${r.name}`,
        timestamp: r.createdAt,
        status: r.status
      }));

    const allActivity = [...userActivity, ...requestActivity]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    setRecentActivity(allActivity);
  };

  const loadStaffData = async () => {
    // Similar to HOD but filtered by class
    await loadHODData();
  };

  // Create a proper refresh function
  const refresh = useCallback(async () => {
    if (user?.role === 'principal') {
      await refetch();
    } else {
      await loadDashboardDataLegacy();
    }
  }, [user?.role, refetch, loadDashboardDataLegacy]);

  // Handle error state
  useEffect(() => {
    if (queryError) {
      setError(queryError.message || 'Failed to load dashboard data');
    }
  }, [queryError]);

  return {
    stats,
    recentActivity,
    departmentData,
    departmentPerformance,
    studentsWithMissingUploads,
    loading: isLoading || (!dashboardData && user?.role === 'principal'),
    error,
    refresh
  };
};
