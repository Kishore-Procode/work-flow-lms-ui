import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

// Simple Chart Components (CSS-based)

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface LineChartProps {
  data: ChartData[];
  height?: number;
  showGrid?: boolean;
  animate?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({ 
  data, 
  height = 200, 
  showGrid = true, 
  animate = true 
}) => {
  const [animationProgress, setAnimationProgress] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setAnimationProgress(1), 100);
      return () => clearTimeout(timer);
    } else {
      setAnimationProgress(1);
    }
  }, [animate]);

  if (!data.length) return null;

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;



  const animatedPoints = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const baseY = 100;
    const targetY = 100 - ((item.value - minValue) / range) * 80;
    const y = baseY + (targetY - baseY) * animationProgress;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        viewBox="0 0 100 100"
        className="overflow-visible"
      >
        {/* Grid */}
        {showGrid && (
          <g className="opacity-20">
            {[0, 25, 50, 75, 100].map(y => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="currentColor"
                strokeWidth="0.2"
              />
            ))}
            {data.map((_, index) => {
              const x = (index / (data.length - 1)) * 100;
              return (
                <line
                  key={index}
                  x1={x}
                  y1="0"
                  x2={x}
                  y2="100"
                  stroke="currentColor"
                  strokeWidth="0.2"
                />
              );
            })}
          </g>
        )}

        {/* Area fill */}
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        <polygon
          points={`0,100 ${animatedPoints} 100,100`}
          fill="url(#areaGradient)"
          className="transition-all duration-1000 ease-out"
        />

        {/* Line */}
        <polyline
          points={animatedPoints}
          fill="none"
          stroke="rgb(34, 197, 94)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-1000 ease-out"
        />

        {/* Data points */}
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * 100;
          const baseY = 100;
          const targetY = 100 - ((item.value - minValue) / range) * 80;
          const y = baseY + (targetY - baseY) * animationProgress;
          
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill="rgb(34, 197, 94)"
              className="transition-all duration-1000 ease-out hover:r-3 cursor-pointer"
            >
              <title>{`${item.label}: ${item.value}`}</title>
            </circle>
          );
        })}
      </svg>

      {/* Labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
        {data.map((item, index) => (
          <span key={index} className="truncate max-w-16">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
};

interface BarChartProps {
  data: ChartData[];
  height?: number;
  horizontal?: boolean;
  animate?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  animate = true
}) => {
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setAnimationProgress(1), 100);
      return () => clearTimeout(timer);
    } else {
      setAnimationProgress(1);
    }
  }, [animate]);

  if (!data.length) return null;

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const percentage = (item.value / maxValue) * 100;
        const animatedPercentage = percentage * animationProgress;
        
        return (
          <div key={index} className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {item.label}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {item.value}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${animatedPercentage}%`,
                  backgroundColor: item.color || `hsl(${index * 60}, 70%, 50%)`
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface DonutChartProps {
  data: ChartData[];
  size?: number;
  innerRadius?: number;
  animate?: boolean;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  size = 200,
  innerRadius = 0.6,
  animate = true
}) => {
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setAnimationProgress(1), 100);
      return () => clearTimeout(timer);
    } else {
      setAnimationProgress(1);
    }
  }, [animate]);

  if (!data.length) return null;

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = size / 2 - 10;
  const innerR = radius * innerRadius;
  const center = size / 2;

  let currentAngle = -90; // Start from top

  const segments = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360 * animationProgress;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    currentAngle += (item.value / total) * 360;

    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startAngleRad);
    const y1 = center + radius * Math.sin(startAngleRad);
    const x2 = center + radius * Math.cos(endAngleRad);
    const y2 = center + radius * Math.sin(endAngleRad);

    const x3 = center + innerR * Math.cos(endAngleRad);
    const y3 = center + innerR * Math.sin(endAngleRad);
    const x4 = center + innerR * Math.cos(startAngleRad);
    const y4 = center + innerR * Math.sin(startAngleRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
      'Z'
    ].join(' ');

    return {
      pathData,
      color: item.color || `hsl(${index * 60}, 70%, 50%)`,
      label: item.label,
      value: item.value,
      percentage: percentage.toFixed(1)
    };
  });

  return (
    <div className="flex items-center space-x-6">
      <div className="relative">
        <svg width={size} height={size}>
          {segments.map((segment, index) => (
            <path
              key={index}
              d={segment.pathData}
              fill={segment.color}
              className="hover:opacity-80 cursor-pointer transition-opacity duration-200"
            >
              <title>{`${segment.label}: ${segment.value} (${segment.percentage}%)`}</title>
            </path>
          ))}
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {total}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <div className="text-sm">
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {segment.label}
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-2">
                {segment.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  color = 'blue'
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600',
    yellow: 'from-yellow-500 to-yellow-600',
    indigo: 'from-indigo-500 to-indigo-600'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-soft border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {value}
          </p>
          {change && (
            <div className="flex items-center mt-2">
              {change.type === 'increase' ? (
                <TrendingUp className="w-4 h-4 text-blue-500 mr-1" />
              ) : change.type === 'decrease' ? (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              ) : (
                <Activity className="w-4 h-4 text-gray-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                change.type === 'increase' ? 'text-blue-600' :
                change.type === 'decrease' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {change.value}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  animate?: boolean;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  size = 120,
  strokeWidth = 8,
  color = '#22c55e',
  label,
  animate = true
}) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setAnimatedPercentage(percentage), 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedPercentage(percentage);
    }
  }, [percentage, animate]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {Math.round(animatedPercentage)}%
          </div>
          {label && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// PieChart as an alias for DonutChart with no inner radius
export const PieChart: React.FC<DonutChartProps> = (props) => (
  <DonutChart {...props} innerRadius={0} />
);
