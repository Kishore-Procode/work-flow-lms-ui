import React from 'react';
import { ChevronRight, MoreVertical } from 'lucide-react';

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  showArrow?: boolean;
  showMenu?: boolean;
  onMenuClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
}

const MobileCard: React.FC<MobileCardProps> = ({
  children,
  className = '',
  onClick,
  showArrow = false,
  showMenu = false,
  onMenuClick,
  padding = 'md',
  variant = 'default'
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const variantClasses = {
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    elevated: 'bg-white dark:bg-gray-800 shadow-lg border-0',
    outlined: 'bg-transparent border-2 border-gray-200 dark:border-gray-700',
    filled: 'bg-gray-50 dark:bg-gray-700 border-0'
  };

  const baseClasses = `
    rounded-xl transition-all duration-200
    ${variantClasses[variant]}
    ${paddingClasses[padding]}
    ${onClick ? 'cursor-pointer hover:shadow-md active:scale-[0.98]' : ''}
    ${className}
  `;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMenuClick) {
      onMenuClick();
    }
  };

  return (
    <div className={baseClasses} onClick={handleClick}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          {children}
        </div>
        
        <div className="flex items-center space-x-2 ml-3">
          {showMenu && (
            <button
              onClick={handleMenuClick}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          )}
          
          {showArrow && (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>
    </div>
  );
};

// Specialized Mobile Cards

interface MobileListItemProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: {
    text: string;
    color?: 'blue' | 'blue' | 'red' | 'yellow' | 'gray';
  };
  onClick?: () => void;
  showArrow?: boolean;
  showMenu?: boolean;
  onMenuClick?: () => void;
}

export const MobileListItem: React.FC<MobileListItemProps> = ({
  title,
  subtitle,
  description,
  icon: Icon,
  badge,
  onClick,
  showArrow = true,
  showMenu = false,
  onMenuClick
}) => {
  const badgeColors = {
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  };

  return (
    <MobileCard
      onClick={onClick}
      showArrow={showArrow}
      showMenu={showMenu}
      onMenuClick={onMenuClick}
      variant="default"
    >
      <div className="flex items-start space-x-3">
        {Icon && (
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {title}
            </h3>
            {badge && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${badgeColors[badge.color || 'gray']}`}>
                {badge.text}
              </span>
            )}
          </div>
          
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
          
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>
    </MobileCard>
  );
};

interface MobileStatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: React.ComponentType<{ className?: string }>;
  color?: 'primary' | 'blue' | 'purple' | 'red' | 'yellow';
  onClick?: () => void;
}

export const MobileStatCard: React.FC<MobileStatCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  color = 'blue',
  onClick
}) => {
  const colorClasses = {
    primary: 'from-primary-500 to-primary-600',
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600',
    yellow: 'from-yellow-500 to-yellow-600'
  };

  return (
    <MobileCard
      onClick={onClick}
      variant="elevated"
      className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
          {change && (
            <div className="flex items-center mt-2">
              <span className={`text-xs font-medium ${
                change.type === 'increase' ? 'text-blue-600 dark:text-blue-400' :
                change.type === 'decrease' ? 'text-red-600 dark:text-red-400' : 
                'text-gray-600 dark:text-gray-400'
              }`}>
                {change.value}
              </span>
            </div>
          )}
        </div>
        
        {Icon && (
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </MobileCard>
  );
};

interface MobileActionCardProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  action: {
    label: string;
    onClick: () => void;
  };
  color?: 'blue' | 'blue' | 'purple' | 'red' | 'yellow';
}

export const MobileActionCard: React.FC<MobileActionCardProps> = ({
  title,
  description,
  icon: Icon,
  action,
  color = 'blue'
}) => {
  const colorClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700',
    blue: 'bg-blue-600 hover:bg-blue-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    red: 'bg-red-600 hover:bg-red-700',
    yellow: 'bg-yellow-600 hover:bg-yellow-700'
  };

  return (
    <MobileCard variant="outlined">
      <div className="text-center space-y-3">
        {Icon && (
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto">
            <Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </div>
        )}
        
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {description}
          </p>
        </div>
        
        <button
          onClick={action.onClick}
          className={`w-full ${colorClasses[color]} text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors`}
        >
          {action.label}
        </button>
      </div>
    </MobileCard>
  );
};

export default MobileCard;
