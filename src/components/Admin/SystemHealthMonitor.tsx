import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Server, 
  Database, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Zap,
  HardDrive,
  Cpu,
  Wifi
} from 'lucide-react';
import { ApiService } from '../../services/api';

interface SystemHealthData {
  status: 'healthy' | 'warning' | 'critical';
  timestamp: string;
  services: {
    database: {
      status: 'healthy' | 'warning' | 'critical';
      responseTime: string;
      connections: number;
      maxConnections: number;
    };
    api: {
      status: 'healthy' | 'warning' | 'critical';
      uptime: number;
      requestsPerMinute: number;
      errorRate: number;
    };
    memory: {
      status: 'healthy' | 'warning' | 'critical';
      usage: {
        rss: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
      };
    };
  };
  metrics: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    activeUsers: number;
  };
}

export const SystemHealthMonitor: React.FC = () => {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getSystemHealth();
      setHealthData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchHealthData, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'critical': return <AlertTriangle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading && !healthData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading system health...</span>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Failed to load system health data</p>
        <button
          onClick={fetchHealthData}
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
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Activity className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">System Health Monitor</h2>
            <p className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Auto-refresh</span>
          </label>
          
          <button
            onClick={fetchHealthData}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Overall Status */}
      <div className={`p-6 rounded-xl border-2 ${
        healthData.status === 'healthy' ? 'border-blue-200 bg-blue-50' :
        healthData.status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
        'border-red-200 bg-red-50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(healthData.status)}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                System Status: {healthData.status.toUpperCase()}
              </h3>
              <p className="text-sm text-gray-600">
                All critical services are being monitored
              </p>
            </div>
          </div>
          
          <div className={`px-4 py-2 rounded-full font-medium ${getStatusColor(healthData.status)}`}>
            {healthData.status.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Service Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Database Status */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Database className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Database</h3>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(healthData.services.database.status)}`}>
              {healthData.services.database.status}
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Response Time:</span>
              <span className="font-medium">{healthData.services.database.responseTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Connections:</span>
              <span className="font-medium">
                {healthData.services.database.connections}/{healthData.services.database.maxConnections}
              </span>
            </div>
          </div>
        </div>

        {/* API Status */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Server className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">API Server</h3>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(healthData.services.api.status)}`}>
              {healthData.services.api.status}
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Uptime:</span>
              <span className="font-medium">{formatUptime(healthData.services.api.uptime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Requests/min:</span>
              <span className="font-medium">{healthData.services.api.requestsPerMinute}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Error Rate:</span>
              <span className="font-medium">{healthData.services.api.errorRate}%</span>
            </div>
          </div>
        </div>

        {/* Memory Status */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <HardDrive className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Memory</h3>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(healthData.services.memory.status)}`}>
              {healthData.services.memory.status}
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">RSS:</span>
              <span className="font-medium">{formatBytes(healthData.services.memory.usage.rss)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Heap Used:</span>
              <span className="font-medium">{formatBytes(healthData.services.memory.usage.heapUsed)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Heap Total:</span>
              <span className="font-medium">{formatBytes(healthData.services.memory.usage.heapTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Metrics</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{healthData.metrics.totalRequests.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{healthData.metrics.averageResponseTime}ms</div>
            <div className="text-sm text-gray-600">Avg Response Time</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{healthData.metrics.errorRate}%</div>
            <div className="text-sm text-gray-600">Error Rate</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{healthData.metrics.activeUsers}</div>
            <div className="text-sm text-gray-600">Active Users</div>
          </div>
        </div>
      </div>
    </div>
  );
};
