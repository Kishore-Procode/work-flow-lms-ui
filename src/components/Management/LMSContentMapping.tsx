/**
 * LMS Content Mapping Component
 * 
 * Main component for mapping courses from ACT application to Student-ACT LMS.
 * Allows Principal and HOD users to create content mappings between schemas.
 * 
 * @author Student-ACT LMS Team
 * @version 1.0.0
 */

import React, { useEffect } from 'react';
import { MapPin, BookOpen, Users, Calendar, Building, FileText, Loader, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useContentMapping } from '../../hooks/useContentMapping';
import { SubjectAssignmentPopup } from './SubjectAssignmentPopup';
import LoadingSpinner from '../UI/LoadingSpinner';
import type {
  CourseTypeMapping,
  ContentMappingFormData,
  SemesterDetail
} from '../../types/contentMapping';
import {
  CONTENT_MAPPING_STATUS_LABELS,
  CONTENT_MAPPING_STATUS_COLORS
} from '../../types/contentMapping';

/**
 * Main LMS Content Mapping Screen Component
 */
export const LMSContentMapping: React.FC = () => {
  console.log('LMSContentMapping component rendering...');
  
  const { user } = useAuth();
  const isHOD = user?.role === 'hod';

  const {
    state,
    updateFormField,
    loadDropdownData,
    loadSemesters,
    openAssignmentPopup,
    closeAssignmentPopup,
    assignSubjects,
    resetForm,
    isFormValid,
    canLoadSemesters
  } = useContentMapping();

  console.log('LMSContentMapping state:', state);
  console.log('User role:', user?.role, 'Department:', user?.departmentId);

  // Load initial dropdown data
  useEffect(() => {
    console.log('LMSContentMapping useEffect running...');
    const loadInitialData = async () => {
      try {
        console.log('Attempting to load dropdown data...');
        await loadDropdownData();
        console.log('Dropdown data loaded successfully');
      } catch (error) {
        console.error('Failed to load dropdown data:', error);
        // Don't show toast here as the error state will display it
      }
    };

    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Auto-select HOD's department when dropdown data loads
  useEffect(() => {
    console.log('🔍 LMS Dept Auto-Select Effect:', {
      isHOD,
      departmentId: user?.departmentId,
      lmsDepartments: state.dropdownData?.lmsDepartments,
      currentValue: state.formData.lmsDepartmentId
    });
    
    if (isHOD && user?.departmentId && state.dropdownData?.lmsDepartments && state.dropdownData.lmsDepartments.length > 0) {
      // Check if user's department exists in the LMS departments list
      const userDept = state.dropdownData.lmsDepartments.find(d => d.value === user.departmentId);
      console.log('🔍 Found user dept in LMS departments:', userDept);
      
      if (userDept && state.formData.lmsDepartmentId !== user.departmentId) {
        console.log('✅ Auto-selecting HOD LMS department:', user.departmentId);
        updateFormField('lmsDepartmentId', user.departmentId);
      } else if (!userDept) {
        console.warn('⚠️ HOD department not found in LMS departments list');
      }
    }
  }, [isHOD, user?.departmentId, state.dropdownData?.lmsDepartments, state.formData.lmsDepartmentId, updateFormField]);

  // Handle form field changes with cascading dropdown logic
  const handleFieldChange = (field: keyof ContentMappingFormData, value: string) => {
    updateFormField(field, value);

    // Trigger cascading dropdown updates based on workflow:
    // 1. courseType → reload courses (LMS) and departments (ACT)
    // 2. lmsCourseId → reload departments (LMS) and academic years (LMS)
    // 3. actDepartmentId → reload regulations (ACT)
    if (field === 'courseType' || field === 'lmsCourseId' || field === 'actDepartmentId') {
      // Reload dropdown data with new filters
      setTimeout(() => {
        loadDropdownData({
          courseType: field === 'courseType' ? value : state.formData.courseType,
          lmsCourseId: field === 'lmsCourseId' ? value : state.formData.lmsCourseId,
          actDepartmentId: field === 'actDepartmentId' ? value : state.formData.actDepartmentId
        });
      }, 100);
    }
  };

  // Handle load semesters
  const handleLoadSemesters = async () => {
    if (!canLoadSemesters) {
      toast.error('Please fill in all required fields');
      return;
    }
    await loadSemesters();
  };

  // Handle assign subjects
  const handleAssignSubjects = async (semesterDetailId: string) => {
    await openAssignmentPopup(semesterDetailId);
  };

  // Handle reset form with confirmation
  const handleResetForm = () => {
    if (state.semesters.length > 0 || state.formData.courseType) {
      if (window.confirm('Are you sure you want to reset the form? This will clear all data and semester mappings.')) {
        resetForm();
        toast.success('Form reset successfully');
      }
    } else {
      resetForm();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MapPin className="w-8 h-8 text-blue-600 mr-4" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">LMS Content Mapping</h1>
              <p className="text-gray-600 mt-1">
                Map courses from ACT application to Student-ACT LMS system
              </p>
            </div>
          </div>
          <button
            onClick={handleResetForm}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Reset Form
          </button>
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 mb-1">Error Loading Data</h3>
              <p className="text-sm text-red-700">{state.error}</p>
              <p className="text-xs text-red-600 mt-2">
                Please ensure the API server is running and the content mapping endpoints are available.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content Mapping Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Content Mapping Configuration</h2>
        
        {/* First Row - Course Type and LMS Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Course Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <BookOpen className="w-4 h-4 inline mr-1" />
              Course Type *
            </label>
            <select
              value={state.formData.courseType}
              onChange={(e) => handleFieldChange('courseType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select course type...</option>
              {state.dropdownData.courseTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {state.formErrors.courseType && (
              <p className="mt-1 text-sm text-red-600">{state.formErrors.courseType}</p>
            )}
          </div>

          {/* LMS Course */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              LMS Course *
            </label>
            <select
              value={state.formData.lmsCourseId}
              onChange={(e) => handleFieldChange('lmsCourseId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={state.dropdownLoading}
            >
              <option value="">Select LMS course...</option>
              {state.dropdownData?.lmsCourses.map((course) => (
                <option key={course.value} value={course.value}>
                  {course.label}
                </option>
              ))}
            </select>
            {state.formErrors.lmsCourseId && (
              <p className="mt-1 text-sm text-red-600">{state.formErrors.lmsCourseId}</p>
            )}
          </div>

          {/* LMS Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building className="w-4 h-4 inline mr-1" />
              LMS Department *
              {isHOD && (
                <span className="text-xs text-blue-600 ml-2">(Locked to your department)</span>
              )}
            </label>
            {isHOD ? (
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-900">
                {state.dropdownData?.lmsDepartments.find(d => d.value === user?.departmentId)?.label || 
                 state.dropdownData?.lmsDepartments.find(d => d.value === state.formData.lmsDepartmentId)?.label || 
                 'Your Department'}
              </div>
            ) : (
              <select
                value={state.formData.lmsDepartmentId}
                onChange={(e) => handleFieldChange('lmsDepartmentId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={state.dropdownLoading}
              >
                <option value="">Select LMS department...</option>
                {state.dropdownData?.lmsDepartments.map((dept) => (
                  <option key={dept.value} value={dept.value}>
                    {dept.label}
                  </option>
                ))}
              </select>
            )}
            {state.formErrors.lmsDepartmentId && (
              <p className="mt-1 text-sm text-red-600">{state.formErrors.lmsDepartmentId}</p>
            )}
          </div>
        </div>

        {/* Second Row - Academic Year and ACT Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* LMS Academic Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              LMS Academic Year *
            </label>
            <select
              value={state.formData.lmsAcademicYearId}
              onChange={(e) => handleFieldChange('lmsAcademicYearId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={state.dropdownLoading}
            >
              <option value="">Select academic year...</option>
              {state.dropdownData?.lmsAcademicYears.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
            {state.formErrors.lmsAcademicYearId && (
              <p className="mt-1 text-sm text-red-600">{state.formErrors.lmsAcademicYearId}</p>
            )}
          </div>

          {/* ACT Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building className="w-4 h-4 inline mr-1" />
              ACT Department *
            </label>
            <select
              value={state.formData.actDepartmentId}
              onChange={(e) => handleFieldChange('actDepartmentId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={state.dropdownLoading}
            >
              <option value="">Select ACT department...</option>
              {state.dropdownData?.actDepartments.map((dept) => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </select>
            {state.formErrors.actDepartmentId && (
              <p className="mt-1 text-sm text-red-600">{state.formErrors.actDepartmentId}</p>
            )}
          </div>

          {/* ACT Regulation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              ACT Regulation *
            </label>
            <select
              value={state.formData.actRegulationId}
              onChange={(e) => handleFieldChange('actRegulationId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={state.dropdownLoading || !state.formData.actDepartmentId}
            >
              <option value="">Select ACT regulation...</option>
              {state.dropdownData?.actRegulations.map((reg) => (
                <option key={reg.value} value={reg.value}>
                  {reg.label}
                </option>
              ))}
            </select>
            {state.formErrors.actRegulationId && (
              <p className="mt-1 text-sm text-red-600">{state.formErrors.actRegulationId}</p>
            )}
          </div>
        </div>

        {/* Load Button */}
        <div className="flex justify-center">
          <button
            onClick={handleLoadSemesters}
            disabled={!canLoadSemesters || state.semestersLoading}
            className="px-8 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {state.semestersLoading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Loading Semesters...
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 mr-2" />
                Load Semesters
              </>
            )}
          </button>
        </div>
      </div>

      {/* Semester Details Table */}
      {state.semesters.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Semester Details</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Semester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Subjects
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {state.semesters.map((semester) => (
                  <tr key={semester.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {semester.semesterName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-md bg-blue-100 text-blue-800 font-medium">
                        {semester.totalSubjects} {semester.totalSubjects === 1 ? 'Subject' : 'Subjects'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleAssignSubjects(semester.id)}
                        className="inline-flex items-center px-4 py-2 text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-600 rounded-md transition-colors"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Assign Subjects
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subject Assignment Popup */}
      <SubjectAssignmentPopup
        isOpen={state.assignmentPopup.isOpen}
        onClose={closeAssignmentPopup}
        semesterDetailId={state.assignmentPopup.semesterDetailId || ''}
        semesterName={state.assignmentPopup.semesterName}
        subjects={state.assignmentPopup.subjects}
        learningResources={state.learningResources}
        onAssign={assignSubjects}
        loading={state.assignmentPopup.loading}
      />

      {/* Loading Overlay */}
      {state.loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6 flex items-center">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-700">Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LMSContentMapping;
