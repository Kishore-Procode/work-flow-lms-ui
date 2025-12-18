/**
 * Course Player Page Component
 *
 * Full-page Udemy-style course player with left panel (lesson tree) and right panel (content viewer).
 * Implements lazy loading, progress tracking, and navigation with real lesson structure from database.
 *
 * @author Student-ACT LMS Team
 * @version 2.0.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  BookOpen,
  Award,
  Menu,
  X,
  ChevronRight,
  Play,
  Lock,
  FileText,
  MessageCircle,
  BarChart3,
  Bookmark,
  RotateCcw
} from 'lucide-react';
import { useCourseStructure } from '../hooks/api/useCourseStructure';
import {
  useSessionContentBlocks,
  useUserProgress,
  useBulkUserProgress,
  useUpdateProgress,
} from '../hooks/usePlaySession';
import { useEnrollmentBySubject } from '../hooks/api/useStudentEnrollment';
import { router } from '../utils/router';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import ErrorMessage from '../components/UI/ErrorMessage';
import SessionContentViewer from '../components/PlaySession/SessionContentViewer';
import CourseContentTree from '../components/Course/CourseContentTree';
import CertificateModal from '../components/PlaySession/CertificateModal';
import type { ContentBlock } from '../hooks/api/useCourseStructure';

interface CoursePlayerPageProps {
  subjectId: string;
}

const CoursePlayerPage: React.FC<CoursePlayerPageProps> = ({ subjectId }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentBlockId, setCurrentBlockId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'comments' | 'progress'>('content');
  const [sessionStartTime] = useState<Date>(new Date());
  const [currentContentStartTime, setCurrentContentStartTime] = useState<Date>(new Date());
  const [bookmarkedContent, setBookmarkedContent] = useState<Set<string>>(new Set());
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [showCertificate, setShowCertificate] = useState(false);

  // Get enrollment record to obtain enrollmentId for progress sync
  const { enrollment } = useEnrollmentBySubject(subjectId);
  const enrollmentId = enrollment?.enrollmentId || '';

  // Log enrollment info for debugging
  useEffect(() => {
    console.log('📋 Enrollment Info:', {
      subjectId,
      enrollmentId,
      enrollment,
    });
  }, [subjectId, enrollmentId, enrollment]);

  // Fetch course structure from database (metadata only)
  const { data: courseStructure, isLoading: structureLoading, error: structureError } =
    useCourseStructure(subjectId);

  // Fetch full content blocks for the current session (includes content data)
  const { data: sessionContentData, isLoading: contentLoading } =
    useSessionContentBlocks(currentSessionId || '', { enabled: !!currentSessionId });

  // Flatten all content blocks from all lessons/sessions for easy access
  const allContentBlocks = useMemo(() => {
    if (!courseStructure) return [];

    const blocks: (ContentBlock & { sessionId: string; lessonId: string })[] = [];
    courseStructure.lessons.forEach(lesson => {
      lesson.sessions.forEach(session => {
        session.contentBlocks.forEach(block => {
          blocks.push({
            ...block,
            sessionId: session.id,
            lessonId: lesson.id,
          });
        });
      });
    });
    return blocks;
  }, [courseStructure]);

  // Fetch progress for ALL sessions in the course using bulk endpoint
  const { data: bulkProgressData, isLoading: isProgressLoading } = useBulkUserProgress(subjectId);

  // Build progress map from bulk progress data
  const progressMap = useMemo(() => {
    if (!bulkProgressData?.progress) return new Map();

    const map = new Map();
    bulkProgressData.progress.forEach((p) => {
      map.set(p.contentBlockId, {
        contentBlockId: p.contentBlockId,
        isCompleted: p.isCompleted,
        timeSpent: p.timeSpent,
        completionData: p.completionData,
        completedAt: p.completedAt,
      });
    });
    return map;
  }, [bulkProgressData]);

  // Update progress mutation with optimistic updates for bulk progress cache
  const updateProgressMutation = useUpdateProgress(currentSessionId || '', subjectId);

  // Set initial block when course structure loads
  useEffect(() => {
    if (allContentBlocks.length > 0 && !currentBlockId) {
      // Find first incomplete block or first block
      const firstIncomplete = allContentBlocks.find(
        (block) => !progressMap.get(block.id)?.isCompleted
      );
      const initialBlock = firstIncomplete || allContentBlocks[0];
      setCurrentBlockId(initialBlock.id);
      setCurrentSessionId(initialBlock.sessionId);
    }
  }, [allContentBlocks, currentBlockId, progressMap]);

  // Reset timer when content changes
  useEffect(() => {
    setCurrentContentStartTime(new Date());
  }, [currentBlockId]);

  // Get current block with full content data
  const currentBlock = useMemo(() => {
    // First, try to get the full content block from the session content data
    if (sessionContentData?.contentBlocks && currentBlockId) {
      const fullBlock = sessionContentData.contentBlocks.find(
        (block) => block.id === currentBlockId
      );
      if (fullBlock) {
        // Return the full block with all data from the API
        return fullBlock;
      }
    }

    // Fallback: create a minimal block from course structure metadata
    // This will be used until the session content loads
    const metadataBlock = allContentBlocks.find((block) => block.id === currentBlockId);
    if (metadataBlock) {
      return {
        id: metadataBlock.id,
        sessionId: metadataBlock.sessionId,
        type: metadataBlock.type,
        title: metadataBlock.title,
        contentData: null, // No content data yet
        orderIndex: metadataBlock.order,
        estimatedTime: metadataBlock.estimatedTime,
        isRequired: metadataBlock.isRequired,
        isActive: true,
      };
    }

    return null;
  }, [sessionContentData, allContentBlocks, currentBlockId]);

  // Get current lesson based on current block
  const currentLesson = useMemo(() => {
    if (!courseStructure || !currentBlockId) return null;

    const metadataBlock = allContentBlocks.find((block) => block.id === currentBlockId);
    if (!metadataBlock) return null;

    return courseStructure.lessons.find((lesson) => lesson.id === metadataBlock.lessonId);
  }, [courseStructure, allContentBlocks, currentBlockId]);

  // Calculate progress statistics
  // Use the accurate statistics from bulk progress data (based on required blocks only)
  const stats = useMemo(() => {
    if (bulkProgressData?.overallStatistics) {
      // Use backend-calculated statistics (required blocks only)
      return {
        total: bulkProgressData.overallStatistics.totalBlocks,
        completed: bulkProgressData.overallStatistics.completedBlocks,
        percentage: bulkProgressData.overallStatistics.completionPercentage,
        requiredBlocks: bulkProgressData.overallStatistics.requiredBlocks,
        completedRequiredBlocks: bulkProgressData.overallStatistics.completedRequiredBlocks,
      };
    }

    // Fallback: calculate from local data (all blocks)
    const total = allContentBlocks.length;
    const completed = allContentBlocks.filter(
      (block) => progressMap.get(block.id)?.isCompleted
    ).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, percentage, requiredBlocks: total, completedRequiredBlocks: completed };
  }, [bulkProgressData, allContentBlocks, progressMap]);

  // Time tracking helpers
  const getTotalTimeSpent = useCallback(() => {
    const totalSeconds = Array.from(progressMap.values()).reduce(
      (sum, p) => sum + (p.timeSpent || 0),
      0
    );
    const currentSessionTime = Math.floor(
      (new Date().getTime() - sessionStartTime.getTime()) / 1000
    );
    return totalSeconds + currentSessionTime;
  }, [progressMap, sessionStartTime]);

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }, []);

  // Navigation handlers
  const goToNext = useCallback(() => {
    const currentIndex = allContentBlocks.findIndex((b) => b.id === currentBlockId);
    if (currentIndex < allContentBlocks.length - 1) {
      const nextBlock = allContentBlocks[currentIndex + 1];

      // Assignments now open inline within course player
      // Only examinations redirect to dedicated page
      if (nextBlock.type === 'examination') {
        console.log('🔀 Next content is examination - redirecting to dedicated page');
        router.navigateToExaminations();
        return;
      }

      setCurrentBlockId(nextBlock.id);
      setCurrentSessionId(nextBlock.sessionId);
    }
  }, [allContentBlocks, currentBlockId]);

  const goToPrevious = useCallback(() => {
    const currentIndex = allContentBlocks.findIndex((b) => b.id === currentBlockId);
    if (currentIndex > 0) {
      const prevBlock = allContentBlocks[currentIndex - 1];

      // Assignments now open inline within course player
      // Only examinations redirect to dedicated page
      if (prevBlock.type === 'examination') {
        console.log('🔀 Previous content is examination - redirecting to dedicated page');
        router.navigateToExaminations();
        return;
      }

      setCurrentBlockId(prevBlock.id);
      setCurrentSessionId(prevBlock.sessionId);
    }
  }, [allContentBlocks, currentBlockId]);

  // Handle block selection
  const handleBlockSelect = (blockId: string, sessionId: string) => {
    // Find the block to check its type
    const block = allContentBlocks.find(b => b.id === blockId);

    if (block) {
      // Assignments now open inline within course player
      // Only examinations redirect to the dedicated Examinations page
      if (block.type === 'examination') {
        console.log('🔀 Redirecting to Examinations page for examination:', block.title);
        router.navigateToExaminations();
        return;
      }
    }

    // For all other content types (including assignments), display in the course player
    setCurrentBlockId(blockId);
    setCurrentSessionId(sessionId);

    // DO NOT send progress update on block selection
    // Progress should only be updated when user explicitly marks as complete
    // or when they complete a quiz/exam
  };

  // Handle content completion (called by quiz/exam on pass)
  const handleContentComplete = () => {
    if (!currentBlockId || !currentSessionId) return;

    const timeSpent = Math.floor(
      (new Date().getTime() - currentContentStartTime.getTime()) / 1000
    );

    // Send to server - optimistic update handled by useUpdateProgress hook
    updateProgressMutation.mutate({
      sessionId: currentSessionId,
      enrollmentId,
      contentBlockId: currentBlockId,
      isCompleted: true,
      timeSpent,
    });
  };

  // Check if current block should auto-complete (assignment, quiz, examination)
  const shouldAutoComplete = useMemo(() => {
    if (!currentBlock) return false;
    const autoCompleteTypes = ['assignment', 'quiz', 'examination'];
    return autoCompleteTypes.includes(currentBlock.type);
  }, [currentBlock]);

  // Mark content as completed manually (instant feedback with optimistic updates)
  const markContentAsCompleted = useCallback(() => {
    console.log('🔵 markContentAsCompleted called', {
      currentBlockId,
      currentSessionId,
      enrollmentId,
      hasUpdateMutation: !!updateProgressMutation
    });

    if (!currentBlockId || !currentSessionId) {
      console.log('❌ Missing required IDs', { currentBlockId, currentSessionId });
      return;
    }

    if (!enrollmentId) {
      console.warn('⚠️ WARNING: enrollmentId is empty! Enrollment progress will NOT be updated.');
      console.warn('This means the progress will update in Course Player but NOT in My Enrollments page.');
    }

    const timeSpent = Math.floor(
      (new Date().getTime() - currentContentStartTime.getTime()) / 1000
    );

    console.log('✅ Calling updateProgressMutation.mutate', {
      sessionId: currentSessionId,
      enrollmentId,
      contentBlockId: currentBlockId,
      isCompleted: true,
      timeSpent,
    });

    // Send to server - optimistic update handled by useUpdateProgress hook
    updateProgressMutation.mutate({
      sessionId: currentSessionId,
      enrollmentId,
      contentBlockId: currentBlockId,
      isCompleted: true,
      timeSpent,
    });
  }, [currentBlockId, currentSessionId, enrollmentId, currentContentStartTime, updateProgressMutation]);

  // Unmark content as completed (instant feedback with optimistic updates)
  const unmarkContentAsCompleted = useCallback(() => {
    console.log('🔵 unmarkContentAsCompleted called', {
      currentBlockId,
      currentSessionId,
      enrollmentId,
      hasUpdateMutation: !!updateProgressMutation
    });

    if (!currentBlockId || !currentSessionId) {
      console.log('❌ Missing required IDs', { currentBlockId, currentSessionId });
      return;
    }

    // Prevent unmarking auto-completing content types (assignment, quiz, examination)
    if (shouldAutoComplete) {
      console.log('⚠️ Cannot unmark auto-completing content type:', currentBlock?.type);
      alert('This content was automatically marked as complete and cannot be unmarked manually.');
      return;
    }

    if (!enrollmentId) {
      console.warn('⚠️ WARNING: enrollmentId is empty! Enrollment progress will NOT be updated.');
    }

    const timeSpent = Math.floor(
      (new Date().getTime() - currentContentStartTime.getTime()) / 1000
    );

    console.log('✅ Calling updateProgressMutation.mutate (unmark)', {
      sessionId: currentSessionId,
      enrollmentId,
      contentBlockId: currentBlockId,
      isCompleted: false,
      timeSpent,
    });

    // Send to server - optimistic update handled by useUpdateProgress hook
    updateProgressMutation.mutate({
      sessionId: currentSessionId,
      enrollmentId,
      contentBlockId: currentBlockId,
      isCompleted: false,
      timeSpent,
    });
  }, [currentBlockId, currentSessionId, enrollmentId, currentContentStartTime, updateProgressMutation, shouldAutoComplete, currentBlock]);

  // Toggle bookmark
  const toggleBookmark = useCallback(() => {
    if (currentBlockId) {
      setBookmarkedContent((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(currentBlockId)) {
          newSet.delete(currentBlockId);
        } else {
          newSet.add(currentBlockId);
        }
        return newSet;
      });
    }
  }, [currentBlockId]);

  // Generate certificate
  const generateCertificate = useCallback(() => {
    if (stats.percentage === 100) {
      setShowCertificate(true);
    }
  }, [stats.percentage]);

  // Check if current block is completed
  const isCurrentBlockCompleted = useMemo(() => {
    if (!currentBlockId) return false;
    return progressMap.get(currentBlockId)?.isCompleted || false;
  }, [currentBlockId, progressMap]);

  // Get current block index
  const currentBlockIndex = useMemo(() => {
    return allContentBlocks.findIndex((b) => b.id === currentBlockId);
  }, [allContentBlocks, currentBlockId]);

  // Handle back navigation
  const handleBack = () => {
    router.navigateToTab('my-enrollments');
  };

  // Keyboard shortcuts - defined after all functions
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'b':
        case 'B':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            toggleBookmark();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [goToNext, goToPrevious, toggleBookmark]);

  // Loading state
  if (structureLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="large" message="Loading course structure..." />
      </div>
    );
  }

  // Show loading indicator when switching sessions
  const isLoadingContent = contentLoading && currentSessionId;

  // Error state
  if (structureError) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <ErrorMessage
          title="Failed to Load Course"
          message="We couldn't load the course structure. Please try again."
          error={structureError}
        />
      </div>
    );
  }

  // No content state
  if (!courseStructure || courseStructure.lessons.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Content Available</h3>
          <p className="text-gray-600 mb-6">
            This course doesn't have any lessons yet.
          </p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-neutral-900">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 text-gray-600 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {courseStructure.subjectCode} - {courseStructure.subjectName}
            </h1>
            <p className="text-sm text-gray-600">
              {courseStructure.syllabus.title || 'Course Content'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Bookmark Button */}
          {currentBlockId && (
            <button
              onClick={toggleBookmark}
              className={`p-2 rounded-lg transition-colors ${bookmarkedContent.has(currentBlockId)
                  ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              title={
                bookmarkedContent.has(currentBlockId)
                  ? 'Remove bookmark'
                  : 'Bookmark content (Ctrl+B)'
              }
            >
              <Bookmark className="w-4 h-4" />
            </button>
          )}

          {/* Syllabus PDF Button */}
          {courseStructure.syllabus.pdfUrl && (
            <button
              onClick={() => window.open(courseStructure.syllabus.pdfUrl!, '_blank')}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title="View Syllabus PDF"
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">Syllabus</span>
            </button>
          )}

          {/* Lesson Plan PDF Button */}
          {currentLesson?.pdfUrl && (
            <button
              onClick={() => window.open(currentLesson.pdfUrl!, '_blank')}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title="View Lesson Plan PDF"
            >
              <BookOpen className="w-4 h-4" />
              <span className="text-sm font-medium">Lesson Plan</span>
            </button>
          )}

          {/* Certificate Button */}
          {stats.percentage === 100 && (
            <button
              onClick={generateCertificate}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Award className="w-4 h-4" />
              <span className="text-sm font-medium">Certificate</span>
            </button>
          )}

          {/* Mark Complete / Completed Badge */}
          {/* Hide "Mark Complete" button for auto-completing content types (assignment, quiz, examination) */}
          {currentBlockId && !isCurrentBlockCompleted && !shouldAutoComplete && (
            <button
              onClick={markContentAsCompleted}
              disabled={updateProgressMutation.isPending}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {updateProgressMutation.isPending ? 'Marking...' : 'Mark Complete'}
              </span>
            </button>
          )}

          {currentBlockId && isCurrentBlockCompleted && (
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Completed</span>
              </div>
              {/* Hide "Unmark" button for auto-completing content types (assignment, quiz, examination) */}
              {!shouldAutoComplete && (
                <button
                  onClick={unmarkContentAsCompleted}
                  disabled={updateProgressMutation.isPending}
                  className="px-2 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  title="Unmark as completed"
                >
                  {updateProgressMutation.isPending ? 'Unmarking...' : 'Unmark'}
                </button>
              )}
            </div>
          )}

          {/* Progress Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              {stats.completed} / {stats.total}
            </span>
          </div>

          {/* Progress Percentage */}
          <div className="hidden lg:block">
            <div className="text-sm font-medium text-gray-900">{stats.percentage}%</div>
            <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div
            className="lg:hidden absolute inset-0 bg-black/50 z-20"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Left Sidebar - Course Content Tree with Tabs */}
        <div
          className={`
            absolute lg:relative z-30 h-full
            ${isSidebarOpen ? 'w-80 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0'} 
            bg-white border-r border-gray-200 transition-all duration-300 flex-shrink-0 flex flex-col
          `}
        >
          {/* Always render content but hide it visually when "closed" on desktop (w-0) or translated off-screen on mobile */}
          <>
            {/* Sidebar Header with Progress */}
            <div className="p-4 border-b border-gray-200">
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>
                    {stats.completed}/{stats.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTime(getTotalTimeSpent())}
                </div>
                <div>{stats.percentage}% Complete</div>
              </div>
            </div>

            {/* Content Tree */}
            <div className="flex-1 overflow-y-auto">
              <CourseContentTree
                lessons={courseStructure.lessons}
                currentBlockId={currentBlockId}
                progressMap={progressMap}
                onBlockSelect={(blockId, sessionId) => {
                  handleBlockSelect(blockId, sessionId);
                  // Close sidebar on mobile when a lesson is selected
                  if (window.innerWidth < 1024) {
                    setIsSidebarOpen(false);
                  }
                }}
              />
            </div>

            {/* Session Notes */}
            <div className="p-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Session Notes</h3>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Add your notes here..."
                className="w-full h-20 px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </>
        </div>

        {/* Right Panel - Content Viewer with Tabs */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="bg-white border-b border-gray-200 flex-shrink-0">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('content')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'content'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Content
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'comments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Comments
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === 'progress'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                Progress
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            {activeTab === 'content' && (
              <>
                {isLoadingContent ? (
                  <div className="flex items-center justify-center h-full">
                    <LoadingSpinner size="large" message="Loading content..." />
                  </div>
                ) : currentBlock ? (
                  <SessionContentViewer
                    key={currentBlockId}
                    block={currentBlock}
                    enrollmentId={enrollmentId}
                    onContentComplete={handleContentComplete}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <Play className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium">Select a lesson to start learning</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'comments' && (
              <div className="p-6">
                <div className="bg-white rounded-lg p-8 text-center">
                  <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Comments</h3>
                  <p className="text-gray-600">
                    Comments functionality will be available soon.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'progress' && (
              <div className="p-6">
                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Progress</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Overall Completion</span>
                      <span className="font-semibold text-blue-600 text-lg">{stats.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all"
                        style={{ width: `${stats.percentage}%` }}
                      ></div>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600">Required Blocks Completed</span>
                        <span className="font-semibold">
                          {stats.completedRequiredBlocks} / {stats.requiredBlocks}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Total Blocks Completed</span>
                        <span className="font-semibold">
                          {stats.completed} / {stats.total}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Time Spent</span>
                      <span className="font-semibold">{formatTime(getTotalTimeSpent())}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Bookmarked Content</span>
                      <span className="font-semibold">{bookmarkedContent.size}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Footer */}
          <div className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <button
                onClick={goToPrevious}
                disabled={currentBlockIndex === 0}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${currentBlockIndex === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </button>

              <div className="text-sm text-gray-600">
                {currentBlockIndex + 1} of {allContentBlocks.length}
              </div>

              <button
                onClick={goToNext}
                disabled={currentBlockIndex === allContentBlocks.length - 1}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${currentBlockIndex === allContentBlocks.length - 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      <CertificateModal
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
        sessionId={currentSessionId || ''}
        sessionTitle={courseStructure.subjectName}
        subjectName={courseStructure.subjectCode}
        completionPercentage={stats.percentage}
        completedBlocks={stats.completed}
        totalBlocks={stats.total}
      />
    </div>
  );
};

export default CoursePlayerPage;

