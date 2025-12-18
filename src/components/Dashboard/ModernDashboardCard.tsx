import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface ModernDashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down';
  };
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral' | 'academic';
  loading?: boolean;
  onClick?: () => void;
}

const ModernDashboardCard: React.FC<ModernDashboardCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'primary',
  loading = false,
  onClick,
}) => {
  const colorClasses = {
    primary: {
      bg: 'bg-primary-50 dark:bg-primary-900/20',
      icon: 'text-primary-600 dark:text-primary-400',
      iconBg: 'bg-primary-100 dark:bg-primary-800',
      border: 'border-primary-200 dark:border-primary-800',
    },
    secondary: {
      bg: 'bg-secondary-50 dark:bg-secondary-900/20',
      icon: 'text-secondary-600 dark:text-secondary-400',
      iconBg: 'bg-secondary-100 dark:bg-secondary-800',
      border: 'border-secondary-200 dark:border-secondary-800',
    },
    success: {
      bg: 'bg-success-50 dark:bg-success-900/20',
      icon: 'text-success-600 dark:text-success-400',
      iconBg: 'bg-success-100 dark:bg-success-800',
      border: 'border-success-200 dark:border-success-800',
    },
    warning: {
      bg: 'bg-warning-50 dark:bg-warning-900/20',
      icon: 'text-warning-600 dark:text-warning-400',
      iconBg: 'bg-warning-100 dark:bg-warning-800',
      border: 'border-warning-200 dark:border-warning-800',
    },
    error: {
      bg: 'bg-error-50 dark:bg-error-900/20',
      icon: 'text-error-600 dark:text-error-400',
      iconBg: 'bg-error-100 dark:bg-error-800',
      border: 'border-error-200 dark:border-error-800',
    },
    neutral: {
      bg: 'bg-neutral-50 dark:bg-neutral-800',
      icon: 'text-neutral-600 dark:text-neutral-400',
      iconBg: 'bg-neutral-100 dark:bg-neutral-700',
      border: 'border-neutral-200 dark:border-neutral-700',
    },
    academic: {
      bg: 'bg-academic-50 dark:bg-academic-900/20',
      icon: 'text-academic-600 dark:text-academic-400',
      iconBg: 'bg-academic-100 dark:bg-academic-800',
      border: 'border-academic-200 dark:border-academic-800',
    },
  };

  const classes = colorClasses[color];

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="skeleton-text w-24 mb-2"></div>
              <div className="skeleton-title w-16 mb-2"></div>
              <div className="skeleton-text w-20"></div>
            </div>
            <div className="skeleton w-12 h-12 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        card transition-all duration-200
        ${onClick ? 'card-interactive' : ''}
        ${classes.bg} ${classes.border}
      `}
      onClick={onClick}
    >
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {/* Title */}
            <p className="text-body-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              {title}
            </p>
            
            {/* Value */}
            <p className="text-heading-2 font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            
            {/* Subtitle and Trend */}
            <div className="flex items-center space-x-2">
              {subtitle && (
                <p className="text-body-sm text-neutral-500 dark:text-neutral-400">
                  {subtitle}
                </p>
              )}
              
              {trend && (
                <div className={`
                  flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium
                  ${trend.direction === 'up' 
                    ? 'bg-success-100 text-success-800 dark:bg-success-800 dark:text-success-100' 
                    : 'bg-error-100 text-error-800 dark:bg-error-800 dark:text-error-100'
                  }
                `}>
                  {trend.direction === 'up' ? (
                    <ArrowUpIcon className="w-3 h-3" />
                  ) : (
                    <ArrowDownIcon className="w-3 h-3" />
                  )}
                  <span>{Math.abs(trend.value)}%</span>
                  <span className="text-neutral-500 dark:text-neutral-400">
                    {trend.label}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Icon */}
          {Icon && (
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center
              ${classes.iconBg}
            `}>
              <Icon className={`w-6 h-6 ${classes.icon}`} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModernDashboardCard;
