import api from './api';

export interface AssignmentSubmission {
  id: string;
  contentBlockId: string;
  userId: string;
  submissionText: string | null;
  submissionFiles: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    uploadedAt: Date;
  }> | null;
  submittedAt: Date;
  gradedBy: string | null;
  gradedAt: Date | null;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  isPassed: boolean;
  feedback: string | null;
  rubricScores: Array<{
    criteria: string;
    score: number;
    maxScore: number;
    comments?: string;
  }> | null;
  status: 'submitted' | 'graded' | 'returned' | 'resubmitted';
}

export interface AssignmentSubmissionForStaff extends AssignmentSubmission {
  contentBlockTitle: string;
  sessionTitle: string;
  studentName: string;
  studentEmail: string;
}

export interface AssignmentWithSubmissions {
  assignmentId: string;
  assignmentTitle: string;
  assignmentDescription: string;
  assignmentInstructions: string;
  maxPoints: number;
  dueDate: string | null;
  sessionId: string;
  sessionTitle: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  totalSubmissions: number;
  pendingGrading: number;
  graded: number;
  submissions: AssignmentSubmissionForStaff[];
}

export interface SubjectWithAssignments {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  assignments: AssignmentWithSubmissions[];
  totalSubmissions: number;
  pendingGrading: number;
  graded: number;
}

export interface StaffAssignmentsResponse {
  subjects: SubjectWithAssignments[];
  totalSubmissions: number;
  totalPendingGrading: number;
  totalGraded: number;
}

export interface SubmitAssignmentRequest {
  contentBlockId: string;
  submissionText?: string;
  submissionFiles?: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
  }>;
}

export interface GradeAssignmentRequest {
  submissionId: string;
  score: number;
  maxScore: number;
  feedback?: string;
  rubricScores?: Array<{
    criteria: string;
    score: number;
    maxScore: number;
    comments?: string;
  }>;
}

export interface AssignmentSubmissionStatusResponse {
  hasSubmitted: boolean;
  submission: {
    id: string;
    submissionText: string | null;
    submissionFiles: Array<{
      fileName: string;
      fileUrl: string;
      fileSize: number;
      uploadedAt: Date;
    }> | null;
    submittedAt: Date;
    status: 'submitted' | 'graded' | 'returned' | 'resubmitted';
    isGraded: boolean;
    score: number | null;
    maxScore: number | null;
    percentage: number | null;
    isPassed: boolean;
    feedback: string | null;
    gradedAt: Date | null;
  } | null;
}

export const AssignmentService = {
  /**
   * Submit an assignment (Student)
   */
  async submitAssignment(request: SubmitAssignmentRequest): Promise<{ success: boolean; message: string; data: AssignmentSubmission }> {
    const response = await api.post('/play-session/assignment/submit', request);
    return response.data;
  },

  /**
   * Get assignment submission status (Student)
   */
  async getAssignmentSubmissionStatus(contentBlockId: string): Promise<{ success: boolean; message: string; data: AssignmentSubmissionStatusResponse }> {
    try {
      const response = await api.get(`/play-session/assignment/${contentBlockId}/status`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch assignment submission status:', error);
      // Return default structure instead of throwing
      return {
        success: false,
        message: 'Failed to load submission status',
        data: {
          hasSubmitted: false,
          submission: null
        }
      };
    }
  },

  /**
   * Grade an assignment submission (Staff)
   */
  async gradeAssignment(request: GradeAssignmentRequest): Promise<{ success: boolean; message: string; data: AssignmentSubmission }> {
    const response = await api.post('/play-session/assignment/grade', request);
    return response.data;
  },

  /**
   * Get all assignment submissions for staff to grade (Staff)
   */
  async getStaffAssignmentSubmissions(): Promise<{ success: boolean; message: string; data: StaffAssignmentsResponse }> {
    try {
      const response = await api.get('/play-session/staff/assignments');
      console.log('🔍 Service: API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch staff assignments:', error);
      // Return default empty structure instead of throwing
      return {
        success: false,
        message: 'Failed to load assignments',
        data: {
          subjects: [],
          totalSubmissions: 0,
          totalPendingGrading: 0,
          totalGraded: 0
        }
      };
    }
  },

  /**
   * Get all LMS staff assignments (subjects with assignments) (Staff)
   */
  async getLMSStaffAssignments(): Promise<{ success: boolean; data: StaffAssignmentsResponse }> {
    try {
      const response = await api.get('/lms-content/staff/assignments');
      console.log('🔍 Service: LMS Staff Assignments API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch LMS staff assignments:', error);
      return {
        success: false,
        data: {
          subjects: [],
          totalSubmissions: 0,
          totalPendingGrading: 0,
          totalGraded: 0
        }
      };
    }
  },

  /**
   * Get all LMS assignment submissions for staff to grade (Staff)
   */
  async getLMSAssignmentSubmissions(): Promise<{ success: boolean; data: any[] }> {
    try {
      const response = await api.get('/lms-content/assignments/submissions');
      console.log('🔍 Service: LMS API response:', response);
      return response;
    } catch (error) {
      console.error('Failed to fetch LMS assignments:', error);
      return {
        success: false,
        data: []
      };
    }
  },

  /**
   * Grade an LMS assignment submission (Staff)
   */
  async gradeLMSAssignment(request: GradeAssignmentRequest): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/lms-content/assignments/grade', request);
    return response.data;
  },
};

