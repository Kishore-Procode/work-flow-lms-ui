/**
 * Advanced Filters Component
 * 
 * Comprehensive filtering component with multiple filter types, search,
 * date ranges, and role-based filtering options.
 * 
 * @author Student - ACT Team
 * @version 2.0.0
 */

import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface DateRange {
  start?: string;
  end?: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'search' | 'daterange' | 'boolean';
  options?: FilterOption[];
  placeholder?: string;
  multiple?: boolean;
}

export interface FilterValues {
  [key: string]: any;
}

interface AdvancedFiltersProps {
  filters: FilterConfig[];
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  onReset: () => void;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  showActiveCount?: boolean;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  values,
  onChange,
  onReset,
  className = '',
  collapsible = true,
  defaultCollapsed = false,
  showActiveCount = true,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [searchTerm, setSearchTerm] = useState(values.search || '');

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== values.search) {
        onChange({ ...values, search: searchTerm });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, values, onChange]);

  const handleFilterChange = (key: string, value: any) => {
    const newValues = { ...values };
    
    if (value === '' || value === null || value === undefined) {
      delete newValues[key];
    } else {
      newValues[key] = value;
    }
    
    onChange(newValues);
  };

  const handleDateRangeChange = (key: string, field: 'start' | 'end', value: string) => {
    const currentRange = values[key] || {};
    const newRange = { ...currentRange, [field]: value };
    
    if (!newRange.start && !newRange.end) {
      const newValues = { ...values };
      delete newValues[key];
      onChange(newValues);
    } else {
      handleFilterChange(key, newRange);
    }
  };

  const getActiveFilterCount = () => {
    return Object.keys(values).filter(key => {
      const value = values[key];
      if (key === 'search') return value && value.trim() !== '';
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(v => v !== '' && v !== null && v !== undefined);
      }
      return value !== '' && value !== null && value !== undefined;
    }).length;
  };

  const hasActiveFilters = getActiveFilterCount() > 0;

  const renderFilter = (filter: FilterConfig) => {
    const value = values[filter.key];

    switch (filter.type) {
      case 'search':
        return (
          <div key={filter.key} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {filter.label}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={filter.placeholder || `Search ${filter.label.toLowerCase()}...`}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        );

      case 'select':
        return (
          <div key={filter.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {filter.label}
            </label>
            <select
              value={value || ''}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All {filter.label}</option>
              {filter.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} {option.count !== undefined && `(${option.count})`}
                </option>
              ))}
            </select>
          </div>
        );

      case 'multiselect':
        return (
          <div key={filter.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {filter.label}
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
              {filter.options?.map((option) => (
                <label key={option.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={Array.isArray(value) && value.includes(option.value)}
                    onChange={(e) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      const newValues = e.target.checked
                        ? [...currentValues, option.value]
                        : currentValues.filter(v => v !== option.value);
                      handleFilterChange(filter.key, newValues.length > 0 ? newValues : undefined);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">
                    {option.label} {option.count !== undefined && `(${option.count})`}
                  </span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'daterange':
        const dateRange = value || {};
        return (
          <div key={filter.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {filter.label}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="date"
                  value={dateRange.start || ''}
                  onChange={(e) => handleDateRangeChange(filter.key, 'start', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Start date"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="date"
                  value={dateRange.end || ''}
                  onChange={(e) => handleDateRangeChange(filter.key, 'end', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="End date"
                />
              </div>
            </div>
          </div>
        );

      case 'boolean':
        return (
          <div key={filter.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {filter.label}
            </label>
            <select
              value={value === undefined ? '' : value.toString()}
              onChange={(e) => {
                const val = e.target.value;
                handleFilterChange(
                  filter.key,
                  val === '' ? undefined : val === 'true'
                );
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          {showActiveCount && hasActiveFilters && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {getActiveFilterCount()} active
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </button>
          )}
          
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 text-gray-400 hover:text-gray-600"
              aria-label={isCollapsed ? 'Expand filters' : 'Collapse filters'}
            >
              {isCollapsed ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Filter Content */}
      {!isCollapsed && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filters.map(renderFilter)}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;
