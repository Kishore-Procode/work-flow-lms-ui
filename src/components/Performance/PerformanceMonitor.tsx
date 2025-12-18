import React, { useEffect, useState } from 'react';
import { Activity, Zap, Clock, Database, Wifi, AlertTriangle } from 'lucide-react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  networkLatency: number;
  apiResponseTime: number;
  errorCount: number;
  lastUpdated: Date;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  showWidget?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  showWidget = false,
  onMetricsUpdate
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    networkLatency: 0,
    apiResponseTime: 0,
    errorCount: 0,
    lastUpdated: new Date()
  });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const measurePerformance = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const memory = (performance as any).memory;
      
      const newMetrics: PerformanceMetrics = {
        loadTime: navigation ? navigation.loadEventEnd - navigation.navigationStart : 0,
        renderTime: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
        memoryUsage: memory ? memory.usedJSHeapSize / 1024 / 1024 : 0, // MB
        networkLatency: measureNetworkLatency(),
        apiResponseTime: getAverageApiResponseTime(),
        errorCount: getErrorCount(),
        lastUpdated: new Date()
      };

      setMetrics(newMetrics);
      onMetricsUpdate?.(newMetrics);
    };

    // Initial measurement
    measurePerformance();

    // Set up periodic monitoring
    const interval = setInterval(measurePerformance, 5000); // Every 5 seconds

    // Monitor API calls
    interceptFetch();

    return () => {
      clearInterval(interval);
      restoreFetch();
    };
  }, [enabled, onMetricsUpdate]);

  const measureNetworkLatency = (): number => {
    const entries = performance.getEntriesByType('resource');
    if (entries.length === 0) return 0;
    
    const latencies = entries.map(entry => entry.responseStart - entry.requestStart);
    return latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length;
  };

  const getAverageApiResponseTime = (): number => {
    const apiTimes = JSON.parse(localStorage.getItem('apiResponseTimes') || '[]');
    if (apiTimes.length === 0) return 0;
    
    return apiTimes.reduce((sum: number, time: number) => sum + time, 0) / apiTimes.length;
  };

  const getErrorCount = (): number => {
    return parseInt(localStorage.getItem('errorCount') || '0');
  };

  const interceptFetch = () => {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        // Store API response time
        const apiTimes = JSON.parse(localStorage.getItem('apiResponseTimes') || '[]');
        apiTimes.push(responseTime);
        
        // Keep only last 50 measurements
        if (apiTimes.length > 50) {
          apiTimes.shift();
        }
        
        localStorage.setItem('apiResponseTimes', JSON.stringify(apiTimes));
        
        return response;
      } catch (error) {
        // Increment error count
        const errorCount = parseInt(localStorage.getItem('errorCount') || '0') + 1;
        localStorage.setItem('errorCount', errorCount.toString());
        throw error;
      }
    };
  };

  const restoreFetch = () => {
    // In a real implementation, you'd store the original fetch reference
    // This is a simplified version
  };

  const getPerformanceStatus = (metric: keyof PerformanceMetrics, value: number): 'good' | 'warning' | 'poor' => {
    switch (metric) {
      case 'loadTime':
        if (value < 2000) return 'good';
        if (value < 5000) return 'warning';
        return 'poor';
      case 'renderTime':
        if (value < 100) return 'good';
        if (value < 300) return 'warning';
        return 'poor';
      case 'memoryUsage':
        if (value < 50) return 'good';
        if (value < 100) return 'warning';
        return 'poor';
      case 'networkLatency':
        if (value < 100) return 'good';
        if (value < 300) return 'warning';
        return 'poor';
      case 'apiResponseTime':
        if (value < 500) return 'good';
        if (value < 1000) return 'warning';
        return 'poor';
      default:
        return 'good';
    }
  };

  const getStatusColor = (status: 'good' | 'warning' | 'poor'): string => {
    switch (status) {
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
    }
  };

  const formatMetric = (metric: keyof PerformanceMetrics, value: number): string => {
    switch (metric) {
      case 'loadTime':
      case 'renderTime':
      case 'networkLatency':
      case 'apiResponseTime':
        return `${Math.round(value)}ms`;
      case 'memoryUsage':
        return `${Math.round(value)}MB`;
      case 'errorCount':
        return value.toString();
      default:
        return value.toString();
    }
  };

  if (!enabled || !showWidget) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 z-50">
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 ${
        isExpanded ? 'w-80' : 'w-12'
      }`}>
        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-12 h-12 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          title="Performance Monitor"
        >
          <Activity className="w-5 h-5" />
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="p-4 pt-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 dark:text-white text-sm">Performance</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {metrics.lastUpdated.toLocaleTimeString()}
              </span>
            </div>

            <div className="space-y-2">
              {/* Load Time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="w-3 h-3 text-blue-600 mr-2" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Load</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  getStatusColor(getPerformanceStatus('loadTime', metrics.loadTime))
                }`}>
                  {formatMetric('loadTime', metrics.loadTime)}
                </span>
              </div>

              {/* Render Time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Zap className="w-3 h-3 text-yellow-600 mr-2" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Render</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  getStatusColor(getPerformanceStatus('renderTime', metrics.renderTime))
                }`}>
                  {formatMetric('renderTime', metrics.renderTime)}
                </span>
              </div>

              {/* Memory Usage */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Database className="w-3 h-3 text-purple-600 mr-2" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Memory</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  getStatusColor(getPerformanceStatus('memoryUsage', metrics.memoryUsage))
                }`}>
                  {formatMetric('memoryUsage', metrics.memoryUsage)}
                </span>
              </div>

              {/* Network Latency */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Wifi className="w-3 h-3 text-blue-600 mr-2" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Network</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  getStatusColor(getPerformanceStatus('networkLatency', metrics.networkLatency))
                }`}>
                  {formatMetric('networkLatency', metrics.networkLatency)}
                </span>
              </div>

              {/* API Response Time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Activity className="w-3 h-3 text-indigo-600 mr-2" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">API</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  getStatusColor(getPerformanceStatus('apiResponseTime', metrics.apiResponseTime))
                }`}>
                  {formatMetric('apiResponseTime', metrics.apiResponseTime)}
                </span>
              </div>

              {/* Error Count */}
              {metrics.errorCount > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="w-3 h-3 text-red-600 mr-2" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Errors</span>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-600">
                    {metrics.errorCount}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  localStorage.removeItem('apiResponseTimes');
                  localStorage.removeItem('errorCount');
                  setMetrics(prev => ({ ...prev, errorCount: 0, apiResponseTime: 0 }));
                }}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Clear Metrics
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceMonitor;

// Hook for accessing performance metrics
export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    const handleMetricsUpdate = (newMetrics: PerformanceMetrics) => {
      setMetrics(newMetrics);
    };

    // This would be connected to the PerformanceMonitor component
    // In a real implementation, you'd use a context or state management solution
    
    return () => {
      // Cleanup
    };
  }, []);

  return metrics;
};
