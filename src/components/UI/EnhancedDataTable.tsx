/**
 * Enhanced Data Table Component
 * 
 * Professional data table with sorting, filtering, pagination, and
 * role-based actions following enterprise UI standards.
 * 
 * @author Student - ACT Team
 * @version 2.0.0
 */

import React, { useState } from 'react';
import { ChevronUp, ChevronDown, MoreVertical, Edit, Trash2, Eye, Download } from 'lucide-react';
import EnhancedPagination, { PaginationInfo } from './EnhancedPagination';
import AdvancedFilters, { FilterConfig, FilterValues } from './AdvancedFilters';

export interface TableColumn<T = any> {
  key: string;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface TableAction<T = any> {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (record: T) => void;
  visible?: (record: T) => boolean;
  disabled?: (record: T) => boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
}

interface EnhancedDataTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  onSort?: (field: string, order: 'asc' | 'desc') => void;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: FilterConfig[];
  filterValues?: FilterValues;
  onFilterChange?: (values: FilterValues) => void;
  onFilterReset?: () => void;
  actions?: TableAction<T>[];
  bulkActions?: TableAction<T[]>[];
  onBulkAction?: (action: string, selectedRecords: T[]) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  rowKey?: string | ((record: T) => string);
  selectable?: boolean;
  showFilters?: boolean;
  showPagination?: boolean;
  stickyHeader?: boolean;
}

const EnhancedDataTable = <T extends Record<string, any>>({
  data,
  columns,
  pagination,
  onPageChange,
  onLimitChange,
  onSort,
  sortField,
  sortOrder,
  filters = [],
  filterValues = {},
  onFilterChange,
  onFilterReset,
  actions = [],
  bulkActions = [],
  onBulkAction,
  loading = false,
  emptyMessage = 'No data available',
  className = '',
  rowKey = 'id',
  selectable = false,
  showFilters = true,
  showPagination = true,
  stickyHeader = false,
}: EnhancedDataTableProps<T>) => {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return record[rowKey] || index.toString();
  };

  const handleSort = (field: string) => {
    if (!onSort) return;
    
    let newOrder: 'asc' | 'desc' = 'asc';
    if (sortField === field && sortOrder === 'asc') {
      newOrder = 'desc';
    }
    
    onSort(field, newOrder);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allKeys = data.map((record, index) => getRowKey(record, index));
      setSelectedRows(new Set(allKeys));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (key: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(key);
    } else {
      newSelected.delete(key);
    }
    setSelectedRows(newSelected);
  };

  const getSelectedRecords = (): T[] => {
    return data.filter((record, index) => 
      selectedRows.has(getRowKey(record, index))
    );
  };

  const renderSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ChevronUp className="h-4 w-4 text-gray-300" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-gray-600" />
    ) : (
      <ChevronDown className="h-4 w-4 text-gray-600" />
    );
  };

  const renderActions = (record: T, index: number) => {
    const visibleActions = actions.filter(action => 
      !action.visible || action.visible(record)
    );

    if (visibleActions.length === 0) return null;

    const rowKey = getRowKey(record, index);

    return (
      <div className="relative">
        <button
          onClick={() => setActionMenuOpen(actionMenuOpen === rowKey ? null : rowKey)}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {actionMenuOpen === rowKey && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setActionMenuOpen(null)}
            />
            <div className="absolute right-0 top-8 z-20 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1">
              {visibleActions.map((action) => (
                <button
                  key={action.key}
                  onClick={() => {
                    action.onClick(record);
                    setActionMenuOpen(null);
                  }}
                  disabled={action.disabled && action.disabled(record)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${
                    action.variant === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
                  } ${action.className || ''}`}
                >
                  {action.icon && <span>{action.icon}</span>}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  const allSelected = data.length > 0 && selectedRows.size === data.length;
  const someSelected = selectedRows.size > 0 && selectedRows.size < data.length;

  return (
    <div className={`bg-white dark:bg-neutral-800 rounded-lg shadow ${className}`}>
      {/* Filters */}
      {showFilters && filters.length > 0 && onFilterChange && onFilterReset && (
        <div className="mb-4">
          <AdvancedFilters
            filters={filters}
            values={filterValues}
            onChange={onFilterChange}
            onReset={onFilterReset}
          />
        </div>
      )}

      {/* Bulk Actions */}
      {selectable && selectedRows.size > 0 && bulkActions.length > 0 && (
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">
              {selectedRows.size} item{selectedRows.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              {bulkActions.map((action) => (
                <button
                  key={action.key}
                  onClick={() => onBulkAction && onBulkAction(action.key, getSelectedRecords())}
                  className={`inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    action.variant === 'danger' ? 'text-red-600 border-red-300 hover:bg-red-50' : ''
                  } ${action.className || ''}`}
                >
                  {action.icon && <span className="mr-1">{action.icon}</span>}
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={`bg-gray-50 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
            <tr>
              {selectable && (
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.align === 'center' ? 'text-center' : 
                    column.align === 'right' ? 'text-right' : 'text-left'
                  } ${column.className || ''}`}
                  style={{ width: column.width }}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key)}
                      className="group inline-flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>{column.title}</span>
                      {renderSortIcon(column.key)}
                    </button>
                  ) : (
                    column.title
                  )}
                </th>
              ))}
              
              {actions.length > 0 && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          
          <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-neutral-700">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)} className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-500">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)} className="px-6 py-12 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((record, index) => {
                const key = getRowKey(record, index);
                const isSelected = selectedRows.has(key);
                
                return (
                  <tr key={key} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                    {selectable && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectRow(key, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    )}
                    
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          column.align === 'center' ? 'text-center' : 
                          column.align === 'right' ? 'text-right' : 'text-left'
                        } ${column.className || ''}`}
                      >
                        {column.render 
                          ? column.render(record[column.key], record, index)
                          : record[column.key]
                        }
                      </td>
                    ))}
                    
                    {actions.length > 0 && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {renderActions(record, index)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && pagination && onPageChange && onLimitChange && (
        <div className="px-6 py-4 border-t border-gray-200">
          <EnhancedPagination
            pagination={pagination}
            onPageChange={onPageChange}
            onLimitChange={onLimitChange}
            disabled={loading}
          />
        </div>
      )}
    </div>
  );
};

export default EnhancedDataTable;
