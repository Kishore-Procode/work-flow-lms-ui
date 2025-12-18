import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff, Search, X } from 'lucide-react';

interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  help?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  variant?: 'default' | 'search' | 'password';
  size?: 'sm' | 'md' | 'lg';
}

const EnhancedInput = forwardRef<HTMLInputElement, EnhancedInputProps>(({
  label,
  error,
  success,
  help,
  leftIcon,
  rightIcon,
  clearable = false,
  onClear,
  variant = 'default',
  size = 'md',
  className = '',
  type = 'text',
  value,
  onChange,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg'
  };

  const getInputType = () => {
    if (variant === 'password') {
      return showPassword ? 'text' : 'password';
    }
    return type;
  };

  const hasValue = value && value.toString().length > 0;
  const showClearButton = clearable && hasValue && !props.disabled;
  const showPasswordToggle = variant === 'password';

  const inputClasses = `
    w-full border rounded-lg transition-all duration-200 
    ${sizeClasses[size]}
    ${leftIcon ? 'pl-12' : ''}
    ${(rightIcon || showClearButton || showPasswordToggle) ? 'pr-12' : ''}
    ${error 
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
      : success
      ? 'border-blue-500 focus:border-blue-500 focus:ring-blue-500'
      : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
    }
    ${props.disabled 
      ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-not-allowed' 
      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
    }
    focus:ring-2 focus:ring-opacity-50 outline-none
    placeholder-gray-400 dark:placeholder-gray-500
    ${className}
  `;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-gray-400 dark:text-gray-500">
              {leftIcon}
            </div>
          </div>
        )}

        {/* Search Icon for search variant */}
        {variant === 'search' && !leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          type={getInputType()}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={inputClasses}
          {...props}
        />

        {/* Right Side Icons */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
          {/* Clear Button */}
          {showClearButton && (
            <button
              type="button"
              onClick={onClear}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Password Toggle */}
          {showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}

          {/* Right Icon */}
          {rightIcon && !showClearButton && !showPasswordToggle && (
            <div className="text-gray-400 dark:text-gray-500">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Focus Ring Animation */}
        {isFocused && (
          <div className="absolute inset-0 rounded-lg border-2 border-blue-500 pointer-events-none animate-pulse" />
        )}
      </div>

      {/* Help Text */}
      {help && !error && !success && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{help}</p>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
          <span>⚠️</span>
          <span>{error}</span>
        </p>
      )}

      {/* Success Message */}
      {success && !error && (
        <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center space-x-1">
          <span>✅</span>
          <span>{success}</span>
        </p>
      )}
    </div>
  );
});

EnhancedInput.displayName = 'EnhancedInput';

export default EnhancedInput;
