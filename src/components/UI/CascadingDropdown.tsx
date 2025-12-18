/**
 * Cascading Dropdown Component
 * 
 * Professional cascading dropdown for location hierarchy (State -> District -> Pincode)
 * following MNC enterprise standards for form components.
 * 
 * Features:
 * - Auto-loading dependent options
 * - Loading states and error handling
 * - Accessibility support
 * - Professional styling
 * - Search/filter capability
 * 
 * @author Student - ACT Team
 * @version 1.0.0
 */

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { ApiService } from '../../services/api';
import { queryKeys } from '../../lib/react-query';

interface Option {
  value: string;
  label: string;
  code?: string;
}

interface CascadingDropdownProps {
  level: 'state' | 'district' | 'pincode';
  parentValue?: string;
  value: string;
  onChange: (value: string, option?: Option) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
}

const CascadingDropdown: React.FC<CascadingDropdownProps> = ({
  level,
  parentValue,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // React Query hooks for different levels
  const statesQuery = useQuery({
    queryKey: ['states'],
    queryFn: () => ApiService.getStates(),
    enabled: level === 'state',
    staleTime: 1000 * 60 * 30, // 30 minutes
    select: (data) => data.map(state => ({
      value: state.id,
      label: state.name,
      code: state.code,
    }))
  });

  const districtsQuery = useQuery({
    queryKey: ['districts', parentValue],
    queryFn: () => ApiService.getDistrictsByState(parentValue!),
    enabled: level === 'district' && !!parentValue,
    staleTime: 1000 * 60 * 15, // 15 minutes
    select: (data) => data.map(district => ({
      value: district.id,
      label: district.name,
    }))
  });

  const pincodesQuery = useQuery({
    queryKey: ['pincodes', parentValue],
    queryFn: () => ApiService.getPincodesByDistrict(parentValue!),
    enabled: level === 'pincode' && !!parentValue,
    staleTime: 1000 * 60 * 10, // 10 minutes
    select: (data) => data.map(pincode => ({
      value: pincode.id,
      label: `${pincode.code} - ${pincode.areaName}`,
      code: pincode.code,
    }))
  });

  // Get the appropriate query based on level
  const currentQuery = level === 'state' ? statesQuery :
                      level === 'district' ? districtsQuery :
                      pincodesQuery;

  const options = currentQuery.data || [];
  const loading = currentQuery.isLoading;
  const loadError = currentQuery.error?.message || null;

  // Memoized filtered options for search functionality
  const filteredOptions = useMemo(() => {
    return options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (option.code && option.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [options, searchTerm]);



  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (option: Option) => {
    onChange(option.value, option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    
    switch (level) {
      case 'state':
        return 'Select State';
      case 'district':
        return parentValue ? 'Select District' : 'Select State first';
      case 'pincode':
        return parentValue ? 'Select Pincode' : 'Select District first';
      default:
        return 'Select option';
    }
  };

  const isDisabled = disabled || loading || (level !== 'state' && !parentValue);

  return (
    <div className={`relative ${className}`}>
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        disabled={isDisabled}
        className={`w-full flex items-center justify-between px-4 py-2 text-left border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
          error
            ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700'
            : isDisabled
            ? 'border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-gray-400 dark:text-neutral-500 cursor-not-allowed'
            : 'border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 hover:border-gray-400 dark:hover:border-neutral-500'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-required={required}
      >
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-gray-400 dark:text-neutral-500" />
          <span className={selectedOption ? 'text-gray-900 dark:text-neutral-100' : 'text-gray-500 dark:text-neutral-400'}>
            {selectedOption ? selectedOption.label : getPlaceholder()}
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && !isDisabled && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          {options.length > 5 && (
            <div className="p-2 border-b border-gray-200 dark:border-neutral-700">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${level}...`}
                className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-neutral-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-neutral-700 dark:text-neutral-100"
                autoFocus
              />
            </div>
          )}

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {loadError ? (
              <div className="flex items-center space-x-2 px-4 py-3 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{loadError}</span>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                {searchTerm ? 'No matching options found' : 'No options available'}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 ${
                    option.value === value ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                  }`}
                  role="option"
                  aria-selected={option.value === value}
                >
                  <div className="flex items-center justify-between">
                    <span>{option.label}</span>
                    {option.code && (
                      <span className="text-xs text-gray-500">{option.code}</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-1 mt-1 text-red-600">
          <AlertCircle className="h-3 w-3" />
          <span className="text-xs">{error}</span>
        </div>
      )}

      {/* Click Outside Handler */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default CascadingDropdown;
