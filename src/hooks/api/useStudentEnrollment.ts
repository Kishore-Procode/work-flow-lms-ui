/**
 * Student Enrollment React Query Hooks
 * 
 * Custom hooks for student subject enrollment using React Query.
 * 
 * @author Student-ACT LMS Team
 * @version 1.0.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { StudentEnrollmentService } from '../../services/studentEnrollmentService';
import type {
  EnrollSubjectsRequest,
  GetEnrolledSubjectsRequest,
} from '../../types/studentEnrollment';

// ==================== QUERY KEYS ====================

export const studentEnrollmentKeys = {
  all: ['student-enrollment'] as const,
  currentSemester: () => [...studentEnrollmentKeys.all, 'current-semester'] as const,
  availableSubjects: (semesterNumber?: number) =>
    [...studentEnrollmentKeys.all, 'available-subjects', semesterNumber] as const,
  enrolledSubjects: (filters?: GetEnrolledSubjectsRequest) =>
    [...studentEnrollmentKeys.all, 'enrolled-subjects', filters] as const,
  learningContent: (enrollmentId: string) =>
    [...studentEnrollmentKeys.all, 'learning-content', enrollmentId] as const,
};

// ==================== QUERIES ====================

/**
 * Hook to get current semester for authenticated student
 */
export function useCurrentSemester() {
  return useQuery({
    queryKey: studentEnrollmentKeys.currentSemester(),
    queryFn: async () => {
      const response = await StudentEnrollmentService.getCurrentSemester();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * Hook to get available subjects for a semester
 * @param semesterNumber - Semester number to get subjects for
 * @param enabled - Whether the query should run
 */
export function useAvailableSubjects(semesterNumber?: number, enabled: boolean = true) {
  return useQuery({
    queryKey: studentEnrollmentKeys.availableSubjects(semesterNumber),
    queryFn: async () => {
      if (!semesterNumber) {
        throw new Error('Semester number is required');
      }
      const response = await StudentEnrollmentService.getAvailableSubjects(semesterNumber);
      return response.data;
    },
    enabled: enabled && !!semesterNumber,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
}

/**
 * Hook to get enrolled subjects
 * @param filters - Optional filters for semester or academic year
 */
export function useEnrolledSubjects(filters?: GetEnrolledSubjectsRequest) {
  return useQuery({
    queryKey: studentEnrollmentKeys.enrolledSubjects(filters),
    queryFn: async () => {
      const response = await StudentEnrollmentService.getEnrolledSubjects(filters);
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 2,
  });
}

/**
 * Hook to get learning content for an enrollment
 * @param enrollmentId - Enrollment ID to get content for
 * @param enabled - Whether the query should run
 */
export function useLearningContent(enrollmentId?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: studentEnrollmentKeys.learningContent(enrollmentId || ''),
    queryFn: async () => {
      if (!enrollmentId) {
        throw new Error('Enrollment ID is required');
      }
      const response = await StudentEnrollmentService.getLearningContent(enrollmentId);
      return response.data;
    },
    enabled: enabled && !!enrollmentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

// ==================== MUTATIONS ====================

/**
 * Hook to enroll in subjects
 */
export function useEnrollSubjects() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: EnrollSubjectsRequest) => {
      // Validate request
      const validation = StudentEnrollmentService.validateEnrollmentRequest(request);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }

      const response = await StudentEnrollmentService.enrollSubjects(request);
      return response;
    },
    onSuccess: (response, variables) => {
      // Show success message
      toast.success(response.message || 'Successfully enrolled in subjects!');

      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: studentEnrollmentKeys.availableSubjects(variables.semesterNumber),
      });
      queryClient.invalidateQueries({
        queryKey: studentEnrollmentKeys.enrolledSubjects(),
      });
    },
    onError: (error: any) => {
      // Show error message
      const message = error.response?.data?.message || error.message || 'Failed to enroll in subjects';
      toast.error(message);
      console.error('Enrollment error:', error);
    },
  });
}

// ==================== UTILITY HOOKS ====================

/**
 * Hook to get enrollment statistics
 * @param filters - Optional filters for semester or academic year
 */
export function useEnrollmentStats(filters?: GetEnrolledSubjectsRequest) {
  const { data: enrolledSubjects, isLoading, error } = useEnrolledSubjects(filters);

  const stats = enrolledSubjects
    ? StudentEnrollmentService.calculateEnrollmentStats(enrolledSubjects)
    : null;

  return {
    stats,
    isLoading,
    error,
  };
}

/**
 * Hook to get grouped enrollments by semester
 * @param filters - Optional filters for semester or academic year
 */
export function useGroupedEnrollments(filters?: GetEnrolledSubjectsRequest) {
  const { data: enrolledSubjects, isLoading, error } = useEnrolledSubjects(filters);

  const grouped = enrolledSubjects
    ? StudentEnrollmentService.groupEnrollmentsBySemester(enrolledSubjects)
    : [];

  return {
    grouped,
    isLoading,
    error,
  };
}

/**
 * Hook to prefetch available subjects for next semester
 * @param currentSemester - Current semester number
 */
export function usePrefetchNextSemester(currentSemester?: number) {
  const queryClient = useQueryClient();

  const prefetchNextSemester = () => {
    if (currentSemester) {
      const nextSemester = currentSemester + 1;
      queryClient.prefetchQuery({
        queryKey: studentEnrollmentKeys.availableSubjects(nextSemester),
        queryFn: async () => {
          const response = await StudentEnrollmentService.getAvailableSubjects(nextSemester);
          return response.data;
        },
        staleTime: 5 * 60 * 1000,
      });
    }
  };

  return { prefetchNextSemester };
}

/**
 * Hook to invalidate all enrollment queries
 */
export function useInvalidateEnrollmentQueries() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({
      queryKey: studentEnrollmentKeys.all,
    });
  };

  const invalidateCurrentSemester = () => {
    queryClient.invalidateQueries({
      queryKey: studentEnrollmentKeys.currentSemester(),
    });
  };

  const invalidateAvailableSubjects = (semesterNumber?: number) => {
    queryClient.invalidateQueries({
      queryKey: studentEnrollmentKeys.availableSubjects(semesterNumber),
    });
  };

  const invalidateEnrolledSubjects = () => {
    queryClient.invalidateQueries({
      queryKey: studentEnrollmentKeys.enrolledSubjects(),
    });
  };

  return {
    invalidateAll,
    invalidateCurrentSemester,
    invalidateAvailableSubjects,
    invalidateEnrolledSubjects,
  };
}

/**
 * Hook to check if student is enrolled in a subject
 * @param subjectId - Subject ID to check
 * @param filters - Optional filters for semester or academic year
 */
export function useIsEnrolled(subjectId: string, filters?: GetEnrolledSubjectsRequest) {
  const { data: enrolledSubjects } = useEnrolledSubjects(filters);

  const isEnrolled = enrolledSubjects?.enrollments.some(
    (enrollment) => enrollment.subjectId === subjectId
  ) || false;

  return { isEnrolled };
}

/**
 * Hook to get enrollment by subject ID
 * @param subjectId - Subject ID to find
 * @param filters - Optional filters for semester or academic year
 */
export function useEnrollmentBySubject(subjectId: string, filters?: GetEnrolledSubjectsRequest) {
  const { data: enrolledSubjects, isLoading, error } = useEnrolledSubjects(filters);

  const enrollment = enrolledSubjects?.enrollments.find(
    (enrollment) => enrollment.subjectId === subjectId
  );

  return {
    enrollment,
    isLoading,
    error,
  };
}

