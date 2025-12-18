/**
 * Subject Assignment Popup Component
 * 
 * Modal component for assigning ACT subjects to LMS learning resources.
 * Displays subjects in a table with checkboxes and dropdown selection for learning resources.
 * 
 * @author Student-ACT LMS Team
 * @version 1.0.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { XCircle, BookOpen, CheckCircle, AlertCircle, Loader, Search, Filter, ArrowUpDown, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../UI/LoadingSpinner';
import type {
  SubjectDetail,
  SubjectAssignment,
  DropdownOption,
  SubjectAssignmentPopupProps
} from '../../types/contentMapping';

// Filter and sort types
type FilterStatus = 'all' | 'assigned' | 'unassigned';
type SortField = 'code' | 'name' | 'credits';
type SortOrder = 'asc' | 'desc';

/**
 * Subject Assignment Popup Component
 */
export const SubjectAssignmentPopup: React.FC<SubjectAssignmentPopupProps> = ({
  isOpen,
  onClose,
  semesterDetailId,
  semesterName,
  subjects,
  learningResources,
  onAssign,
  loading = false
}) => {
  // Local state for assignments and search
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter and sort state
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Initialize selected subjects from existing mappings (courses already assigned to this semester)
  useEffect(() => {
    if (subjects.length > 0) {
      const initialSelected = new Set<string>();

      subjects.forEach(subject => {
        if (subject.isMapped) {
          // Course is already assigned to this semester
          initialSelected.add(subject.actSubjectId);
        }
      });

      setSelectedSubjects(initialSelected);
    }
  }, [subjects]);

  // Filter, sort, and search subjects
  const filteredAndSortedSubjects = useMemo(() => {
    let result = [...subjects];

    // Apply status filter
    if (filterStatus === 'assigned') {
      result = result.filter(s => s.isMapped);
    } else if (filterStatus === 'unassigned') {
      result = result.filter(s => !s.isMapped);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(subject =>
        subject.actSubjectName.toLowerCase().includes(term) ||
        subject.actSubjectCode.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'code':
          comparison = a.actSubjectCode.localeCompare(b.actSubjectCode);
          break;
        case 'name':
          comparison = a.actSubjectName.localeCompare(b.actSubjectName);
          break;
        case 'credits':
          comparison = a.actSubjectCredits - b.actSubjectCredits;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [subjects, searchTerm, filterStatus, sortField, sortOrder]);

  // Handle subject selection (toggle course assignment to this semester)
  const handleSubjectToggle = (actSubjectId: string) => {
    setSelectedSubjects(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(actSubjectId)) {
        newSelected.delete(actSubjectId);
      } else {
        newSelected.add(actSubjectId);
      }
      return newSelected;
    });
  };

  // Handle select all filtered subjects
  const handleSelectAll = () => {
    const allFilteredIds = new Set(filteredAndSortedSubjects.map(s => s.actSubjectId));
    setSelectedSubjects(allFilteredIds);
  };

  // Handle deselect all
  const handleDeselectAll = () => {
    setSelectedSubjects(new Set());
  };

  // Handle clear all assignments (remove all selected)
  const handleClearAll = () => {
    if (selectedSubjects.size === 0) {
      toast.error('No subjects selected to clear');
      return;
    }

    if (window.confirm(`Are you sure you want to remove ${selectedSubjects.size} subject(s) from this semester?`)) {
      setSelectedSubjects(new Set());
      toast.success('Selections cleared');
    }
  };

  // Toggle sort order
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle form submission with confirmation
  const handleSubmitClick = () => {
    if (selectedSubjects.size === 0) {
      toast.error('Please select at least one course to assign to this semester');
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    const selectedAssignments: SubjectAssignment[] = [];

    // Collect selected courses (courses to be assigned to this semester)
    selectedSubjects.forEach(actSubjectId => {
      selectedAssignments.push({
        subjectId: actSubjectId,
        lmsLearningResourceId: undefined // Not used in new workflow
      });
    });

    setShowConfirmDialog(false);
    setIsSubmitting(true);
    try {
      await onAssign(selectedAssignments);
      // Reset state after successful assignment
      setSelectedSubjects(new Set());
      setSearchTerm('');
      setFilterStatus('all');
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close with unsaved changes warning
  const handleClose = () => {
    if (selectedSubjects.size > 0 && !isSubmitting) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        setSelectedSubjects(new Set());
        setSearchTerm('');
        setFilterStatus('all');
        onClose();
      }
    } else {
      setSelectedSubjects(new Set());
      setSearchTerm('');
      setFilterStatus('all');
      onClose();
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  const selectedCount = selectedSubjects.size;
  const totalSubjects = subjects.length;
  const mappedCount = subjects.filter(s => s.isMapped).length;
  const filteredCount = filteredAndSortedSubjects.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <BookOpen className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Assign Courses to {semesterName}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Select which courses belong to this semester • {totalSubjects} total courses • {mappedCount} already assigned
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(90vh-140px)]">
          {/* Search, Filter, and Stats */}
          <div className="p-6 border-b border-gray-200 space-y-4">
            {/* Search Bar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search courses by code or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="font-medium">Selected: {selectedCount}</span>
                <span className="text-gray-400">|</span>
                <span>Showing: {filteredCount}</span>
                <span className="text-gray-400">|</span>
                <span>Total: {totalSubjects}</span>
              </div>
            </div>

            {/* Filter and Sort Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Courses</option>
                    <option value="assigned">Assigned Only</option>
                    <option value="unassigned">Unassigned Only</option>
                  </select>
                </div>

                {/* Sort Controls */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-gray-500" />
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as SortField)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="code">Sort by Code</option>
                    <option value="name">Sort by Name</option>
                    <option value="credits">Sort by Credits</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-2 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                    title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>

              {/* Bulk Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                  disabled={filteredCount === 0}
                >
                  Select All ({filteredCount})
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                  disabled={selectedCount === 0}
                >
                  Deselect All
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors flex items-center gap-1"
                  disabled={selectedCount === 0}
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Subject Table */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
                <span className="ml-3 text-gray-600">Loading courses...</span>
              </div>
            ) : filteredAndSortedSubjects.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {searchTerm || filterStatus !== 'all'
                      ? 'No courses found matching your filters'
                      : 'No courses available'}
                  </p>
                  {(searchTerm || filterStatus !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setFilterStatus('all');
                      }}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-700"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="w-12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={filteredAndSortedSubjects.length > 0 && filteredAndSortedSubjects.every(s => selectedSubjects.has(s.actSubjectId))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleSelectAll();
                            } else {
                              handleDeselectAll();
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          title="Select/Deselect all filtered courses"
                        />
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('code')}
                      >
                        <div className="flex items-center gap-1">
                          Course Code
                          {sortField === 'code' && (
                            <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-1">
                          Course Name
                          {sortField === 'name' && (
                            <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('credits')}
                      >
                        <div className="flex items-center gap-1">
                          Credits
                          {sortField === 'credits' && (
                            <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedSubjects.map((subject) => (
                      <tr key={subject.actSubjectId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedSubjects.has(subject.actSubjectId)}
                            onChange={() => handleSubjectToggle(subject.actSubjectId)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {subject.actSubjectCode}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {subject.actSubjectName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {subject.actSubjectCredits}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {subject.isMapped ? (
                            <div className="flex items-center text-blue-600">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              <span>Assigned</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">Not assigned</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                {selectedCount > 0 ? (
                  <span className="text-blue-600 font-medium">
                    {selectedCount} course{selectedCount !== 1 ? 's' : ''} selected for assignment
                  </span>
                ) : (
                  <span className="text-gray-500">
                    No courses selected
                  </span>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitClick}
                  disabled={selectedCount === 0 || isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Save {selectedCount} Course{selectedCount !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Confirm Assignment
                </h3>
                <p className="text-sm text-gray-600">
                  You are about to assign <strong>{selectedCount} course{selectedCount !== 1 ? 's' : ''}</strong> to <strong>{semesterName}</strong>.
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  This will update the semester's subject list. Do you want to continue?
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Yes, Assign Courses
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectAssignmentPopup;
