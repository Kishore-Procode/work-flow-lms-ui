import React, { useState } from 'react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';

interface Column<T> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface ModernDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  exportable?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  rowSelection?: {
    selectedRowKeys: string[];
    onChange: (selectedRowKeys: string[]) => void;
    getCheckboxProps?: (record: T) => { disabled?: boolean };
  };
  onRowClick?: (record: T, index: number) => void;
  emptyText?: string;
  className?: string;
}

function ModernDataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  searchable = true,
  filterable = false,
  exportable = false,
  pagination,
  rowSelection,
  onRowClick,
  emptyText = 'No data available',
  className = '',
}: ModernDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Filter data based on search term
  const filteredData = React.useMemo(() => {
    const dataArray = Array.isArray(data) ? data : [];
    if (!searchTerm) return dataArray;
    
    return dataArray.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  // Sort data
  const sortedData = React.useMemo(() => {
    const filteredArray = Array.isArray(filteredData) ? filteredData : [];
    if (!sortConfig) return filteredArray;

    return [...filteredArray].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (!rowSelection) return;
    
    if (checked) {
      const allKeys = sortedData.map((_, index) => String(index));
      rowSelection.onChange(allKeys);
    } else {
      rowSelection.onChange([]);
    }
  };

  const handleSelectRow = (key: string, checked: boolean) => {
    if (!rowSelection) return;
    
    const newSelectedKeys = checked
      ? [...rowSelection.selectedRowKeys, key]
      : rowSelection.selectedRowKeys.filter((k) => k !== key);
    
    rowSelection.onChange(newSelectedKeys);
  };

  if (loading) {
    return (
      <div className={`card ${className}`}>
        <div className="card-body">
          {/* Loading skeleton */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="skeleton-title w-32"></div>
              <div className="skeleton-button"></div>
            </div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex space-x-4">
                  <div className="skeleton-text flex-1"></div>
                  <div className="skeleton-text flex-1"></div>
                  <div className="skeleton-text flex-1"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card ${className}`}>
      {/* Table Header */}
      {(searchable || filterable || exportable) && (
        <div className="card-header">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* Search */}
            {searchable && (
              <div className="relative max-w-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="w-5 h-5 text-neutral-400" />
                </div>
                <input
                  type="text"
                  className="form-input pl-10 py-2"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {filterable && (
                <button className="btn-ghost btn-sm">
                  <FunnelIcon className="w-4 h-4 mr-2" />
                  Filter
                </button>
              )}
              {exportable && (
                <button className="btn-ghost btn-sm">
                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                  Export
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="table">
          <thead className="table-header">
            <tr>
              {/* Selection column */}
              {rowSelection && (
                <th className="table-header-cell w-12">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-600 bg-white border-neutral-300 rounded focus:ring-primary-500 focus:ring-2"
                    checked={
                      sortedData.length > 0 &&
                      rowSelection.selectedRowKeys.length === sortedData.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
              )}
              
              {/* Data columns */}
              {columns.map((column, index) => (
                <th
                  key={String(column.key) || index}
                  className={`
                    table-header-cell
                    ${column.sortable ? 'cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700' : ''}
                    ${column.align === 'center' ? 'text-center' : ''}
                    ${column.align === 'right' ? 'text-right' : ''}
                  `}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.title}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUpIcon
                          className={`w-3 h-3 ${
                            sortConfig?.key === column.key && sortConfig.direction === 'asc'
                              ? 'text-primary-600'
                              : 'text-neutral-400'
                          }`}
                        />
                        <ChevronDownIcon
                          className={`w-3 h-3 -mt-1 ${
                            sortConfig?.key === column.key && sortConfig.direction === 'desc'
                              ? 'text-primary-600'
                              : 'text-neutral-400'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (rowSelection ? 1 : 0)}
                  className="table-cell text-center py-12"
                >
                  <div className="text-neutral-500 dark:text-neutral-400">
                    {emptyText}
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((record, index) => {
                const rowKey = String(index);
                const isSelected = rowSelection?.selectedRowKeys.includes(rowKey);
                
                return (
                  <tr
                    key={rowKey}
                    className={`
                      table-row
                      ${onRowClick ? 'cursor-pointer' : ''}
                      ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
                    `}
                    onClick={() => onRowClick?.(record, index)}
                  >
                    {/* Selection column */}
                    {rowSelection && (
                      <td className="table-cell">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-primary-600 bg-white border-neutral-300 rounded focus:ring-primary-500 focus:ring-2"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectRow(rowKey, e.target.checked);
                          }}
                          {...rowSelection.getCheckboxProps?.(record)}
                        />
                      </td>
                    )}
                    
                    {/* Data columns */}
                    {columns.map((column, colIndex) => (
                      <td
                        key={String(column.key) || colIndex}
                        className={`
                          table-cell
                          ${column.align === 'center' ? 'text-center' : ''}
                          ${column.align === 'right' ? 'text-right' : ''}
                        `}
                      >
                        {column.render
                          ? column.render(record[column.key as keyof T], record, index)
                          : String(record[column.key as keyof T] || '')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="card-footer">
          <div className="flex items-center justify-between">
            <div className="text-body-sm text-neutral-600 dark:text-neutral-400">
              Showing {((pagination.current - 1) * pagination.pageSize) + 1} to{' '}
              {Math.min(pagination.current * pagination.pageSize, pagination.total)} of{' '}
              {pagination.total} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                className="btn-ghost btn-sm"
                disabled={pagination.current === 1}
                onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
              >
                Previous
              </button>
              <span className="text-body-sm text-neutral-600 dark:text-neutral-400">
                Page {pagination.current} of {Math.ceil(pagination.total / pagination.pageSize)}
              </span>
              <button
                className="btn-ghost btn-sm"
                disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
                onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModernDataTable;
