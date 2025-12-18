/**
 * Course Content Tree Component
 *
 * Left panel tree/accordion structure for course navigation.
 * Shows real lesson hierarchy from database: Lessons → Sessions → Content Blocks
 * Displays completion indicators and active selection highlighting.
 *
 * @author Student-ACT LMS Team
 * @version 2.0.0
 */

import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Circle,
  Play,
  FileText,
  Video,
  Image as ImageIcon,
  FileCode,
  Music,
  File,
  ClipboardList,
  HelpCircle,
  Lock,
  BookOpen
} from 'lucide-react';
import type { Lesson } from '../../hooks/api/useCourseStructure';

interface CourseContentTreeProps {
  lessons: Lesson[];
  currentBlockId: string | null;
  progressMap: Map<string, any>;
  onBlockSelect: (blockId: string, sessionId: string) => void;
}

const CourseContentTree: React.FC<CourseContentTreeProps> = ({
  lessons,
  currentBlockId,
  progressMap,
  onBlockSelect,
}) => {
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  // Auto-expand lesson and session containing current block
  React.useEffect(() => {
    if (currentBlockId) {
      for (const lesson of lessons) {
        for (const session of lesson.sessions) {
          const hasCurrentBlock = session.contentBlocks.some(
            (block) => block.id === currentBlockId
          );
          if (hasCurrentBlock) {
            setExpandedLessons((prev) => new Set(prev).add(lesson.id));
            setExpandedSessions((prev) => new Set(prev).add(session.id));
            break;
          }
        }
      }
    }
  }, [currentBlockId, lessons]);

  const toggleLesson = (lessonId: string) => {
    setExpandedLessons((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId);
      } else {
        newSet.add(lessonId);
      }
      return newSet;
    });
  };

  const toggleSession = (sessionId: string) => {
    setExpandedSessions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'text':
        return <FileText className="w-4 h-4" />;
      case 'pdf':
        return <File className="w-4 h-4" />;
      case 'image':
        return <ImageIcon className="w-4 h-4" />;
      case 'audio':
        return <Music className="w-4 h-4" />;
      case 'code':
        return <FileCode className="w-4 h-4" />;
      case 'quiz':
      case 'examination':
        return <ClipboardList className="w-4 h-4" />;
      case 'assignment':
        return <HelpCircle className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  const getLessonStats = (lesson: Lesson) => {
    const allBlocks = lesson.sessions.flatMap((s) => s.contentBlocks);
    const total = allBlocks.length;
    const completed = allBlocks.filter((block) => progressMap.get(block.id)?.isCompleted).length;
    return { total, completed, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };

  const getSessionStats = (sessionBlocks: any[]) => {
    const total = sessionBlocks.length;
    const completed = sessionBlocks.filter((block) => progressMap.get(block.id)?.isCompleted).length;
    return { total, completed, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };

  // Calculate total stats
  const totalStats = useMemo(() => {
    const allBlocks = lessons.flatMap((l) => l.sessions.flatMap((s) => s.contentBlocks));
    const total = allBlocks.length;
    const completed = allBlocks.filter((block) => progressMap.get(block.id)?.isCompleted).length;
    return { total, completed };
  }, [lessons, progressMap]);

  return (
    <div className="py-4">
      <div className="px-4 mb-4">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Course Content
        </h2>
        <p className="text-xs text-gray-600 mt-1">
          {lessons.length} lessons • {totalStats.total} items
        </p>
      </div>

      <div className="space-y-1">
        {lessons.map((lesson) => {
          const isLessonExpanded = expandedLessons.has(lesson.id);
          const lessonStats = getLessonStats(lesson);
          const isLessonComplete = lessonStats.completed === lessonStats.total;

          return (
            <div key={lesson.id} className="border-b border-gray-100 last:border-0">
              {/* Lesson Header */}
              <button
                onClick={() => toggleLesson(lesson.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-shrink-0">
                    {isLessonExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    )}
                  </div>

                  <div className="flex-shrink-0 text-blue-600">
                    <BookOpen className="w-4 h-4" />
                  </div>

                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {lesson.moduleName}
                      </h3>
                      {isLessonComplete && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {lesson.sessions.length} sessions • {lessonStats.completed} / {lessonStats.total} completed
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-16 ml-2">
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${lessonStats.percentage}%` }}
                    />
                  </div>
                </div>
              </button>

              {/* Sessions */}
              {isLessonExpanded && (
                <div className="bg-gray-50">
                  {lesson.sessions.map((session) => {
                    const isSessionExpanded = expandedSessions.has(session.id);
                    const sessionStats = getSessionStats(session.contentBlocks);
                    const isSessionComplete = sessionStats.completed === sessionStats.total;

                    return (
                      <div key={session.id} className="border-t border-gray-200">
                        {/* Session Header */}
                        <button
                          onClick={() => toggleSession(session.id)}
                          className="w-full px-4 py-2.5 pl-12 flex items-center justify-between hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex-shrink-0">
                              {isSessionExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                              )}
                            </div>

                            <div className="flex-1 text-left">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-medium text-gray-800">
                                  {session.title}
                                </h4>
                                {isSessionComplete && (
                                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {session.contentBlocks.length} items
                                {session.duration && ` • ${session.duration} min`}
                              </p>
                            </div>
                          </div>

                          {/* Session Progress */}
                          <div className="text-xs text-gray-600 ml-2">
                            {sessionStats.completed}/{sessionStats.total}
                          </div>
                        </button>

                        {/* Content Blocks */}
                        {isSessionExpanded && (
                          <div className="bg-white">
                            {session.contentBlocks.map((block) => {
                              const isActive = block.id === currentBlockId;
                              const isCompleted = progressMap.get(block.id)?.isCompleted;
                              const isLocked = false; // Implement locking logic if needed

                              return (
                                <button
                                  key={block.id}
                                  onClick={() => !isLocked && onBlockSelect(block.id, session.id)}
                                  disabled={isLocked}
                                  className={`w-full px-4 py-2.5 pl-20 flex items-center gap-3 transition-colors ${
                                    isActive
                                      ? 'bg-blue-50 border-l-4 border-blue-600'
                                      : 'hover:bg-gray-50 border-l-4 border-transparent'
                                  } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                  {/* Completion/Play Icon */}
                                  <div className="flex-shrink-0">
                                    {isLocked ? (
                                      <Lock className="w-3.5 h-3.5 text-gray-400" />
                                    ) : isCompleted ? (
                                      <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                    ) : isActive ? (
                                      <Play className="w-3.5 h-3.5 text-blue-600" />
                                    ) : (
                                      <Circle className="w-3.5 h-3.5 text-gray-400" />
                                    )}
                                  </div>

                                  {/* Content Type Icon */}
                                  <div className={`flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                                    {getContentIcon(block.type)}
                                  </div>

                                  {/* Block Title */}
                                  <div className="flex-1 text-left">
                                    <p
                                      className={`text-sm ${
                                        isActive ? 'font-medium text-blue-900' : 'text-gray-700'
                                      }`}
                                    >
                                      {block.title}
                                    </p>
                                    {block.estimatedTime && (
                                      <p className="text-xs text-gray-500 mt-0.5">
                                        {block.estimatedTime} min
                                      </p>
                                    )}
                                  </div>

                                  {/* Required Badge */}
                                  {block.isRequired && (
                                    <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded">
                                      Required
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Expand/Collapse All */}
      <div className="px-4 mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => {
            if (expandedLessons.size === lessons.length) {
              setExpandedLessons(new Set());
              setExpandedSessions(new Set());
            } else {
              setExpandedLessons(new Set(lessons.map((l) => l.id)));
              const allSessionIds = lessons.flatMap((l) => l.sessions.map((s) => s.id));
              setExpandedSessions(new Set(allSessionIds));
            }
          }}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {expandedLessons.size === lessons.length ? 'Collapse All' : 'Expand All'}
        </button>
      </div>
    </div>
  );
};

export default CourseContentTree;

