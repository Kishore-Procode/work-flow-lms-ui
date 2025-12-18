import React, { useState, useEffect } from 'react';
import {
  TreePine,
  Camera,
  Calendar,
  TrendingUp,
  Award,
  MapPin,
  Ruler,
  Droplets,
  Sun,
  Thermometer,
  Activity,
  Upload,
  Eye,
  BarChart3,
  LineChart,
  PieChart
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ApiService } from '../../services/api';
import TreeGrowthVisualization from '../Visualization/TreeGrowthVisualization';

interface TreeData {
  id: string;
  treeCode: string;
  species: string;
  plantedDate: string;
  locationDescription: string;
  assignedStudentId: string;
  status: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

interface TreeImage {
  id: string;
  imageUrl: string;
  caption?: string;
  createdAt: string;
  imageType: string;
  measurements?: {
    height: number;
    diameter: number;
    notes?: string;
  };
}

interface TreeProgress {
  tree: TreeData;
  images: TreeImage[];
  totalImages: number;
  lastUpdate: string;
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor';
  growthRate: number;
  careScore: number;
  milestones: {
    planted: boolean;
    firstPhoto: boolean;
    monthlyPhotos: boolean;
    healthyGrowth: boolean;
  };
  measurements: {
    current: { height: number; diameter: number };
    previous: { height: number; diameter: number };
    growth: { height: number; diameter: number };
  };
}

const EnhancedTreeProgress: React.FC = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<TreeProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedView, setSelectedView] = useState<'overview' | 'timeline' | 'analytics'>('overview');

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const [treeData, images] = await Promise.all([
        ApiService.getMyTree(),
        ApiService.getTreeImages()
      ]);

      if (treeData) {
        // Calculate measurements and growth
        const sortedImages = images?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];
        const latestImage = sortedImages[0];
        const previousImage = sortedImages[1];

        const currentMeasurements = latestImage?.measurements || { height: 0, diameter: 0 };
        const previousMeasurements = previousImage?.measurements || { height: 0, diameter: 0 };

        const heightGrowth = currentMeasurements.height - previousMeasurements.height;
        const diameterGrowth = currentMeasurements.diameter - previousMeasurements.diameter;

        // Calculate care score based on various factors
        const daysSincePlanted = Math.floor((new Date().getTime() - new Date(treeData.plantedDate).getTime()) / (1000 * 60 * 60 * 24));
        const expectedPhotos = Math.max(1, Math.floor(daysSincePlanted / 30)); // Monthly photos
        const photoScore = Math.min(100, (images?.length || 0) / expectedPhotos * 100);
        const growthScore = heightGrowth > 0 ? 100 : 50;
        const consistencyScore = images?.length > 0 ? 100 : 0;
        const careScore = Math.round((photoScore + growthScore + consistencyScore) / 3);

        setProgress({
          tree: treeData,
          images: images || [],
          totalImages: images?.length || 0,
          lastUpdate: images?.[0]?.createdAt || treeData.plantedDate,
          healthStatus: careScore > 80 ? 'excellent' : careScore > 60 ? 'good' : careScore > 40 ? 'fair' : 'poor',
          growthRate: heightGrowth > 0 ? Math.round((heightGrowth / previousMeasurements.height) * 100) : 0,
          careScore,
          milestones: {
            planted: true,
            firstPhoto: (images?.length || 0) > 0,
            monthlyPhotos: (images?.length || 0) >= expectedPhotos,
            healthyGrowth: heightGrowth > 0
          },
          measurements: {
            current: currentMeasurements,
            previous: previousMeasurements,
            growth: { height: heightGrowth, diameter: diameterGrowth }
          }
        });
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysPlanted = () => {
    if (!progress) return 0;
    const plantedDate = new Date(progress.tree.plantedDate);
    const today = new Date();
    return Math.floor((today.getTime() - plantedDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const generateGrowthData = (progressData: TreeProgress) => {
    // Generate mock growth data based on actual progress
    const startDate = new Date(progressData.tree.plantedDate);
    const daysSincePlanting = getDaysPlanted();
    const data = [];

    for (let i = 0; i <= daysSincePlanting; i += 7) { // Weekly data points
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      // Simulate growth curve
      const growthFactor = Math.min(1, i / (daysSincePlanting || 1));
      const baseHeight = 10; // Starting height
      const maxHeight = progressData.measurements.current.height || 50;
      const height = baseHeight + (maxHeight - baseHeight) * growthFactor;

      data.push({
        date: currentDate.toISOString(),
        height: Math.round(height + (Math.random() - 0.5) * 5), // Add some variation
        diameter: Math.round((height / 10) + (Math.random() - 0.5) * 2),
        leafCount: Math.round(height * 2 + Math.random() * 20),
        healthScore: Math.max(50, Math.min(100, progressData.careScore + (Math.random() - 0.5) * 20)),
        weather: {
          temperature: Math.round(20 + Math.random() * 15),
          humidity: Math.round(40 + Math.random() * 40),
          rainfall: Math.round(Math.random() * 10)
        }
      });
    }

    return data;
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-blue-600 bg-blue-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    trend?: { value: string; isPositive: boolean };
    subtitle?: string;
  }> = ({ title, value, icon: Icon, color, trend, subtitle }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${color}-100 dark:bg-${color}-900`}>
          <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          <span className={`text-sm font-medium ${trend.isPositive ? 'text-blue-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↗' : '↘'} {trend.value}
          </span>
          <span className="text-sm text-gray-500 ml-2">vs last month</span>
        </div>
      )}
    </div>
  );

  const MilestoneCard: React.FC<{
    title: string;
    completed: boolean;
    description: string;
  }> = ({ title, completed, description }) => (
    <div className={`p-4 rounded-lg border-2 ${completed ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex items-center space-x-3">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${completed ? 'bg-blue-600' : 'bg-gray-400'}`}>
          {completed && <span className="text-white text-sm">✓</span>}
        </div>
        <div>
          <h4 className={`font-medium ${completed ? 'text-blue-800' : 'text-gray-600'}`}>{title}</h4>
          <p className={`text-sm ${completed ? 'text-blue-600' : 'text-gray-500'}`}>{description}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="text-center py-12">
        <TreePine className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Tree Assigned</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">You haven't been assigned a tree yet. Please contact your instructor or select a tree from the available options.</p>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Browse Available Trees
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Tree Progress</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {progress.tree.species} • {progress.tree.treeCode} • Planted {getDaysPlanted()} days ago
          </p>
        </div>
        
        <div className="mt-4 lg:mt-0 flex items-center space-x-3">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(progress.healthStatus)}`}>
            {progress.healthStatus.charAt(0).toUpperCase() + progress.healthStatus.slice(1)} Health
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Camera className="w-4 h-4" />
            <span>Upload Photo</span>
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'timeline', label: 'Timeline', icon: Calendar },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedView(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedView === tab.id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedView === 'overview' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Days Planted"
              value={getDaysPlanted()}
              icon={Calendar}
              color="blue"
              subtitle="Since planting"
            />
            <StatCard
              title="Photos Uploaded"
              value={progress.totalImages}
              icon={Camera}
              color="blue"
              subtitle="Total documentation"
            />
            <StatCard
              title="Growth Rate"
              value={`${progress.growthRate}%`}
              icon={TrendingUp}
              color="purple"
              trend={{ value: `+${progress.measurements.growth.height}cm`, isPositive: progress.measurements.growth.height > 0 }}
            />
            <StatCard
              title="Care Score"
              value={progress.careScore}
              icon={Award}
              color="yellow"
              subtitle="Out of 100"
            />
          </div>

          {/* Measurements */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Measurements</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Ruler className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{progress.measurements.current.height}cm</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Height</p>
                {progress.measurements.growth.height > 0 && (
                  <p className="text-xs text-blue-600 mt-1">+{progress.measurements.growth.height}cm growth</p>
                )}
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TreePine className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{progress.measurements.current.diameter}cm</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Diameter</p>
                {progress.measurements.growth.diameter > 0 && (
                  <p className="text-xs text-blue-600 mt-1">+{progress.measurements.growth.diameter}cm growth</p>
                )}
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MapPin className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{progress.tree.locationDescription}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
              </div>
            </div>
          </div>

          {/* Milestones */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Milestones</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MilestoneCard
                title="Tree Planted"
                completed={progress.milestones.planted}
                description="Successfully planted your assigned tree"
              />
              <MilestoneCard
                title="First Photo"
                completed={progress.milestones.firstPhoto}
                description="Uploaded your first progress photo"
              />
              <MilestoneCard
                title="Monthly Documentation"
                completed={progress.milestones.monthlyPhotos}
                description="Consistently uploading monthly photos"
              />
              <MilestoneCard
                title="Healthy Growth"
                completed={progress.milestones.healthyGrowth}
                description="Tree showing positive growth signs"
              />
            </div>
          </div>
        </>
      )}

      {/* Timeline Tab with Growth Visualization */}
      {selectedView === 'timeline' && (
        <TreeGrowthVisualization
          treeId={progress.tree.id}
          data={generateGrowthData(progress)}
          className="mb-6"
        />
      )}

      {/* Analytics Tab */}
      {selectedView === 'analytics' && (
        <div className="space-y-6">
          <TreeGrowthVisualization
            treeId={progress.tree.id}
            data={generateGrowthData(progress)}
            className="mb-6"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Growth Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Average Growth Rate</span>
                  <span className="font-medium text-gray-900 dark:text-white">{progress.growthRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Days Since Planting</span>
                  <span className="font-medium text-gray-900 dark:text-white">{getDaysPlanted()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Photo Frequency</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {Math.round(progress.totalImages / (getDaysPlanted() / 30))} per month
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Health Trends</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Current Health</span>
                  <span className={`font-medium ${getHealthColor(progress.healthStatus).split(' ')[0]}`}>
                    {progress.healthStatus.charAt(0).toUpperCase() + progress.healthStatus.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Care Consistency</span>
                  <span className="font-medium text-gray-900 dark:text-white">{progress.careScore}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Growth Trend</span>
                  <span className="font-medium text-blue-600">
                    {progress.measurements.growth.height > 0 ? '↗ Positive' : '→ Stable'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedTreeProgress;
