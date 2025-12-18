/**
 * Play Session Page - Full Page View
 * 
 * Full-page interactive content player for Play Session feature.
 * Matches the layout and functionality of the parent Workflow Management System.
 * 
 * @author Student-ACT LMS Team
 * @version 2.0.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  BookOpen,
  Award,
  Menu,
  X,
  MessageCircle,
  BarChart3,
  Bookmark,
  RotateCcw,
  Eye,
  Play
} from 'lucide-react';
import {
  useSessionBySubject,
  useSessionContentBlocks,
  useUserProgress,
  useUpdateProgress,
} from '../hooks/usePlaySession';
import { router } from '../utils/router';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import ErrorMessage from '../components/UI/ErrorMessage';
import SessionContentViewer from '../components/PlaySession/SessionContentViewer';
import CertificateModal from '../components/PlaySession/CertificateModal';
import type { SessionContentBlock } from '../types/playSession';

interface PlaySessionPageProps {
  subjectId: string;
}

const PlaySessionPage: React.FC<PlaySessionPageProps> = ({ subjectId }) => {
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'comments' | 'progress'>('content');
  const [sessionStartTime] = useState<Date>(new Date());
  const [currentContentStartTime, setCurrentContentStartTime] = useState<Date>(new Date());
  const [bookmarkedContent, setBookmarkedContent] = useState<Set<string>>(new Set());
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [showCertificate, setShowCertificate] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const mode = 'learning'; // Always learning mode for students

  // Log when component mounts
  useEffect(() => {
    console.log('🎬 PlaySessionPage mounted:', {
      subjectId,
      timestamp: new Date().toISOString(),
    });
  }, [subjectId]);

  // Fetch session data
  const { data: sessionData, isLoading: sessionLoading, error: sessionError } =
    useSessionBySubject(subjectId);

  const sessionId = sessionData?.session?.id;
  const session = sessionData?.session;
  const enrollmentId = sessionData?.enrollmentId; // Get enrollmentId from session data

  // Fetch content blocks
  const { data: contentData, isLoading: contentLoading, error: contentError } =
    useSessionContentBlocks(sessionId || '');

  // Fetch progress
  const { data: progressData } = useUserProgress(sessionId || '');

  // Update progress mutation with optimistic updates
  const updateProgressMutation = useUpdateProgress(sessionId || '');

  const contentBlocks = contentData?.contentBlocks || [];

  // Memoize current block to prevent unnecessary re-renders of video player
  // Only update when the block ID actually changes
  const currentBlock = useMemo(() => {
    return contentBlocks[currentBlockIndex];
  }, [contentBlocks, currentBlockIndex]);

  // Memoize the block ID to prevent unnecessary re-renders
  const currentBlockId = useMemo(() => currentBlock?.id, [currentBlock?.id]);

  const userProgress = progressData?.progress || [];

  // Reset timer when content changes
  useEffect(() => {
    setCurrentContentStartTime(new Date());
  }, [currentBlockIndex]);

  // Check if current block should auto-complete (assignment, quiz, examination)
  const shouldAutoComplete = useMemo(() => {
    if (!currentBlock) return false;
    const autoCompleteTypes = ['assignment', 'quiz', 'examination'];
    return autoCompleteTypes.includes(currentBlock.type);
  }, [currentBlock]);

  // Exit handler
  const handleExit = () => {
    console.log('🚪 Exiting Play Session');
    router.navigateTo('my-enrollments');
  };

  // Navigation handlers
  const goToNext = () => {
    if (currentBlockIndex < contentBlocks.length - 1) {
      const nextIndex = currentBlockIndex + 1;
      const nextBlock = contentBlocks[nextIndex];

      // Check if next block is assignment or examination
      if (nextBlock && (nextBlock.type === 'assignment' || nextBlock.type === 'examination')) {
        console.log('🔀 Next content is', nextBlock.type, '- redirecting to dedicated page');
        if (nextBlock.type === 'assignment') {
          router.navigateToAssignments();
        } else {
          router.navigateToExaminations();
        }
        return;
      }

      setCurrentBlockIndex(nextIndex);
    }
  };

  const goToPrevious = () => {
    if (currentBlockIndex > 0) {
      const prevIndex = currentBlockIndex - 1;
      const prevBlock = contentBlocks[prevIndex];

      // Check if previous block is assignment or examination
      if (prevBlock && (prevBlock.type === 'assignment' || prevBlock.type === 'examination')) {
        console.log('🔀 Previous content is', prevBlock.type, '- redirecting to dedicated page');
        if (prevBlock.type === 'assignment') {
          router.navigateToAssignments();
        } else {
          router.navigateToExaminations();
        }
        return;
      }

      setCurrentBlockIndex(prevIndex);
    }
  };

  const goToContent = (index: number) => {
    // Check the content type before navigating
    const block = contentBlocks[index];

    if (block) {
      // Redirect assignments to the dedicated Assignments page
      if (block.type === 'assignment') {
        console.log('🔀 Redirecting to Assignments page for assignment:', block.title);
        router.navigateToAssignments();
        return;
      }

      // Redirect examinations to the dedicated Examinations page
      if (block.type === 'examination') {
        console.log('🔀 Redirecting to Examinations page for examination:', block.title);
        router.navigateToExaminations();
        return;
      }
    }

    // For all other content types, display in the play session
    setCurrentBlockIndex(index);
    setSidebarOpen(false);
  };

  // Progress tracking
  const getCompletionStats = () => {
    const completed = userProgress.filter(p => p.isCompleted).length;
    const total = contentBlocks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  };

  const getTotalTimeSpent = () => {
    const totalSeconds = userProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
    const currentSessionTime = Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 1000);
    return totalSeconds + currentSessionTime;
  };

  const formatTime = (seconds: number) => {
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
  };

  const markContentAsCompleted = async (contentBlockId: string) => {
    try {
      const timeSpent = Math.floor((new Date().getTime() - currentContentStartTime.getTime()) / 1000);

      console.log('🔄 Marking content as completed:', {
        contentBlockId,
        enrollmentId,
        timeSpent,
        isCompleted: true
      });

      await updateProgressMutation.mutateAsync({
        contentBlockId,
        enrollmentId, // Pass enrollmentId instead of sessionId
        isCompleted: true,
        timeSpent,
        completionData: JSON.stringify({
          completedAt: new Date().toISOString(),
          sessionId
        })
      });

      // No need to refetch - optimistic update handles it
      console.log('✅ Content marked as completed:', contentBlockId);
    } catch (error) {
      console.error('❌ Error marking content as completed:', error);
    }
  };

  const unmarkContentAsCompleted = async (contentBlockId: string) => {
    try {
      // Prevent unmarking auto-completing content types (assignment, quiz, examination)
      if (shouldAutoComplete) {
        console.log('⚠️ Cannot unmark auto-completing content type:', currentBlock?.type);
        alert('This content was automatically marked as complete and cannot be unmarked manually.');
        return;
      }

      const timeSpent = Math.floor((new Date().getTime() - currentContentStartTime.getTime()) / 1000);

      console.log('🔄 Unmarking content as completed:', {
        contentBlockId,
        enrollmentId,
        timeSpent,
        isCompleted: false
      });

      await updateProgressMutation.mutateAsync({
        contentBlockId,
        enrollmentId,
        isCompleted: false, // ✅ Set to false to unmark
        timeSpent,
        completionData: JSON.stringify({
          unmarkedAt: new Date().toISOString(),
          sessionId
        })
      });

      // No need to refetch - optimistic update handles it
      console.log('✅ Content unmarked as completed:', contentBlockId);
    } catch (error) {
      console.error('❌ Error unmarking content as completed:', error);
    }
  };

  const toggleBookmark = (contentBlockId: string) => {
    setBookmarkedContent(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contentBlockId)) {
        newSet.delete(contentBlockId);
        console.log('🔖 Bookmark removed:', contentBlockId);
      } else {
        newSet.add(contentBlockId);
        console.log('🔖 Content bookmarked:', contentBlockId);
      }
      return newSet;
    });
  };

  const generateCertificate = () => {
    const stats = getCompletionStats();
    if (stats.percentage === 100) {
      setShowCertificate(true);
    } else {
      console.log('⚠️ Complete all content to generate certificate');
    }
  };

  // Loading state
  if (sessionLoading || contentLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-neutral-300">Loading session content...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (sessionError || contentError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <ErrorMessage 
            message={sessionError?.message || contentError?.message || 'Failed to load session'} 
          />
          <button
            onClick={handleExit}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // No content state
  if (contentBlocks.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-gray-400 dark:text-neutral-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-2">No Content Available</h3>
          <p className="text-gray-600 dark:text-neutral-300 mb-6">This session doesn't have any content blocks yet.</p>
          <button
            onClick={handleExit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const stats = getCompletionStats();
  const isCompleted = userProgress.find(p => p.contentBlockId === currentBlock?.id)?.isCompleted || false;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-neutral-800 shadow-lg transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">Session Content</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-gray-400 dark:text-neutral-400 hover:text-gray-600 dark:hover:text-neutral-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress Overview */}
          <div className="p-4 border-b border-gray-200">
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{stats.completed}/{stats.total}</span>
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

          {/* Content List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              {contentBlocks.map((block, index) => {
                const isActive = index === currentBlockIndex;
                const isBlockCompleted = userProgress.find(p => p.contentBlockId === block.id)?.isCompleted || false;

                return (
                  <button
                    key={block.id}
                    onClick={() => goToContent(index)}
                    className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                      isActive
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        isBlockCompleted
                          ? 'bg-green-100 text-green-800'
                          : isActive
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {isBlockCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          isActive ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {block.title}
                        </p>
                        <p className={`text-xs truncate ${
                          isActive ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {block.type} • {block.estimatedMinutes} min
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
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

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleExit}
              className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 inline mr-2" />
              Exit Session
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <div className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-400 dark:text-neutral-400 hover:text-gray-600 dark:hover:text-neutral-300"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-gray-900">
                    {currentBlock?.title}
                  </h1>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-600">
                    Learning Mode
                  </span>
                </div>
                <p className="text-sm text-gray-600 capitalize">
                  {currentBlock?.type} Content • {currentBlockIndex + 1} of {contentBlocks.length}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => toggleBookmark(currentBlock.id)}
                className={`p-2 rounded-lg transition-colors ${
                  bookmarkedContent.has(currentBlock.id)
                    ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={bookmarkedContent.has(currentBlock.id) ? 'Remove bookmark' : 'Bookmark content'}
              >
                <Bookmark className="h-4 w-4" />
              </button>

              {stats.percentage === 100 && (
                <button
                  onClick={generateCertificate}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Award className="h-4 w-4 inline mr-2" />
                  Certificate
                </button>
              )}

              {/* Hide "Mark Complete" button for auto-completing content types (assignment, quiz, examination) */}
              {!isCompleted && !shouldAutoComplete && (
                <button
                  onClick={() => markContentAsCompleted(currentBlock.id)}
                  disabled={updateProgressMutation.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="h-4 w-4 inline mr-2" />
                  {updateProgressMutation.isPending ? 'Marking...' : 'Mark Complete'}
                </button>
              )}

              {isCompleted && (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                  {/* Hide "Unmark" button for auto-completing content types (assignment, quiz, examination) */}
                  {!shouldAutoComplete && (
                    <button
                      onClick={() => unmarkContentAsCompleted(currentBlock.id)}
                      disabled={updateProgressMutation.isPending}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Unmark as completed"
                    >
                      {updateProgressMutation.isPending ? 'Unmarking...' : 'Unmark'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Tabs */}
            <div className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('content')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'content'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300 hover:border-gray-300 dark:hover:border-neutral-600'
                  }`}
                >
                  Content
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === 'comments'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Comments
                </button>
                <button
                  onClick={() => setActiveTab('progress')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === 'progress'
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
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-neutral-900">
              {activeTab === 'content' && currentBlock && (
                <SessionContentViewer
                  key={currentBlockId}
                  block={currentBlock}
                  enrollmentId={enrollmentId}
                  onContentComplete={() => {
                    // Auto-mark content as completed when quiz/exam is passed
                    markContentAsCompleted(currentBlock.id);
                  }}
                />
              )}

              {activeTab === 'comments' && (
                <div className="p-6">
                  <div className="bg-white dark:bg-neutral-800 rounded-lg p-8 text-center">
                    <MessageCircle className="h-16 w-16 text-gray-400 dark:text-neutral-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-2">Comments</h3>
                    <p className="text-gray-600 dark:text-neutral-300">
                      Comments functionality will be available soon.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'progress' && (
                <div className="p-6">
                  <div className="bg-white dark:bg-neutral-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-4">Your Progress</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-neutral-300">Completed Blocks</span>
                        <span className="font-semibold dark:text-neutral-100">{stats.completed} / {stats.total}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Completion Rate</span>
                        <span className="font-semibold">{stats.percentage}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Time Spent</span>
                        <span className="font-semibold">{formatTime(getTotalTimeSpent())}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Footer */}
            <div className="bg-white dark:bg-neutral-800 border-t border-gray-200 dark:border-neutral-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={goToPrevious}
                  disabled={currentBlockIndex === 0}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    currentBlockIndex === 0
                      ? 'bg-gray-100 dark:bg-neutral-700 text-gray-400 dark:text-neutral-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </button>

                <div className="text-sm text-gray-600">
                  {currentBlockIndex + 1} of {contentBlocks.length}
                </div>

                <button
                  onClick={goToNext}
                  disabled={currentBlockIndex === contentBlocks.length - 1}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    currentBlockIndex === contentBlocks.length - 1
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
      </div>

      {/* Certificate Modal */}
      <CertificateModal
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
        sessionId={sessionId}
        sessionTitle={session?.title || 'Learning Session'}
        subjectName={session?.subjectName || 'Subject'}
        completionPercentage={stats.percentage}
        completedBlocks={stats.completed}
        totalBlocks={stats.total}
      />
    </div>
  );
};

export default PlaySessionPage;

