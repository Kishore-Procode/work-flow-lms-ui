/**
 * Play Session Player Component
 * 
 * Interactive content player for Play Session feature.
 * Displays session content blocks with progress tracking, comments, and quizzes.
 * 
 * @author Student-ACT LMS Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  CheckCircle, 
  Clock,
  MessageSquare,
  Play
} from 'lucide-react';
import {
  useSessionBySubject,
  useSessionContentBlocks,
  useUserProgress,
  useUpdateProgress,
} from '../../hooks/usePlaySession';
import LoadingSpinner from '../UI/LoadingSpinner';
import ErrorMessage from '../UI/ErrorMessage';
import type { SessionContentBlock } from '../../types/playSession';

interface PlaySessionPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
  subjectName: string;
  enrollmentId?: string;
}

const PlaySessionPlayer: React.FC<PlaySessionPlayerProps> = ({
  isOpen,
  onClose,
  subjectId,
  subjectName,
  enrollmentId,
}) => {
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Log when component opens
  useEffect(() => {
    if (isOpen) {
      console.log('🎬 PlaySessionPlayer opened:', {
        subjectId,
        subjectName,
        enrollmentId,
        timestamp: new Date().toISOString(),
      });
    }
  }, [isOpen, subjectId, subjectName, enrollmentId]);

  // Fetch session data
  const { data: sessionData, isLoading: sessionLoading, error: sessionError } =
    useSessionBySubject(subjectId, enrollmentId);

  const sessionId = sessionData?.session?.id;

  // Log session data
  useEffect(() => {
    if (sessionData) {
      console.log('✅ Session data loaded:', sessionData);
    }
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
    }
  }, [sessionData, sessionError]);

  // Fetch content blocks
  const { data: contentData, isLoading: contentLoading, error: contentError } =
    useSessionContentBlocks(sessionId || '', { enabled: !!sessionId });

  // Fetch progress
  const { data: progressData, refetch: refetchProgress, error: progressError } =
    useUserProgress(sessionId || '', enrollmentId, { enabled: !!sessionId });

  // Update progress mutation
  const updateProgressMutation = useUpdateProgress();

  const contentBlocks = contentData?.contentBlocks || [];
  const currentBlock = contentBlocks[currentBlockIndex];

  // Log content blocks
  useEffect(() => {
    if (contentData) {
      console.log('📚 Content blocks loaded:', {
        totalBlocks: contentBlocks.length,
        blocks: contentBlocks.map(b => ({ id: b.id, title: b.title, type: b.type })),
      });
    }
    if (contentError) {
      console.error('❌ Content blocks error:', contentError);
    }
  }, [contentData, contentError, contentBlocks]);

  // Log progress data
  useEffect(() => {
    if (progressData) {
      console.log('📊 Progress data loaded:', progressData);
    }
    if (progressError) {
      console.error('❌ Progress error:', progressError);
    }
  }, [progressData, progressError]);

  // Reset start time when block changes
  useEffect(() => {
    setStartTime(Date.now());
  }, [currentBlockIndex]);

  // Handle block completion
  const handleCompleteBlock = async () => {
    if (!currentBlock) return;

    const timeSpent = Math.floor((Date.now() - startTime) / 1000); // seconds

    console.log('✅ Marking block as complete:', {
      blockId: currentBlock.id,
      blockTitle: currentBlock.title,
      timeSpent,
      enrollmentId,
    });

    try {
      const result = await updateProgressMutation.mutateAsync({
        contentBlockId: currentBlock.id,
        isCompleted: true,
        timeSpent,
        enrollmentId,
      });

      console.log('✅ Progress updated successfully:', result);

      // Refetch progress
      await refetchProgress();

      // Move to next block if available
      if (currentBlockIndex < contentBlocks.length - 1) {
        setCurrentBlockIndex(currentBlockIndex + 1);
      }
    } catch (error) {
      console.error('❌ Failed to update progress:', error);
      alert('Failed to save progress. Please try again.');
    }
  };

  // Navigation handlers
  const handlePrevious = () => {
    if (currentBlockIndex > 0) {
      setCurrentBlockIndex(currentBlockIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentBlockIndex < contentBlocks.length - 1) {
      setCurrentBlockIndex(currentBlockIndex + 1);
    }
  };

  // Check if current block is completed
  const isBlockCompleted = progressData?.progress.some(
    (p) => p.contentBlockId === currentBlock?.id && p.isCompleted
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Play className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{subjectName}</h2>
              {sessionData?.session && (
                <p className="text-sm text-gray-600">{sessionData.session.title}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Loading State */}
        {(sessionLoading || contentLoading) && (
          <div className="flex-1 flex items-center justify-center p-8">
            <LoadingSpinner size="large" message="Loading session content..." />
          </div>
        )}

        {/* Error State */}
        {sessionError && (
          <div className="flex-1 p-8">
            <ErrorMessage
              title="Failed to Load Session"
              message="We couldn't load the session content. Please try again."
              error={sessionError}
            />
          </div>
        )}

        {/* No Session Mapped State */}
        {!sessionLoading && !sessionError && sessionData && !sessionData.session && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Interactive Content Available
              </h3>
              <p className="text-gray-600 mb-4">
                This subject doesn't have interactive session content mapped yet.
                Please contact your instructor or administrator.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* No Content Blocks State */}
        {!sessionLoading && !contentLoading && sessionData?.session && contentBlocks.length === 0 && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Content Available
              </h3>
              <p className="text-gray-600 mb-4">
                This session doesn't have any content blocks yet.
                Content may be added soon.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {!sessionLoading && !contentLoading && contentBlocks.length > 0 && (
          <>
            {/* Progress Bar */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">
                  Block {currentBlockIndex + 1} of {contentBlocks.length}
                </span>
                <span className="text-gray-900 font-medium">
                  {progressData?.statistics.completionPercentage || 0}% Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${progressData?.statistics.completionPercentage || 0}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Content Block */}
            <div className="flex-1 overflow-y-auto p-6">
              {currentBlock && (
                <ContentBlockRenderer
                  block={currentBlock}
                  isCompleted={isBlockCompleted || false}
                  onComplete={handleCompleteBlock}
                />
              )}
            </div>

            {/* Navigation Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handlePrevious}
                disabled={currentBlockIndex === 0}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="text-sm text-gray-600">
                {currentBlock?.title}
              </div>

              <button
                onClick={handleNext}
                disabled={currentBlockIndex === contentBlocks.length - 1}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* Empty State */}
        {!sessionLoading && !contentLoading && contentBlocks.length === 0 && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Content Available
              </h3>
              <p className="text-gray-600">
                This session doesn't have any content blocks yet.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to extract YouTube video ID
const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

// Content rendering function
const renderContentByType = (block: SessionContentBlock): React.ReactNode => {
  const content = block.contentData as any;

  switch (block.type) {
    case 'video':
      return (
        <div className="aspect-video bg-gray-900">
          {content?.url ? (
            content.url.includes('youtube.com') || content.url.includes('youtu.be') ? (
              <iframe
                src={`https://www.youtube.com/embed/${getYouTubeVideoId(content.url)}`}
                className="w-full h-full"
                style={{ border: 0 }}
                allowFullScreen
                title={block.title}
              />
            ) : (
              <video
                src={content.url}
                controls
                className="w-full h-full object-cover"
                poster={content.thumbnail}
              >
                Your browser does not support the video tag.
              </video>
            )
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No video URL provided
            </div>
          )}
        </div>
      );

    case 'text':
      return (
        <div className="p-6">
          <div className="prose max-w-none">
            {content?.format === 'html' ? (
              <div dangerouslySetInnerHTML={{ __html: content.content }} />
            ) : (
              <div className="whitespace-pre-wrap text-gray-700">{content?.content || 'No content available'}</div>
            )}
          </div>
        </div>
      );

    case 'image':
      return (
        <div className="p-6 text-center">
          {content?.url ? (
            <>
              <img
                src={content.url}
                alt={content.alt || block.title}
                className="max-w-full h-auto rounded-lg mx-auto"
              />
              {content.caption && (
                <p className="mt-4 text-sm text-gray-600 italic">{content.caption}</p>
              )}
            </>
          ) : (
            <div className="text-gray-400">No image URL provided</div>
          )}
        </div>
      );

    case 'audio':
      return (
        <div className="p-6 space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M9 9a3 3 0 000 6v-6z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Audio Content</h3>
                <p className="text-sm text-gray-600">
                  {content?.duration ? `Duration: ${content.duration}` : 'Audio content'}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-purple-100">
              {content?.url ? (
                <audio controls className="w-full">
                  <source src={content.url} type="audio/mpeg" />
                  <source src={content.url} type="audio/wav" />
                  <source src={content.url} type="audio/ogg" />
                  Your browser does not support the audio element.
                </audio>
              ) : (
                <div className="text-gray-400 text-center py-4">No audio URL provided</div>
              )}
            </div>
          </div>
          {content?.transcript && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Transcript</h4>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">{content.transcript}</div>
            </div>
          )}
        </div>
      );

    case 'pdf':
      return (
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">{content?.fileName || 'PDF Document'}</h4>
              {content?.size && <p className="text-sm text-gray-600">{content.size}</p>}
              {content?.pageCount && <p className="text-xs text-gray-500">{content.pageCount} pages</p>}
            </div>
            {content?.url && (
              <a
                href={content.url}
                download
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download PDF
              </a>
            )}
          </div>
          {content?.url && (
            <iframe
              src={content.url}
              className="w-full h-[600px] border border-gray-200 rounded-lg"
              title={block.title}
            />
          )}
        </div>
      );

    case 'code':
      return (
        <div className="p-6">
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-gray-100">
              <code>{content?.code || 'No code provided'}</code>
            </pre>
          </div>
          {content?.language && (
            <div className="mt-2 text-sm text-gray-600">
              Language: <span className="font-medium">{content.language}</span>
            </div>
          )}
        </div>
      );

    case 'quiz':
    case 'examination':
      return (
        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {block.type === 'quiz' ? 'Quiz' : 'Examination'}
            </h3>
            <p className="text-gray-600 mb-4">
              This {block.type} contains {content?.questionCount || 'multiple'} questions.
            </p>
            <p className="text-sm text-gray-500">
              Quiz functionality will be available in the next update.
            </p>
          </div>
        </div>
      );

    case 'assignment':
      return (
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Assignment</h3>
            <div className="prose max-w-none text-gray-700 mb-4">
              {content?.description || 'No description provided'}
            </div>
            {content?.dueDate && (
              <div className="text-sm text-gray-600">
                Due Date: <span className="font-medium">{new Date(content.dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      );

    default:
      return (
        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">
              Content type "{block.type}" is not yet supported.
            </p>
            {content && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-700">
                  View raw content data
                </summary>
                <pre className="mt-2 text-xs bg-white p-4 rounded border border-gray-200 overflow-auto">
                  {JSON.stringify(content, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
  }
};

// Content Block Renderer Component
const ContentBlockRenderer: React.FC<{
  block: SessionContentBlock;
  isCompleted: boolean;
  onComplete: () => void;
}> = ({ block, isCompleted, onComplete }) => {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Block Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
            {block.type.toUpperCase()}
          </span>
          {isCompleted && (
            <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              Completed
            </span>
          )}
          {block.isRequired && (
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
              Required
            </span>
          )}
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{block.title}</h3>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {block.estimatedMinutes} min
          </span>
        </div>
      </div>

      {/* Block Content */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
        {renderContentByType(block)}
      </div>

      {/* Complete Button */}
      {!isCompleted && (
        <button
          onClick={onComplete}
          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <CheckCircle className="w-5 h-5" />
          Mark as Complete
        </button>
      )}
    </div>
  );
};

export default PlaySessionPlayer;

