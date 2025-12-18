import React, { useState } from 'react';
import {
  Menu,
  X,
  Bell,
  User,
  LogOut,
  Home,
  Users,
  TreePine,
  BarChart3,
  Settings,
  Building,
  UserCheck,
  Calendar,
  Award
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useDashboardData } from '../../hooks/useDashboardData';

// Mobile Dashboard Components
const MobileAdminDashboard = () => {
  const { data, loading, error } = useDashboardData();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-gray-200 rounded-2xl p-6 animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-200 rounded-xl p-4 animate-pulse">
            <div className="h-16 bg-gray-300 rounded"></div>
          </div>
          <div className="bg-gray-200 rounded-xl p-4 animate-pulse">
            <div className="h-16 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-red-800 mb-2">Error Loading Data</h2>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning!' : currentHour < 18 ? 'Good Afternoon!' : 'Good Evening!';

  return (
    <div className="space-y-4">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-blue-500 to-emerald-600 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-bold mb-2">{greeting}</h2>
        <p className="text-blue-100">System Administration & Analytics</p>
        <div className="mt-4 flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
          <span className="text-sm text-blue-100">System Online</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Colleges</p>
              <p className="text-xl font-bold text-gray-900">{data?.totalColleges || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TreePine className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">System Trees</p>
              <p className="text-xl font-bold text-gray-900">{data?.totalTrees || 0}</p>
              <p className="text-xs text-blue-600">+{data?.treeGrowthPercentage || 0}% growth</p>
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-3">System Health</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">A. Healthy</p>
                <p className="text-xs text-gray-500">{data?.activeUsers || 0} users online</p>
              </div>
            </div>
            <span className="text-xs text-blue-600 font-medium">Online</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">D. Online</p>
                <p className="text-xs text-gray-500">All systems synchronized</p>
              </div>
            </div>
            <span className="text-xs text-blue-600 font-medium">Synced</span>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Users</p>
              <p className="text-xl font-bold text-gray-900">{data?.totalUsers || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <UserCheck className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Active Students</p>
              <p className="text-xl font-bold text-gray-900">{data?.activeStudents || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <button className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-left">
            <Building className="w-5 h-5 text-blue-600 mb-2" />
            <p className="text-sm font-medium text-blue-900">Add College</p>
            <p className="text-xs text-blue-600">Create new</p>
          </button>

          <button className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-left">
            <Users className="w-5 h-5 text-blue-600 mb-2" />
            <p className="text-sm font-medium text-blue-900">Manage Users</p>
            <p className="text-xs text-blue-600">View all</p>
          </button>

          <button className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-left">
            <BarChart3 className="w-5 h-5 text-purple-600 mb-2" />
            <p className="text-sm font-medium text-purple-900">Reports</p>
            <p className="text-xs text-purple-600">Analytics</p>
          </button>

          <button className="p-3 bg-orange-50 rounded-lg border border-orange-200 text-left">
            <Settings className="w-5 h-5 text-orange-600 mb-2" />
            <p className="text-sm font-medium text-orange-900">Settings</p>
            <p className="text-xs text-orange-600">Configure</p>
          </button>
        </div>
      </div>
    </div>
  );
};

// Mobile Student Dashboard
const MobileStudentDashboard = () => {
  const { data, loading } = useDashboardData();

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-bold mb-2">My Tree Journey</h2>
        <p className="text-blue-100">Monitor and care for your assigned tree</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TreePine className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">My Tree</p>
              <p className="text-lg font-bold text-gray-900">{data?.myTreeCode || 'Not Assigned'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Days Caring</p>
              <p className="text-lg font-bold text-gray-900">{data?.daysCaring || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mobile Principal Dashboard
const MobilePrincipalDashboard = () => {
  const { data, loading } = useDashboardData();

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-bold mb-2">College Overview</h2>
        <p className="text-purple-100">Manage your institution's tree program</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Students</p>
              <p className="text-lg font-bold text-gray-900">{data?.totalStudents || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TreePine className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Trees Assigned</p>
              <p className="text-lg font-bold text-gray-900">{data?.treesAssigned || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mobile HOD Dashboard
const MobileHODDashboard = () => {
  const { data, loading } = useDashboardData();

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-bold mb-2">Department Overview</h2>
        <p className="text-orange-100">Monitor your department's progress</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Dept Students</p>
              <p className="text-lg font-bold text-gray-900">{data?.departmentStudents || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TreePine className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Active Trees</p>
              <p className="text-lg font-bold text-gray-900">{data?.activeTrees || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mobile Staff Dashboard
const MobileStaffDashboard = () => {
  const { data, loading } = useDashboardData();

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-bold mb-2">Class Management</h2>
        <p className="text-teal-100">Monitor your students' tree care</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">My Students</p>
              <p className="text-lg font-bold text-gray-900">{data?.myStudents || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Award className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Achievements</p>
              <p className="text-lg font-bold text-gray-900">{data?.achievements || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Placeholder components for other sections
const MobileCollegeManagement = () => (
  <div className="text-center py-12">
    <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">College Management</h3>
    <p className="text-gray-500">Manage colleges and institutions</p>
  </div>
);

const MobileUserManagement = () => (
  <div className="text-center py-12">
    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">User Management</h3>
    <p className="text-gray-500">Manage system users</p>
  </div>
);

const MobileReports = () => (
  <div className="text-center py-12">
    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">Reports & Analytics</h3>
    <p className="text-gray-500">View system reports</p>
  </div>
);

const MobileSettings = () => (
  <div className="text-center py-12">
    <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">Settings</h3>
    <p className="text-gray-500">Configure system settings</p>
  </div>
);

interface MobileAppProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const MobileApp: React.FC<MobileAppProps> = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getPageTitle = (tab: string) => {
    const titles: Record<string, string> = {
      'dashboard': 'Dashboard',
      'colleges': 'Colleges',
      'users': 'Users',
      'reports': 'Reports',
      'settings': 'Settings'
    };
    return titles[tab] || 'Student - ACT';
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setShowUserMenu(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getNavigationItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Home', icon: Home }
    ];

    switch (user?.role) {
      case 'admin':
        return [
          ...baseItems,
          { id: 'colleges', label: 'Colleges', icon: Building },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'reports', label: 'Reports', icon: BarChart3 },
          { id: 'settings', label: 'Settings', icon: Settings }
        ];
      case 'principal':
        return [
          ...baseItems,
          { id: 'departments', label: 'Departments', icon: Building },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'reports', label: 'Reports', icon: BarChart3 },
          { id: 'settings', label: 'Settings', icon: Settings }
        ];
      case 'hod':
        return [
          ...baseItems,
          { id: 'students', label: 'Students', icon: Users },
          { id: 'staff', label: 'Staff', icon: UserCheck },
          { id: 'reports', label: 'Reports', icon: BarChart3 },
          { id: 'settings', label: 'Settings', icon: Settings }
        ];
      case 'staff':
        return [
          ...baseItems,
          { id: 'my-students', label: 'My Students', icon: Users },
          { id: 'reports', label: 'Reports', icon: BarChart3 },
          { id: 'settings', label: 'Settings', icon: Settings }
        ];
      case 'student':
        return [
          ...baseItems,
          { id: 'my-tree', label: 'My Tree', icon: TreePine },
          { id: 'guidelines', label: 'Guidelines', icon: Award },
          { id: 'settings', label: 'Settings', icon: Settings }
        ];
      default:
        return [
          ...baseItems,
          { id: 'colleges', label: 'Colleges', icon: Building },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'reports', label: 'Reports', icon: BarChart3 },
          { id: 'settings', label: 'Settings', icon: Settings }
        ];
    }
  };

  const navigationItems = getNavigationItems();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        // Render different dashboards based on user role
        if (user?.role === 'admin') {
          return <MobileAdminDashboard />;
        } else if (user?.role === 'student') {
          return <MobileStudentDashboard />;
        } else if (user?.role === 'principal') {
          return <MobilePrincipalDashboard />;
        } else if (user?.role === 'hod') {
          return <MobileHODDashboard />;
        } else if (user?.role === 'staff') {
          return <MobileStaffDashboard />;
        } else {
          return <MobileAdminDashboard />;
        }
      case 'colleges':
        return <MobileCollegeManagement />;
      case 'users':
        return <MobileUserManagement />;
      case 'reports':
        return <MobileReports />;
      case 'settings':
        return <MobileSettings />;
      default:
        return <MobileAdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile App Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {getPageTitle(activeTab)}
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors relative">
            <Bell className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </button>
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="p-1 rounded-full bg-blue-100 text-blue-600"
          >
            <User className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile App Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-20">
        {renderContent()}
      </main>

      {/* Mobile App Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-30">
        <div className="flex justify-around">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl z-50 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* User Profile Section */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user?.name || 'Admin User'}</p>
                  <p className="text-sm text-gray-500">{user?.email || 'admin@example.com'}</p>
                  <p className="text-xs text-blue-600 font-medium">{user?.role || 'Admin'}</p>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="p-4">
              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onTabChange(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Sign Out Button */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Menu Dropdown */}
      {showUserMenu && (
        <div className="fixed top-16 right-4 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-40 min-w-48">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin User'}</p>
            <p className="text-xs text-gray-500">{user?.email || 'admin@example.com'}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MobileApp;
