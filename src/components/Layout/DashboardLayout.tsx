import React, { useState, useEffect } from 'react';
import { PuzzlePieceIcon } from '@heroicons/react/24/outline';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import ProfileDropdown from './ProfileDropdown';
import { useAuth } from '../../hooks/useAuth';
import { router } from '../../utils/router';

// Dashboard Components
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

// Enhanced Components
import ApprovalManagement from '../Management/ApprovalManagement';

import ClassInChargeManagement from '../ClassInCharge/ClassInChargeManagement';

// Tree Components
import CourseEnrollment from '../CourseEnrollment/CourseEnrollment';
import LearningProgress from '../LearningProgress/LearningProgress';
import SmartCourseRecommendation from '../CourseRecommendation/SmartCourseRecommendation';

// Reports Components
import Reports from '../Reports/Reports';

// Settings Components
import Settings from '../Settings/Settings';

// UI Components
// ThemeToggle moved to ProfileDropdown

// Mobile Components
import MobileNavigation from '../Mobile/MobileNavigation';

// Page Components
import GuidelinesPage from '../Pages/GuidelinesPage';
import ResourcesPage from '../Pages/ResourcesPage';
import AboutPage from '../Pages/AboutPage';
import SettingsPage from '../Pages/SettingsPage';

// Bulk Upload Components
import BulkCollegeUpload from '../BulkUpload/BulkCollegeUpload';
import BulkStaffHODUpload from '../BulkUpload/BulkStaffHODUpload';
import BulkStudentUpload from '../BulkUpload/BulkStudentUpload';

const DashboardLayout: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Initialize active tab from router
    const currentRoute = router.getCurrentRoute();
    setActiveTab(currentRoute);

    // Listen for route changes
    const unsubscribe = router.onRouteChange((route) => {
      setActiveTab(route);
    });

    return unsubscribe;
  }, []);

  const renderContent = () => {
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

      case 'reports':
        return <Reports />;

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
        return <LMSContentMapping />;

      case 'data-visualization':
        return <DataVisualizationDashboard />;

      case 'student-monitoring':
        return <StudentProgressMonitoring />;



      case 'smart-recommendations':
        return <SmartRecommendations />;

      case 'tree-selection':
        return <CourseEnrollment />;

      case 'my-tree':
        return <LearningProgress />;

      case 'my-courses':
        return <LearningProgress />;

      case 'guidelines':
        return <GuidelinesPage />;

      case 'resources':
        return <ResourcesPage />;

      case 'about':
        return <AboutPage />;

      case 'settings':
        return <SettingsPage />;

      case 'approvals':
        return <ApprovalManagement />;

      case 'class-incharge':
        return <ClassInChargeManagement onNavigate={setActiveTab} />;

      default:
        return <ModernAdminDashboard />;
    }
  };

  // Responsive layout with proper sidebar/content proportions
  return (
    // <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-80 bg-white dark:bg-gray-800 shadow-xl z-50">
            <Sidebar
              activeTab={activeTab}
              onTabChange={(tab) => {
                setActiveTab(tab);
                setSidebarOpen(false);
              }}
              isOpen={true}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block lg:w-64 xl:w-64 flex-shrink-0 sticky top-0 h-screen overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
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
            onNavigate={setActiveTab}
          />
        </div>

        {/* Desktop Header */}
        <header className="hidden lg:block bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')}
            </h1>
            <div className="flex items-center space-x-4">
              <ProfileDropdown onNavigate={setActiveTab} />
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
            onTabChange={setActiveTab}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;