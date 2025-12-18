/**
 * Content Mapping React Query Hooks
 * 
 * Custom hooks for LMS Content Mapping functionality using React Query.
 * Provides data fetching, caching, and state management for content mapping operations.
 * 
 * @author Student-ACT LMS Team
 * @version 1.0.0
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { ContentMappingService } from '../services/contentMappingService';
import { queryKeys } from '../lib/react-query';
import type {
  ContentMappingState,
  ContentMappingFormData,
  ContentMappingFormErrors,
  GetDropdownDataRequest,
  LoadSemestersRequest,
  AssignSubjectsRequest,
  SubjectAssignment,
  UseContentMappingReturn,
  ValidationResult
} from '../types/contentMapping';
import {
  DEFAULT_FORM_DATA,
  DEFAULT_DROPDOWN_DATA
} from '../types/contentMapping';

/**
 * Main hook for content mapping functionality
 * Provides comprehensive state management and API operations
 */
export const useContentMapping = (): UseContentMappingReturn => {
  // Local state for form and UI
  const [state, setState] = useState<ContentMappingState>({
    formData: DEFAULT_FORM_DATA,
    formErrors: {},
    isFormValid: false,
    dropdownData: DEFAULT_DROPDOWN_DATA,
    dropdownLoading: false,
    semesters: [],
    semestersLoading: false,
    contentMapMasterId: null,
    assignmentPopup: {
      isOpen: false,
      semesterDetailId: null,
      semesterName: '',
      subjects: [],
      loading: false
    },
    loading: false,
    error: null
  });

  const queryClient = useQueryClient();

  // ============================================================================
  // QUERY HOOKS
  // ============================================================================

  /**
   * Query for dropdown data
   */
  const dropdownDataQuery = useQuery({
    queryKey: ['content-mapping', 'dropdown-data', state.formData.courseType, state.formData.lmsCourseId, state.formData.actDepartmentId],
    queryFn: () => ContentMappingService.getDropdownData({
      courseType: state.formData.courseType || undefined,
      lmsCourseId: state.formData.lmsCourseId || undefined,
      lmsDepartmentId: state.formData.lmsDepartmentId || undefined,
      actDepartmentId: state.formData.actDepartmentId || undefined
    }),
    enabled: false, // Don't auto-fetch, we'll manually trigger it
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false, // Don't retry on failure
    throwOnError: false, // Don't throw errors, handle them gracefully
  });

  // Learning resources query removed - not needed for new workflow

  // ============================================================================
  // MUTATION HOOKS
  // ============================================================================

  /**
   * Mutation for loading semesters
   */
  const loadSemestersMutation = useMutation({
    mutationFn: (request: LoadSemestersRequest) => ContentMappingService.loadSemesters(request),
    onSuccess: (data) => {
      setState(prev => ({
        ...prev,
        semesters: data.semesters,
        contentMapMasterId: data.contentMapMasterId,
        semestersLoading: false,
        error: null
      }));
      toast.success(data.message);
    },
    onError: (error: Error) => {
      setState(prev => ({
        ...prev,
        semestersLoading: false,
        error: error.message
      }));
      toast.error(error.message);
    }
  });

  /**
   * Mutation for getting subjects
   */
  const getSubjectsMutation = useMutation({
    mutationFn: (semesterDetailsId: string) => ContentMappingService.getSubjects(semesterDetailsId),
    onSuccess: (data) => {
      setState(prev => ({
        ...prev,
        assignmentPopup: {
          ...prev.assignmentPopup,
          subjects: data.subjects,
          loading: false
        }
      }));
    },
    onError: (error: Error) => {
      setState(prev => ({
        ...prev,
        assignmentPopup: {
          ...prev.assignmentPopup,
          loading: false
        },
        error: error.message
      }));
      toast.error(error.message);
    }
  });

  /**
   * Mutation for assigning subjects
   */
  const assignSubjectsMutation = useMutation({
    mutationFn: (request: AssignSubjectsRequest) => ContentMappingService.assignSubjects(request),
    onSuccess: (data) => {
      // Update semester data with new mapping progress AND total subjects
      setState(prev => ({
        ...prev,
        semesters: prev.semesters.map(sem =>
          sem.id === data.contentMapSemDetailsId
            ? {
                ...sem,
                totalSubjects: data.totalSubjects,
                mappedSubjects: data.mappedSubjects,
                mappingProgress: data.mappingProgress
              }
            : sem
        ),
        assignmentPopup: {
          ...prev.assignmentPopup,
          isOpen: false,
          subjects: [],
          loading: false
        }
      }));

      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.contentMapping.subjects(data.contentMapSemDetailsId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.contentMapping.semesters });

      toast.success(data.message);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Validate form data
   */
  const validateForm = useCallback((formData: ContentMappingFormData): ValidationResult => {
    const errors: ContentMappingFormErrors = {};

    if (!formData.courseType) {
      errors.courseType = 'Course type is required';
    }

    if (!formData.lmsCourseId) {
      errors.lmsCourseId = 'LMS course is required';
    }

    if (!formData.lmsDepartmentId) {
      errors.lmsDepartmentId = 'LMS department is required';
    }

    if (!formData.lmsAcademicYearId) {
      errors.lmsAcademicYearId = 'LMS academic year is required';
    }

    if (!formData.actDepartmentId) {
      errors.actDepartmentId = 'ACT department is required';
    }

    if (!formData.actRegulationId) {
      errors.actRegulationId = 'ACT regulation is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, []);

  // ============================================================================
  // ACTION FUNCTIONS
  // ============================================================================

  /**
   * Update form field and validate
   */
  const updateFormField = useCallback((field: keyof ContentMappingFormData, value: string) => {
    setState(prev => {
      const newFormData = { ...prev.formData, [field]: value };
      const validation = validateForm(newFormData);
      
      return {
        ...prev,
        formData: newFormData,
        formErrors: validation.errors,
        isFormValid: validation.isValid
      };
    });
  }, [validateForm]);

  /**
   * Load dropdown data
   */
  const loadDropdownData = useCallback(async (params?: GetDropdownDataRequest) => {
    setState(prev => ({ ...prev, dropdownLoading: true, error: null }));

    try {
      const result = await dropdownDataQuery.refetch();
      setState(prev => ({
        ...prev,
        dropdownData: result.data || DEFAULT_DROPDOWN_DATA,
        dropdownLoading: false
      }));
    } catch (error) {
      console.error('Error loading dropdown data:', error);
      setState(prev => ({
        ...prev,
        dropdownLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load dropdown data'
      }));
      throw error; // Re-throw so the component can handle it
    }
  }, [dropdownDataQuery.refetch]);

  /**
   * Load semesters
   */
  const loadSemesters = useCallback(async () => {
    const validation = validateForm(state.formData);
    
    if (!validation.isValid) {
      setState(prev => ({ ...prev, formErrors: validation.errors }));
      toast.error('Please fill in all required fields');
      return;
    }

    setState(prev => ({ ...prev, semestersLoading: true }));
    
    const request: LoadSemestersRequest = {
      courseType: state.formData.courseType as any,
      lmsCourseId: state.formData.lmsCourseId,
      lmsDepartmentId: state.formData.lmsDepartmentId,
      lmsAcademicYearId: state.formData.lmsAcademicYearId,
      actDepartmentId: state.formData.actDepartmentId,
      actRegulationId: state.formData.actRegulationId
    };

    loadSemestersMutation.mutate(request);
  }, [state.formData, validateForm, loadSemestersMutation]);

  /**
   * Open assignment popup
   */
  const openAssignmentPopup = useCallback(async (semesterDetailId: string) => {
    const semester = state.semesters.find(s => s.id === semesterDetailId);
    
    setState(prev => ({
      ...prev,
      assignmentPopup: {
        isOpen: true,
        semesterDetailId,
        semesterName: semester?.semesterName || '',
        subjects: [],
        loading: true
      }
    }));

    // Load subjects for the semester (all courses from ACT schema)
    getSubjectsMutation.mutate(semesterDetailId);
  }, [state.semesters, getSubjectsMutation]);

  /**
   * Close assignment popup
   */
  const closeAssignmentPopup = useCallback(() => {
    setState(prev => ({
      ...prev,
      assignmentPopup: {
        isOpen: false,
        semesterDetailId: null,
        semesterName: '',
        subjects: [],
        loading: false
      }
    }));
  }, []);

  /**
   * Assign subjects
   */
  const assignSubjects = useCallback(async (assignments: SubjectAssignment[]) => {
    if (!state.assignmentPopup.semesterDetailId) {
      toast.error('No semester selected');
      return;
    }

    const request: AssignSubjectsRequest = {
      contentMapSemDetailsId: state.assignmentPopup.semesterDetailId,
      assignments
    };

    assignSubjectsMutation.mutate(request);
  }, [state.assignmentPopup.semesterDetailId, assignSubjectsMutation]);

  /**
   * Reset form
   */
  const resetForm = useCallback(() => {
    setState(prev => ({
      ...prev,
      formData: DEFAULT_FORM_DATA,
      formErrors: {},
      isFormValid: false,
      semesters: [],
      contentMapMasterId: null,
      error: null
    }));
  }, []);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const isFormValid = state.isFormValid;
  const canLoadSemesters = isFormValid && !state.semestersLoading;

  // Update state when queries complete
  if (dropdownDataQuery.data && dropdownDataQuery.data !== state.dropdownData) {
    setState(prev => ({ ...prev, dropdownData: dropdownDataQuery.data || DEFAULT_DROPDOWN_DATA }));
  }

  return {
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
  };
};
