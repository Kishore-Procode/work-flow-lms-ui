import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  border?: boolean;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  shadow = 'sm',
  rounded = 'lg',
  border = true,
  hover = false
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl'
  };

  return (
    <div
      className={`
        bg-white dark:bg-neutral-800
        ${paddingClasses[padding]}
        ${shadowClasses[shadow]}
        ${roundedClasses[rounded]}
        ${border ? 'border border-gray-200 dark:border-neutral-700' : ''}
        ${hover ? 'hover:shadow-lg transition-shadow duration-200' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'blue' | 'blue' | 'purple' | 'red' | 'yellow' | 'indigo';
  onClick?: () => void;
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  color = 'blue',
  onClick,
  subtitle
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'bg-blue-500',
      text: 'text-blue-600'
    },
    primary: {
      bg: 'bg-primary-50',
      icon: 'bg-primary-500',
      text: 'text-primary-600'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'bg-purple-500',
      text: 'text-purple-600'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'bg-red-500',
      text: 'text-red-600'
    },
    yellow: {
      bg: 'bg-yellow-50',
      icon: 'bg-yellow-500',
      text: 'text-yellow-600'
    },
    indigo: {
      bg: 'bg-indigo-50',
      icon: 'bg-indigo-500',
      text: 'text-indigo-600'
    }
  };

  const colors = colorClasses[color];

  return (
    <Card
      className={`${colors.bg} ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
      onClick={onClick}
      hover={!!onClick}
    >
      <div className="flex items-center">
        {Icon && (
          <div className={`${colors.icon} p-3 rounded-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
        <div className={`${Icon ? 'ml-4' : ''} flex-1`}>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {trend && (
              <span
                className={`ml-2 text-sm font-medium ${
                  trend.isPositive ? 'text-blue-600' : 'text-red-600'
                }`}
              >
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </Card>
  );
};

// Action Card Component
interface ActionCardProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  action: {
    label: string;
    onClick: () => void;
  };
  color?: 'blue' | 'primary' | 'purple' | 'red' | 'yellow' | 'indigo';
}

export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon: Icon,
  action,
  color = 'blue'
}) => {
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    primary: 'bg-primary-600 hover:bg-primary-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    red: 'bg-red-600 hover:bg-red-700',
    yellow: 'bg-yellow-600 hover:bg-yellow-700',
    indigo: 'bg-indigo-600 hover:bg-indigo-700'
  };

  return (
    <Card hover>
      <div className="flex items-start">
        {Icon && (
          <div className="flex-shrink-0">
            <Icon className="w-8 h-8 text-gray-400" />
          </div>
        )}
        <div className={`${Icon ? 'ml-4' : ''} flex-1`}>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
          <div className="mt-4">
            <button
              onClick={action.onClick}
              className={`${colorClasses[color]} text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
            >
              {action.label}
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default Card;
