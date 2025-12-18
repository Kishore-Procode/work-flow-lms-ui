/**
 * Session Content Viewer Component
 * 
 * Renders different types of content blocks (video, text, PDF, etc.)
 * 
 * @author Student-ACT LMS Team
 * @version 1.0.0
 */

import React from 'react';
import {
  FileText,
  Video,
  Image as ImageIcon,
  FileCode,
  Music,
  File,
  ClipboardList,
  HelpCircle
} from 'lucide-react';
import type { SessionContentBlock } from '../../types/playSession';
import VideoPlayer from './VideoPlayer';
import QuizViewer from './QuizViewer';
import ExaminationViewer from './ExaminationViewer';
import AssignmentViewer from './AssignmentViewer';

interface SessionContentViewerProps {
  block: SessionContentBlock;
  enrollmentId?: string;
  onContentComplete?: () => void;
}

const SessionContentViewer: React.FC<SessionContentViewerProps> = React.memo(({ block, enrollmentId, onContentComplete }) => {
  const renderContent = () => {
    switch (block.type) {
      case 'video':
        return renderVideoContent();
      case 'text':
        return renderTextContent();
      case 'pdf':
        return renderPDFContent();
      case 'image':
        return renderImageContent();
      case 'audio':
        return renderAudioContent();
      case 'code':
        return renderCodeContent();
      case 'quiz':
        return renderQuizContent();
      case 'examination':
        return renderExaminationContent();
      case 'assignment':
        return renderAssignmentContent();
      default:
        return renderDefaultContent();
    }
  };

  const renderVideoContent = () => {
    const videoData = block.contentData;

    return (
      <VideoPlayer
        url={videoData?.url || ''}
        title={block.title}
        thumbnail={videoData?.thumbnail}
      />
    );
  };

  const renderTextContent = () => {
    const textData = block.contentData;
    
    return (
      <div className="prose max-w-none">
        <div 
          className="text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: textData?.content || textData?.text || 'No content available' }}
        />
      </div>
    );
  };

  const renderPDFContent = () => {
    const pdfData = block.contentData;
    
    if (pdfData?.url) {
      return (
        <div className="h-[600px] bg-gray-100 rounded-lg overflow-hidden">
          <iframe
            src={pdfData.url}
            className="w-full h-full"
            title={block.title}
          />
        </div>
      );
    }

    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <File className="h-16 w-16 mx-auto mb-2" />
          <p>PDF content not available</p>
          {pdfData?.filename && (
            <p className="text-sm mt-2">File: {pdfData.filename}</p>
          )}
        </div>
      </div>
    );
  };

  const renderImageContent = () => {
    const imageData = block.contentData;
    
    if (imageData?.url) {
      return (
        <div className="bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={imageData.url}
            alt={block.title}
            className="w-full h-auto"
          />
          {imageData?.caption && (
            <p className="p-4 text-sm text-gray-600">{imageData.caption}</p>
          )}
        </div>
      );
    }

    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <ImageIcon className="h-16 w-16 mx-auto mb-2" />
          <p>Image content not available</p>
        </div>
      </div>
    );
  };

  const renderAudioContent = () => {
    const audioData = block.contentData;
    
    if (audioData?.url) {
      return (
        <div className="bg-gray-100 rounded-lg p-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <Music className="h-16 w-16 text-blue-600" />
            </div>
            <audio
              src={audioData.url}
              controls
              className="w-full"
            >
              Your browser does not support the audio tag.
            </audio>
            {audioData?.transcript && (
              <div className="mt-6 p-4 bg-white rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Transcript</h4>
                <p className="text-sm text-gray-600">{audioData.transcript}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Music className="h-16 w-16 mx-auto mb-2" />
          <p>Audio content not available</p>
        </div>
      </div>
    );
  };

  const renderCodeContent = () => {
    const codeData = block.contentData;
    
    return (
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
          <div className="flex items-center space-x-2">
            <FileCode className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-300">{codeData?.language || 'Code'}</span>
          </div>
          {codeData?.filename && (
            <span className="text-xs text-gray-400">{codeData.filename}</span>
          )}
        </div>
        <pre className="p-4 overflow-x-auto">
          <code className="text-sm text-gray-100 font-mono">
            {codeData?.code || codeData?.content || 'No code available'}
          </code>
        </pre>
        {codeData?.explanation && (
          <div className="p-4 bg-gray-800 border-t border-gray-700">
            <p className="text-sm text-gray-300">{codeData.explanation}</p>
          </div>
        )}
      </div>
    );
  };

  const renderQuizContent = () => {
    return (
      <QuizViewer
        block={block}
        enrollmentId={enrollmentId}
        onQuizComplete={onContentComplete}
      />
    );
  };

  const renderExaminationContent = () => {
    return (
      <ExaminationViewer
        block={block}
        enrollmentId={enrollmentId}
        onExamComplete={onContentComplete}
      />
    );
  };

  const renderAssignmentContent = () => {
    return (
      <AssignmentViewer
        block={block}
        enrollmentId={enrollmentId}
        onAssignmentComplete={onContentComplete}
      />
    );
  };

  const renderDefaultContent = () => {
    return (
      <div className="bg-gray-100 rounded-lg p-8">
        <div className="text-center text-gray-500">
          <FileText className="h-16 w-16 mx-auto mb-2" />
          <p>Content type not supported: {block.type}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      {renderContent()}
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if the block ID or enrollmentId changes
  return prevProps.block.id === nextProps.block.id &&
         prevProps.enrollmentId === nextProps.enrollmentId;
});

export default SessionContentViewer;

