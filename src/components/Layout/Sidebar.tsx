import React, { useState, useEffect } from 'react';
import {
  Home,
  Users,
  Building,
  Building2,
  Mail,
  CheckCircle,
  Upload,
  FileText,
  Settings,
  BarChart3,
  BookOpen,
  Info,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  Award,
  Target,
  Activity,
  Bell,
  Search,
  Filter,
  MapPin,
  UserCheck,
  PlusCircle,
  Edit3,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ApiService } from '../../services/api';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  children?: NavigationItem[];
  badge?: string | number;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isOpen, onClose }) => {
  const { user } = useAuth();
  const [expandedSections, setExpandedSections] = useState<string[]>(['main']);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'principal') {
      checkPendingRequests();
    }
  }, [user]);

  const checkPendingRequests = async () => {
    try {
      const response = await ApiService.get('/registration-requests');
      const pending = response.data?.filter((req: any) => req.status === 'pending').length || 0;
      setPendingRequests(pending);
    } catch (error) {
      console.error('Failed to check pending requests:', error);
    }
  };

  const toggleSection = (sectionId: string) => {
    if (isCollapsed) {
      setIsCollapsed(false);
    }
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    if (!isCollapsed) {
      setExpandedSections(['main']); // Collapse all sections when sidebar collapses
    }
  };

  const getNavigationItems = (): NavigationItem[] => {
    const baseItems: NavigationItem[] = [
      { id: 'dashboard', label: 'Dashboard', icon: Home }
    ];

    switch (user?.role) {
      case 'admin':
        return [
          ...baseItems,
          {
            id: 'management',
            label: 'Management',
            icon: Settings,
            children: [
              { id: 'colleges', label: 'Colleges', icon: Building },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'departments', label: 'Departments', icon: Building2 },
              { id: 'academic-structure', label: 'Academic Structure', icon: GraduationCap },
            ]
          },
          {
            id: 'operations',
            label: 'Operations',
            icon: Activity,
            children: [
              { id: 'invitations', label: 'Invitations', icon: Mail },
              { id: 'requests', label: 'Requests', icon: CheckCircle, badge: pendingRequests > 0 ? pendingRequests : undefined },
              { id: 'bulk-upload', label: 'Bulk Operations', icon: Upload },
            ]
          },
          { id: 'settings', label: 'Settings', icon: Settings }
        ];

      case 'principal':
        return [
          ...baseItems,
          {
            id: 'management',
            label: 'Management',
            icon: Settings,
            children: [
              { id: 'departments', label: 'Departments', icon: Building2 },
              { id: 'staff-management', label: 'Staff', icon: Users },
              { id: 'students', label: 'Students', icon: GraduationCap },
              { id: 'academic-structure', label: 'Academic Structure', icon: GraduationCap },
              { id: 'lms-content-mapping', label: 'LMS Content Mapping', icon: MapPin },
            ]
          },
          {
            id: 'operations',
            label: 'Operations',
            icon: Activity,
            children: [
              { id: 'invitations', label: 'Invitations', icon: Mail },
              { id: 'student-requests', label: 'Student Requests', icon: CheckCircle },
              { id: 'approvals', label: 'Approvals', icon: Award },
            ]
          },
          { id: 'student-monitoring', label: 'Student Progress', icon: BarChart3 },
          { id: 'reports', label: 'Reports', icon: FileText },
          { id: 'settings', label: 'Settings', icon: Settings }
        ];

      case 'hod':
        return [
          ...baseItems,

          {
            id: 'management',
            label: 'Management',
            icon: Settings,
            children: [
              { id: 'department-staff', label: 'Department Staff', icon: Users },
              { id: 'department-students', label: 'Department Students', icon: GraduationCap },
              { id: 'academic-structure-hod', label: 'Academic Structure', icon: Award },
              { id: 'class-incharge', label: 'Class In-Charge', icon: Target },
              { id: 'lms-content-mapping', label: 'LMS Content Mapping', icon: MapPin },
              { id: 'subject-staff-assignment', label: 'Subject Staff Assignment', icon: UserCheck },
            ]
          },
          {
            id: 'operations',
            label: 'Operations',
            icon: Activity,
            children: [
              { id: 'invitations', label: 'Invitations', icon: Mail },
              { id: 'student-monitoring', label: 'Student Progress', icon: BarChart3 },
            ]
          },
          { id: 'hod-content-creation', label: 'Content Creation', icon: PlusCircle },
          { id: 'examination-grading', label: 'Examination Grading', icon: Award },
          { id: 'settings', label: 'Settings', icon: Settings }
        ];

      case 'staff':
        return [
          ...baseItems,
          {
            id: 'students',
            label: 'Students',
            icon: GraduationCap,
            children: [
              { id: 'my-students', label: 'My Students', icon: Users },
              { id: 'student-monitoring', label: 'Progress Monitoring', icon: BarChart3 },
            ]
          },
          { id: 'staff-content-creation', label: 'Content Creation', icon: Edit3 },
          { id: 'assignment-management', label: 'Assignment Management', icon: FileText },
          { id: 'examination-grading', label: 'Examination Grading', icon: Award },
          { id: 'invitations', label: 'Invitations', icon: Mail },
          { id: 'settings', label: 'Settings', icon: Settings }
        ];

      case 'student':
        return [
          ...baseItems,
          { id: 'my-enrollments', label: 'My Courses', icon: GraduationCap },
          { id: 'student-assignments', label: 'My Assignments', icon: FileText },
          { id: 'student-examinations', label: 'My Examinations', icon: Award },
          { id: 'settings', label: 'Settings', icon: Settings }
        ];

      default:
        return baseItems;
    }
  };

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.includes(item.id);

    if (hasChildren && !isCollapsed) {
      return (
        <div key={item.id} className="mb-1">
          <button
            onClick={() => toggleSection(item.id)}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${level === 0
              ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            style={{ paddingLeft: `${12 + level * 16}px` }}
          >
            <div className="flex items-center space-x-3">
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {isExpanded && (
            <div className="mt-1 space-y-1">
              {item.children.map(child => renderNavigationItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    // Collapsed mode - just show icons with tooltip
    if (isCollapsed) {
      return (
        <div key={item.id} className="relative group mb-1">
          <button
            onClick={() => {
              if (hasChildren) {
                setIsCollapsed(false);
                toggleSection(item.id);
              } else {
                onTabChange(item.id);
                if (window.innerWidth < 1024) {
                  onClose();
                }
              }
            }}
            className={`w-full flex items-center justify-center p-3 rounded-lg transition-colors ${isActive
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            <Icon className="w-5 h-5" />
            {item.badge && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </button>
          {/* Tooltip */}
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
            {item.label}
          </div>
        </div>
      );
    }

    return (
      <button
        key={item.id}
        onClick={() => {
          console.log('🔍 Sidebar: Menu item clicked:', item.id, item.label);
          onTabChange(item.id);
          if (window.innerWidth < 1024) {
            onClose();
          }
        }}
        className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors mb-1 ${isActive
          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500'
          : level === 0
            ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        <div className="flex items-center space-x-3">
          <Icon className="w-5 h-5 flex-shrink-0" />
          <span>{item.label}</span>
          {item.badge && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
              {item.badge}
            </span>
          )}
        </div>
      </button>
    );
  };

  const navigationItems = getNavigationItems();

  return (
    <div className={`h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-x-hidden transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed ? (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Student-ACT</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Learning Management</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
          )}
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* User Info - Only show when not collapsed */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user?.role || 'Student'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <div className="space-y-1">
          {navigationItems.map(item => renderNavigationItem(item))}
        </div>
      </nav>

      {/* Collapse Toggle Button */}
      <div className="hidden lg:block p-2 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={toggleCollapse}
          className="w-full flex items-center justify-center p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
          {!isCollapsed && <span className="ml-2 text-sm">Collapse</span>}
        </button>
      </div>

      {/* Footer - Only show when not collapsed */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            <p>Student-ACT LMS v2.0</p>
            <p>© 2024 All rights reserved</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
