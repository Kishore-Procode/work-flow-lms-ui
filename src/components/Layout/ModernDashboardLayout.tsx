import React, { useState, useEffect } from 'react';
import {
  HomeIcon,
  AcademicCapIcon,
  UserGroupIcon,
  BookOpenIcon,
  ChartBarIcon,
  CogIcon,
  BellIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { prefetchNavigationData } from '../../lib/prefetch';
import { router } from '../../utils/router';
import Sidebar from './Sidebar';

// Import all dashboard components
import AdminDashboard from '../Dashboard/AdminDashboard';
import ModernAdminDashboard from '../Dashboard/ModernAdminDashboard';
import PrincipalDashboard from '../Dashboard/PrincipalDashboard';
import HODDashboard from '../Dashboard/HODDashboard';
import StaffDashboard from '../Dashboard/StaffDashboard';
import StudentDashboard from '../Dashboard/StudentDashboard';
import ModernStudentDashboard from '../Dashboard/ModernStudentDashboard';

// Management Components
import CollegeManagement from '../Management/CollegeManagement';
import UserManagement from '../Management/UserManagement';
import StaffManagement from '../Management/StaffManagement';
import StudentManagement from '../Management/StudentManagement';
import MyStudents from '../Management/MyStudents';
import DepartmentManagement from '../Management/DepartmentManagement';
import AcademicStructureManagement from '../Management/AcademicStructureManagement';
import InvitationManagement from '../Management/InvitationManagement';
import RegistrationRequests from '../Management/RegistrationRequests';

import StudentCourseAssignmentManagement from '../Management/StudentCourseEnrollmentManagement';
import CourseInventoryManagement from '../Management/CourseInventoryManagement';
import ContentManagement from '../Management/ContentManagement';
import LMSContentMapping from '../Management/LMSContentMapping';
import DataVisualizationDashboard from '../Dashboard/DataVisualizationDashboard';
import StudentProgressMonitoring from '../Monitoring/StudentProgressMonitoring';
import SmartRecommendations from '../Features/SmartRecommendations';
import AssignmentManagementPage from '../../pages/staff/AssignmentManagementPage';

// Enhanced Components
import ApprovalManagement from '../Management/ApprovalManagement';

import ClassInChargeManagement from '../ClassInCharge/ClassInChargeManagement';

// Student Enrollment Components
import StudentEnrollmentDashboard from '../Student/StudentEnrollmentDashboard';

// Settings Components
import Settings from '../Settings/Settings';

// Page Components
import SettingsPage from '../Pages/SettingsPage';

// HOD Pages
import SubjectStaffAssignmentPage from '../../pages/hod/SubjectStaffAssignmentPage';
import { ContentCreationPage as HODContentCreationPage } from '../../pages/hod/ContentCreationPage';

// Staff Pages
import { StaffContentCreationPage } from '../../pages/staff/ContentCreationPage';
import { ExaminationGradingPage } from '../../pages/staff/ExaminationGradingPage';

// Student Pages
import { StudentAssignmentsPage } from '../../pages/student/StudentAssignmentsPage';
import { StudentExaminationsPage } from '../../pages/student/StudentExaminationsPage';

// Bulk Upload Components
import BulkCollegeUpload from '../BulkUpload/BulkCollegeUpload';
import BulkStaffHODUpload from '../BulkUpload/BulkStaffHODUpload';
import BulkStudentUpload from '../BulkUpload/BulkStudentUpload';

// Mobile Components
import MobileNavigation from '../Mobile/MobileNavigation';
import MobileHeader from './MobileHeader';
import ProfileDropdown from './ProfileDropdown';
import MobileStudentApp from '../Mobile/MobileStudentApp';

interface ModernDashboardLayoutProps {
  children?: React.ReactNode;
}

const ModernDashboardLayout: React.FC<ModernDashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(false);
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize active tab from router and listen for route changes
  useEffect(() => {
    const currentRoute = router.getCurrentRoute();
    console.log('🔍 ModernDashboardLayout: Initializing with route:', currentRoute);
    setActiveTab(currentRoute);

    const unsubscribe = router.onRouteChange((route) => {
      console.log('🔍 ModernDashboardLayout: Route changed to:', route);
      setActiveTab(route);
    });

    return unsubscribe;
  }, []);

  // Complete content rendering logic from original DashboardLayout
  const renderContent = () => {
    console.log('🔍 ModernDashboardLayout: renderContent called with activeTab:', activeTab);
    console.log('🔍 ModernDashboardLayout: user role:', user?.role);

    // If children are provided, render them (for backward compatibility)
    if (children) {
      console.log('🔍 ModernDashboardLayout: Rendering children');
      return children;
    }

    // Otherwise, use the complete routing system
    console.log('🔍 ModernDashboardLayout: Switching on activeTab:', activeTab);
    switch (activeTab) {
      case 'dashboard':
        if (user?.role === 'admin') return <ModernAdminDashboard />;
        if (user?.role === 'principal') return <PrincipalDashboard onNavigate={setActiveTab} />;
        if (user?.role === 'hod') return <HODDashboard onNavigate={setActiveTab} />;
        if (user?.role === 'staff') return <StaffDashboard onNavigate={setActiveTab} />;
        if (user?.role === 'student') return <ModernStudentDashboard />;
        return <ModernAdminDashboard />;

      case 'colleges':
        return <CollegeManagement />;

      case 'users':
        return <UserManagement />;

      case 'staff-management':
        return <StaffManagement />;

      case 'department-staff':
        return <StaffManagement />;

      case 'students':
        return <StudentManagement />;

      case 'department-students':
        return <StudentManagement />;

      case 'my-students':
        return <MyStudents />;

      case 'student-management':
        return <StudentManagement />;

      case 'departments':
        return <DepartmentManagement />;

      case 'academic-structure':
        return <AcademicStructureManagement onNavigate={setActiveTab} />;

      case 'academic-structure-hod':
        return <AcademicStructureManagement onNavigate={setActiveTab} mode="hod-sections-only" />;

      case 'invitations':
        return <InvitationManagement />;

      case 'bulk-upload':
        return <BulkCollegeUpload />;

      case 'bulk-upload-staff':
        return <BulkStaffHODUpload />;

      case 'bulk-upload-students':
        return <BulkStudentUpload />;

      case 'requests':
        return <RegistrationRequests />;

      case 'student-requests':
        return <RegistrationRequests />;

      case 'tree-management':


      case 'student-tree-assignments':
        return <StudentCourseAssignmentManagement />;

      case 'tree-inventory':
        return <CourseInventoryManagement />;

      case 'content-management':
        return <ContentManagement />;

      case 'lms-content-mapping':
        console.log('✅ ModernDashboardLayout: Rendering LMSContentMapping component');
        return <LMSContentMapping />;

      case 'student-monitoring':
        return <StudentProgressMonitoring />;



      case 'subject-staff-assignment':
        return <SubjectStaffAssignmentPage />;

      case 'hod-content-creation':
        return <HODContentCreationPage />;

      case 'staff-content-creation':
        return <StaffContentCreationPage />;

      case 'examination-grading':
        return <ExaminationGradingPage />;

      case 'student-assignments':
        return <StudentAssignmentsPage />;

      case 'student-examinations':
        return <StudentExaminationsPage />;

      case 'staff-management-hod':
      case 'department-staff-management':
        return <StaffManagement />;

      case 'class-incharge-management':
        return <ClassInChargeManagement onNavigate={setActiveTab} />;

      case 'academic-management':
        return <AcademicStructureManagement onNavigate={setActiveTab} />;

      case 'student-enrollments':
      case 'my-enrollments':
        return <StudentEnrollmentDashboard />;

      case 'assignment-management':
        return <AssignmentManagementPage />;

      // Handle play-session routes with parameters
      default:
        if (activeTab.startsWith('play-session/')) {
          const params = router.getRouteParams(activeTab);
          if (params.subjectId) {
            const PlaySessionPage = React.lazy(() => import('../../pages/PlaySessionPage'));
            return (
              <React.Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              }>
                <PlaySessionPage subjectId={params.subjectId} />
              </React.Suspense>
            );
          }
        }

        // Handle course-player routes with parameters
        if (activeTab.startsWith('course-player/')) {
          const params = router.getRouteParams(activeTab);
          if (params.subjectId) {
            const CoursePlayerPage = React.lazy(() => import('../../pages/CoursePlayerPage'));
            return (
              <React.Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              }>
                <CoursePlayerPage subjectId={params.subjectId} />
              </React.Suspense>
            );
          }
        }
        break;
    }

    // Continue with other routes
    switch (activeTab) {
      case 'settings':
        return <SettingsPage />;

      case 'approvals':
        return <ApprovalManagement />;

      case 'class-incharge':
        return <ClassInChargeManagement onNavigate={setActiveTab} />;

      default:
        console.log('⚠️ ModernDashboardLayout: No matching route, falling back to ModernAdminDashboard. activeTab:', activeTab);
        return <ModernAdminDashboard />;
    }
  };

  // Prefetch data on navigation hover
  const handleNavigationHover = async (route: string) => {
    if (user?.role) {
      try {
        await prefetchNavigationData(queryClient, route, user.role, user.id);
      } catch (error) {
        console.warn('Prefetch failed for route:', route, error);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.navigateTo(tab);
    setSidebarOpen(false); // Close mobile sidebar on navigation
  };

  // Render mobile app for students on mobile devices
  if (isMobile && user?.role === 'student') {
    return <MobileStudentApp />;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-80 bg-white dark:bg-gray-800 shadow-xl z-50">
            <Sidebar
              activeTab={activeTab}
              onTabChange={handleTabChange}
              isOpen={true}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0 sticky top-0 h-screen overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isOpen={true}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <MobileHeader
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
            isMenuOpen={sidebarOpen}
            currentPage={activeTab}
            onNavigate={handleTabChange}
          />
        </div>

        {/* Desktop Header */}
        <header className="hidden lg:block bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')}
            </h1>
            <div className="flex items-center space-x-4">
              <ProfileDropdown onNavigate={handleTabChange} />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {renderContent()}
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden">
          <MobileNavigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>
      </div>
    </div>
  );
};

export default ModernDashboardLayout;
