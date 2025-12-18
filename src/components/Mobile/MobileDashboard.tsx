import React, { useState, useEffect } from 'react';
import { 
  TreePine, 
  Users, 
  TrendingUp, 
  Award,
  Camera,
  Bell,
  Calendar,
  MapPin,
  Droplets,
  Sun,
  Activity
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useDashboardData } from '../../hooks/useDashboardData';
import { MobileStatCard, MobileListItem, MobileActionCard } from './MobileCard';
import { FadeIn, Stagger } from '../UI/Animations';
import LoadingSpinner from '../UI/LoadingSpinner';

const MobileDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data, loading, error } = useDashboardData();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-500 mb-2">Failed to load dashboard</div>
        <button 
          onClick={() => window.location.reload()}
          className="text-blue-600 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const renderStudentDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <FadeIn>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <h2 className="text-xl font-bold mb-2">
            {greeting}, {user?.name?.split(' ')[0]}! 🌱
          </h2>
          <p className="text-blue-100 text-sm">
            Ready to care for your tree today?
          </p>
        </div>
      </FadeIn>

      {/* Quick Stats */}
      <Stagger className="grid grid-cols-2 gap-4">
        <MobileStatCard
          title="My Trees"
          value={data?.myTrees || 0}
          icon={TreePine}
          color="blue"
        />
        <MobileStatCard
          title="Photos Uploaded"
          value={data?.photosUploaded || 0}
          icon={Camera}
          color="blue"
        />
      </Stagger>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-3">
          <MobileActionCard
            title="Upload Tree Photo"
            description="Share your tree's progress"
            icon={Camera}
            action={{
              label: "Take Photo",
              onClick: () => console.log('Take photo')
            }}
            color="blue"
          />
          <MobileActionCard
            title="Find Perfect Tree"
            description="Get personalized recommendations"
            icon={TreePine}
            action={{
              label: "Discover Trees",
              onClick: () => console.log('Discover trees')
            }}
            color="blue"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
        <div className="space-y-2">
          <MobileListItem
            title="Tree Care Reminder"
            subtitle="Your Neem tree needs watering"
            icon={Droplets}
            badge={{ text: "Today", color: "blue" }}
            onClick={() => console.log('View reminder')}
          />
          <MobileListItem
            title="Photo Uploaded"
            subtitle="Progress photo from 2 days ago"
            icon={Camera}
            badge={{ text: "New", color: "blue" }}
            onClick={() => console.log('View photo')}
          />
        </div>
      </div>
    </div>
  );

  const renderStaffDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <FadeIn>
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
          <h2 className="text-xl font-bold mb-2">
            {greeting}, {user?.name?.split(' ')[0]}! 👨‍🏫
          </h2>
          <p className="text-blue-100 text-sm">
            {data?.studentsInClass || 0} students in your class
          </p>
        </div>
      </FadeIn>

      {/* Quick Stats */}
      <Stagger className="grid grid-cols-2 gap-4">
        <MobileStatCard
          title="My Students"
          value={data?.studentsInClass || 0}
          icon={Users}
          color="blue"
        />
        <MobileStatCard
          title="Trees Assigned"
          value={data?.treesAssigned || 0}
          icon={TreePine}
          color="blue"
        />
      </Stagger>

      {/* Students Needing Help */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Students Needing Help</h3>
        <div className="space-y-2">
          <MobileListItem
            title="Rahul Kumar"
            subtitle="No photo uploaded in 2 weeks"
            icon={Camera}
            badge={{ text: "Urgent", color: "red" }}
            onClick={() => console.log('Help student')}
          />
          <MobileListItem
            title="Priya Sharma"
            subtitle="Tree showing signs of stress"
            icon={TreePine}
            badge={{ text: "Care Needed", color: "yellow" }}
            onClick={() => console.log('Help student')}
          />
        </div>
      </div>
    </div>
  );

  const renderHODDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <FadeIn>
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 text-white">
          <h2 className="text-xl font-bold mb-2">
            {greeting}, Dr. {user?.name?.split(' ')[0]}! 🎓
          </h2>
          <p className="text-purple-100 text-sm">
            Department Overview & Management
          </p>
        </div>
      </FadeIn>

      {/* Department Stats */}
      <Stagger className="grid grid-cols-2 gap-4">
        <MobileStatCard
          title="Total Students"
          value={data?.totalStudents || 0}
          change={{ value: "+5 this month", type: "increase" }}
          icon={Users}
          color="purple"
        />
        <MobileStatCard
          title="Trees Planted"
          value={data?.treesPlanted || 0}
          change={{ value: "85% assigned", type: "increase" }}
          icon={TreePine}
          color="blue"
        />
      </Stagger>

      {/* Department Performance */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Department Performance</h3>
        <div className="space-y-2">
          <MobileListItem
            title="Photo Upload Rate"
            subtitle="78% students uploaded this week"
            icon={TrendingUp}
            badge={{ text: "Good", color: "blue" }}
            onClick={() => console.log('View details')}
          />
          <MobileListItem
            title="Tree Health Score"
            subtitle="Average health: 8.2/10"
            icon={Activity}
            badge={{ text: "Excellent", color: "blue" }}
            onClick={() => console.log('View details')}
          />
        </div>
      </div>
    </div>
  );

  const renderPrincipalDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <FadeIn>
        <div className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl p-6 text-white">
          <h2 className="text-xl font-bold mb-2">
            {greeting}, Dr. {user?.name?.split(' ')[0]}! 🏛️
          </h2>
          <p className="text-indigo-100 text-sm">
            College-wide Tree Initiative Overview
          </p>
        </div>
      </FadeIn>

      {/* College Stats */}
      <Stagger className="grid grid-cols-2 gap-4">
        <MobileStatCard
          title="Total Students"
          value={data?.totalStudents || 0}
          change={{ value: "+12% growth", type: "increase" }}
          icon={Users}
          color="blue"
        />
        <MobileStatCard
          title="Trees Planted"
          value={data?.totalTrees || 0}
          change={{ value: "92% success", type: "increase" }}
          icon={TreePine}
          color="blue"
        />
      </Stagger>

      {/* College Performance */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">College Performance</h3>
        <div className="space-y-2">
          <MobileListItem
            title="Computer Science Dept"
            subtitle="95% participation rate"
            icon={Award}
            badge={{ text: "Top Performer", color: "blue" }}
            onClick={() => console.log('View department')}
          />
          <MobileListItem
            title="Mechanical Dept"
            subtitle="87% participation rate"
            icon={TrendingUp}
            badge={{ text: "Good", color: "blue" }}
            onClick={() => console.log('View department')}
          />
        </div>
      </div>
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <FadeIn>
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 text-white">
          <h2 className="text-xl font-bold mb-2">
            {greeting}, {user?.name?.split(' ')[0]}! ⚡
          </h2>
          <p className="text-gray-300 text-sm">
            System Administration & Analytics
          </p>
        </div>
      </FadeIn>

      {/* System Stats */}
      <Stagger className="grid grid-cols-2 gap-4">
        <MobileStatCard
          title="Total Colleges"
          value={data?.totalColleges || 0}
          icon={Users}
          color="blue"
        />
        <MobileStatCard
          title="System Trees"
          value={data?.totalTrees || 0}
          change={{ value: "+15% growth", type: "increase" }}
          icon={TreePine}
          color="blue"
        />
      </Stagger>

      {/* System Health */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">System Health</h3>
        <div className="space-y-2">
          <MobileListItem
            title="Active Users"
            subtitle="1,247 users online"
            icon={Activity}
            badge={{ text: "Healthy", color: "blue" }}
            onClick={() => console.log('View users')}
          />
          <MobileListItem
            title="Data Sync"
            subtitle="All systems synchronized"
            icon={TrendingUp}
            badge={{ text: "Online", color: "blue" }}
            onClick={() => console.log('View sync')}
          />
        </div>
      </div>
    </div>
  );

  const renderDashboardContent = () => {
    switch (user?.role) {
      case 'student':
        return renderStudentDashboard();
      case 'staff':
        return renderStaffDashboard();
      case 'hod':
        return renderHODDashboard();
      case 'principal':
        return renderPrincipalDashboard();
      case 'admin':
        return renderAdminDashboard();
      default:
        return renderStudentDashboard();
    }
  };

  return (
    <div className="p-4 pb-20 max-w-md mx-auto">
      {renderDashboardContent()}
    </div>
  );
};

export default MobileDashboard;
