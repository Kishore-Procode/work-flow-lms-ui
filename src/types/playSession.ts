/**
 * Play Session Types
 * 
 * Type definitions for the Play Session feature.
 * Matches backend API response structures.
 */

// ============================================================================
// Session Types
// ============================================================================

export interface WorkflowSession {
  id: string;
  title: string;
  instructor: string | null;
  durationMinutes: number;
  sessionDescription: string | null;
  sessionObjectives: string | null;
  detailedContent: string | null;
  status: string;
  isActive: boolean;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

export interface GetSessionBySubjectResponse {
  session: WorkflowSession;
  subjectId: string;
  enrollmentId: string | null; // Add enrollmentId to response
  hasAccess: boolean;
}

// ============================================================================
// Content Block Types
// ============================================================================

export type ContentBlockType = 
  | 'video' 
  | 'text' 
  | 'pdf' 
  | 'image' 
  | 'audio' 
  | 'code' 
  | 'quiz' 
  | 'assignment' 
  | 'examination';

export interface SessionContentBlock {
  id: string;
  sessionId: string;
  title: string;
  type: ContentBlockType;
  contentData: any; // JSONB - structure varies by type
  orderIndex: number;
  isRequired: boolean;
  estimatedTime: string | null; // Changed from estimatedMinutes to match backend
  isActive: boolean;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

export interface GetSessionContentBlocksResponse {
  sessionId: string;
  contentBlocks: SessionContentBlock[];
  totalBlocks: number;
  requiredBlocks: number;
}

// ============================================================================
// Progress Types
// ============================================================================

export interface SessionContentProgress {
  id: string;
  contentBlockId: string;
  userId: string;
  isCompleted: boolean;
  timeSpent: number; // seconds
  completionData: any | null;
  completedAt?: Date | string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

export interface ProgressWithBlock extends SessionContentProgress {
  blockTitle: string;
  blockType: ContentBlockType;
  isRequired: boolean;
}

export interface GetUserProgressResponse {
  sessionId: string;
  userId: string;
  progress: ProgressWithBlock[];
  statistics: {
    totalBlocks: number;
    completedBlocks: number;
    requiredBlocks: number;
    completedRequiredBlocks: number;
    completionPercentage: number;
    totalTimeSpent: number; // seconds
  };
}

export interface ContentBlockProgress {
  contentBlockId: string;
  sessionId: string;
  contentBlockTitle: string;
  contentBlockType: string;
  isCompleted: boolean;
  timeSpent: number; // seconds
  completionData: any | null;
  completedAt: Date | string | null;
}

export interface SessionProgress {
  sessionId: string;
  sessionTitle: string;
  totalBlocks: number;
  completedBlocks: number;
  completionPercentage: number;
  totalTimeSpent: number; // seconds
}

export interface GetBulkUserProgressResponse {
  subjectId: string;
  userId: string;
  progress: ContentBlockProgress[];
  sessionProgress: SessionProgress[];
  overallStatistics: {
    totalSessions: number;
    totalBlocks: number;
    completedBlocks: number;
    requiredBlocks: number;
    completedRequiredBlocks: number;
    completionPercentage: number;
    totalTimeSpent: number; // seconds
  };
}

export interface UpdateProgressRequest {
  contentBlockId: string;
  isCompleted: boolean;
  timeSpent: number;
  completionData?: any;
  enrollmentId?: string;
}

export interface UpdateProgressResponse {
  progress: {
    id: string;
    contentBlockId: string;
    userId: string;
    isCompleted: boolean;
    timeSpent: number;
    completionData: any | null;
    completedAt: Date | null;
  };
  sessionProgress: {
    completionPercentage: number;
    completedBlocks: number;
    totalRequiredBlocks: number;
  };
  enrollmentUpdated: boolean;
}

// ============================================================================
// Comment Types
// ============================================================================

export interface SessionComment {
  id: string;
  contentBlockId: string;
  userId: string;
  userName: string | null;
  commentText: string;
  parentCommentId: string | null;
  status: 'pending' | 'approved' | 'rejected';
  isAnonymous: boolean;
  likesCount: number;
  createdAt: Date;
  isActive: boolean;
}

export interface GetCommentsResponse {
  contentBlockId: string;
  comments: SessionComment[];
  totalComments: number;
}

export interface CreateCommentRequest {
  contentBlockId: string;
  commentText: string;
  parentCommentId?: string | null;
  isAnonymous?: boolean;
}

export interface CreateCommentResponse {
  comment: SessionComment;
}

// ============================================================================
// Quiz Types
// ============================================================================

export type QuizQuestionType = 
  | 'multiple_choice' 
  | 'single_choice' 
  | 'multiple_select' 
  | 'true_false' 
  | 'fill_in_blank';

export interface QuizQuestion {
  id: string;
  questionText: string;
  questionType: QuizQuestionType;
  options: any; // Structure varies by question type
  explanation: string | null;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  orderIndex: number;
}

export interface GetQuizQuestionsResponse {
  contentBlockId: string;
  questions: QuizQuestion[];
  totalQuestions: number;
  totalPoints: number;
}

export interface SubmitQuizAttemptRequest {
  contentBlockId: string;
  answers: Record<string, any>; // questionId -> answer
  timeSpentSeconds: number;
  enrollmentId?: string;
}

export interface QuizAttempt {
  id: string;
  contentBlockId: string;
  userId: string;
  attemptNumber: number;
  score: number;
  maxScore: number;
  percentage: number;
  isPassed: boolean;
  timeSpentSeconds: number;
  startedAt: Date;
  completedAt: Date;
}

export interface SubmitQuizAttemptResponse {
  attempt: QuizAttempt;
  feedback: {
    correctAnswers: number;
    totalQuestions: number;
    passingPercentage: number;
    message: string;
  };
}

// ============================================================================
// Mapping Types (Admin/Staff)
// ============================================================================

export interface SubjectSessionMapping {
  id: string;
  contentMapSubDetailsId: string;
  workflowSessionId: string;
  subjectName: string;
  sessionTitle: string;
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
  notes: string | null;
}

export interface MapSubjectToSessionRequest {
  contentMapSubDetailsId: string;
  workflowSessionId: string;
  notes?: string;
}

export interface MapSubjectToSessionResponse {
  mapping: SubjectSessionMapping;
}

// ============================================================================
// UI State Types
// ============================================================================

export interface PlaySessionState {
  session: WorkflowSession | null;
  contentBlocks: SessionContentBlock[];
  currentBlockIndex: number;
  progress: GetUserProgressResponse | null;
  isLoading: boolean;
  error: string | null;
}

export interface ContentPlayerProps {
  block: SessionContentBlock;
  onComplete: (timeSpent: number, completionData?: any) => void;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ============================================================================
// Content Data Structures (by type)
// ============================================================================

export interface VideoContentData {
  url: string;
  duration: number;
  thumbnail?: string;
  subtitles?: string;
}

export interface TextContentData {
  content: string; // HTML or Markdown
  format: 'html' | 'markdown';
}

export interface PDFContentData {
  url: string;
  pages: number;
}

export interface QuizContentData {
  instructions: string;
  timeLimit?: number; // minutes
  passingScore: number; // percentage
  allowRetry: boolean;
  maxAttempts?: number;
}

