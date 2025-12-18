import React, { useState, useEffect } from 'react';
import {
  Home,
  Users,
  TreePine,
  BarChart3,
  Settings,
  X,
  Bell,
  Search,
  Plus,
  Building,
  Building2,
  Mail,
  GraduationCap,
  CheckCircle,
  Upload,
  FileText,
  BookOpen,
  Info
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ApiService } from '../../services/api';

interface MobileNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ activeTab, onTabChange }) => {
  const { user } = useAuth();
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [hasTree, setHasTree] = useState(false);
  const [treeStatusLoading, setTreeStatusLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'student') {
      checkTreeStatus();
    } else {
      setTreeStatusLoading(false);
    }
  }, [user]);

  const checkTreeStatus = async () => {
    try {
      setTreeStatusLoading(true);
      const status = await ApiService.getTreeSelectionStatus();
      setHasTree(status?.hasTree || false);
    } catch (error) {
      console.error('Failed to check tree status:', error);
      setHasTree(false);
    } finally {
      setTreeStatusLoading(false);
    }
  };

  const getNavigationItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: Home }
    ];

    switch (user?.role) {
      case 'admin':
        return [
          ...baseItems,
          { id: 'colleges', label: 'Colleges', icon: Building },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'invitations', label: 'Invitations', icon: Mail },
          { id: 'requests', label: 'Requests', icon: CheckCircle },
          { id: 'bulk-upload', label: 'Bulk Ops', icon: Upload },
          { id: 'content-management', label: 'Content', icon: FileText },
          { id: 'settings', label: 'Settings', icon: Settings }
        ];
      case 'principal':
        return [
          ...baseItems,
          { id: 'colleges', label: 'Colleges', icon: Building },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'invitations', label: 'Invitations', icon: Mail },
          { id: 'departments', label: 'Departments', icon: Building2 },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'trees', label: 'Trees', icon: TreePine },
          { id: 'settings', label: 'Settings', icon: Settings }
        ];
      case 'hod':
        return [
          ...baseItems,
          { id: 'invitations', label: 'Invitations', icon: Mail },
          { id: 'departments', label: 'Departments', icon: Building2 },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'trees', label: 'Trees', icon: TreePine },
          { id: 'settings', label: 'Settings', icon: Settings }
        ];
      case 'staff':
        return [
          ...baseItems,
          { id: 'invitations', label: 'Invitations', icon: Mail },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'trees', label: 'Trees', icon: TreePine },
          { id: 'settings', label: 'Settings', icon: Settings }
        ];
      case 'student':
        const studentItems = [...baseItems];

        // Only show tree selection if student doesn't have a tree yet
        // if (!treeStatusLoading && !hasTree) {
        //   studentItems.push({ id: 'tree-selection', label: 'Select', icon: TreePine });
        // }

        // Only show my tree if student has a tree
        if (!treeStatusLoading && hasTree) {
          studentItems.push({ id: 'my-tree', label: 'My Tree', icon: TreePine });
        }

        // Add Student Enrollments
        studentItems.push({ id: 'my-enrollments', label: 'Enrollments', icon: GraduationCap });

        studentItems.push(
          { id: 'guidelines', label: 'Guidelines', icon: FileText },
          { id: 'resources', label: 'Resources', icon: BookOpen },
          { id: 'about', label: 'About', icon: Info },
          { id: 'settings', label: 'Account', icon: Settings }
        );

        return studentItems;
      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  const getQuickActions = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { label: 'Add College', action: () => console.log('Add college') },
          { label: 'Invite User', action: () => console.log('Invite user') },
          { label: 'View Reports', action: () => onTabChange('reports') }
        ];
      case 'principal':
        return [
          { label: 'Add Department', action: () => console.log('Add department') },
          { label: 'Add Staff', action: () => console.log('Add staff') },
          { label: 'View Analytics', action: () => onTabChange('reports') }
        ];
      case 'hod':
        return [
          { label: 'Add Student', action: () => console.log('Add student') },
          { label: 'Add Tree', action: () => console.log('Add tree') },
          { label: 'View Progress', action: () => onTabChange('reports') }
        ];
      case 'staff':
        return [
          { label: 'Help Student', action: () => console.log('Help student') },
          { label: 'Check Trees', action: () => onTabChange('trees') }
        ];
      case 'student':
        return [
          { label: 'Upload Photo', action: () => console.log('Upload photo') },
          { label: 'View Resources', action: () => onTabChange('resources') },
          { label: 'My Progress', action: () => onTabChange('my-tree') },
          { label: 'Smart Suggestions', action: () => onTabChange('smart-recommendations') }
        ];
      default:
        return [];
    }
  };

  const quickActions = getQuickActions();

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className="mobile-navigation-bar md:hidden">
        <div className="grid grid-cols-5 h-16">
          {/* Show main navigation items based on available space */}
          {navigationItems.slice(0, Math.min(4, navigationItems.length)).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`mobile-nav-button ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 active'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                aria-label={`Navigate to ${item.label}`}
                role="tab"
                aria-selected={isActive}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium truncate">{item.label}</span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-600 dark:bg-blue-400 rounded-b-full" />
                )}
              </button>
            );
          })}

          {/* More Menu Button - Only show if there are more than 4 items */}
          {navigationItems.length > 4 && (
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="flex flex-col items-center justify-center space-y-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors relative"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                {showQuickActions ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
              </div>
              <span className="text-xs font-medium">More</span>
            </button>
          )}

          {/* If 4 or fewer items, show them all */}
          {navigationItems.length <= 4 && navigationItems.slice(4).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`mobile-nav-button ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 active'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                aria-label={`Navigate to ${item.label}`}
                role="tab"
                aria-selected={isActive}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium truncate">{item.label}</span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-600 dark:bg-blue-400 rounded-b-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Actions Overlay */}
      {showQuickActions && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
            onClick={() => setShowQuickActions(false)}
          />
          <div className="fixed bottom-20 left-4 right-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-50 md:hidden max-h-96 overflow-y-auto">
            <div className="p-4">
              {/* Show remaining navigation items if there are more than 4 */}
              {navigationItems.length > 4 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    More Navigation
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {navigationItems.slice(4).map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onTabChange(item.id);
                            setShowQuickActions(false);
                          }}
                          className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <Icon className="w-6 h-6 mb-2" />
                          <span className="text-xs font-medium text-center">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              {quickActions.length > 0 && (
                <div className={navigationItems.length > 4 ? "pt-4 border-t border-gray-200 dark:border-gray-700" : ""}>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {quickActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          action.action();
                          setShowQuickActions(false);
                        }}
                        className="flex items-center p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-3">
                          <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {action.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* All Navigation Items */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                  All Sections
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onTabChange(item.id);
                          setShowQuickActions(false);
                        }}
                        className={`flex items-center p-2 rounded-lg transition-colors ${
                          isActive 
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}


    </>
  );
};

export default MobileNavigation;
