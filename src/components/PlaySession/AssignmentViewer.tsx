/**
 * Assignment Viewer Component
 * 
 * Displays assignment details and handles submission (text and/or file uploads)
 * Shows graded marks and feedback after staff reviews
 * 
 * @author Student-ACT LMS Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Upload,
  FileText,
  AlertCircle,
  Clock,
  Award,
  X,
  Download
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AssignmentService } from '../../services/assignmentService';
import type { SessionContentBlock } from '../../types/playSession';
import { toast } from 'react-hot-toast';

interface AssignmentViewerProps {
  block: SessionContentBlock;
  enrollmentId?: string;
  onAssignmentComplete?: () => void;
}

const AssignmentViewer: React.FC<AssignmentViewerProps> = ({ block, enrollmentId, onAssignmentComplete }) => {
  const queryClient = useQueryClient();
  const [submissionText, setSubmissionText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const assignmentData = block.contentData as any;
  const maxPoints = assignmentData?.maxPoints || 100;
  const submissionFormat = assignmentData?.submissionFormat || 'both'; // 'text', 'file', 'both'
  const instructions = assignmentData?.instructions || '';
  const description = assignmentData?.description || '';
  const dueDate = assignmentData?.dueDate;

  // Fetch submission status
  const { data: submissionStatus, isLoading } = useQuery({
    queryKey: ['assignment-submission-status', block.id],
    queryFn: async () => {
      const response = await AssignmentService.getAssignmentSubmissionStatus(block.id);
      return response.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Trigger completion callback when assignment is graded and passed
  useEffect(() => {
    if (submissionStatus?.hasSubmitted &&
        submissionStatus?.submission?.isGraded &&
        submissionStatus?.submission?.isPassed) {
      // Assignment is graded and student passed - mark as complete
      if (onAssignmentComplete) {
        onAssignmentComplete();
      }
    }
  }, [submissionStatus, onAssignmentComplete]);

  // Submit assignment mutation
  const submitAssignmentMutation = useMutation({
    mutationFn: async (data: { contentBlockId: string; submissionText?: string; submissionFiles?: any[] }) => {
      const response = await AssignmentService.submitAssignment(data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Assignment submitted successfully! Your submission will be graded by your instructor.');
      queryClient.invalidateQueries({ queryKey: ['assignment-submission-status', block.id] });
      setSubmissionText('');
      setSelectedFiles([]);
      // DO NOT call onAssignmentComplete() here - assignment is not complete until graded and passed
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit assignment');
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file size (max 10MB per file)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const invalidFiles = files.filter(file => file.size > maxSize);
    
    if (invalidFiles.length > 0) {
      toast.error(`Some files exceed the 10MB size limit`);
      return;
    }

    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validation
    if (submissionFormat === 'text' && !submissionText.trim()) {
      toast.error('Please enter your submission text');
      return;
    }

    if (submissionFormat === 'file' && selectedFiles.length === 0) {
      toast.error('Please upload at least one file');
      return;
    }

    if (submissionFormat === 'both' && !submissionText.trim() && selectedFiles.length === 0) {
      toast.error('Please provide either text submission or file upload');
      return;
    }

    // Upload files first (if any)
    let uploadedFiles: any[] = [];
    if (selectedFiles.length > 0) {
      setUploading(true);
      try {
        // TODO: Implement actual file upload to cloud storage
        // For now, we'll simulate file URLs
        uploadedFiles = selectedFiles.map(file => ({
          fileName: file.name,
          fileUrl: `https://storage.example.com/${file.name}`, // Replace with actual upload
          fileSize: file.size,
        }));
      } catch (error) {
        toast.error('Failed to upload files');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    // Submit assignment
    submitAssignmentMutation.mutate({
      contentBlockId: block.id,
      submissionText: submissionText.trim() || undefined,
      submissionFiles: uploadedFiles.length > 0 ? uploadedFiles : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const hasSubmitted = submissionStatus?.hasSubmitted;
  const submission = submissionStatus?.submission;
  const isGraded = submission?.isGraded;

  return (
    <div className="p-6 space-y-6">
      {/* Assignment Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">{block.title}</h2>
            <div className="flex items-center gap-6 text-purple-100">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                <span>{maxPoints} Points</span>
              </div>
              {dueDate && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Due: {new Date(dueDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
          {hasSubmitted && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isGraded
                ? 'bg-green-500/20 text-white'
                : 'bg-yellow-500/20 text-white'
            }`}>
              {isGraded ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Graded</span>
                </>
              ) : (
                <>
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">Under Evaluation</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Assignment Description */}
      {description && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
          <div className="prose max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: description }} />
        </div>
      )}

      {/* Assignment Instructions */}
      {instructions && (
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Instructions</h3>
              <div className="prose max-w-none text-blue-800" dangerouslySetInnerHTML={{ __html: instructions }} />
            </div>
          </div>
        </div>
      )}

      {/* Graded Submission Display */}
      {hasSubmitted && isGraded && (
        <div className="space-y-6">
          {/* Grade Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-200 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-green-900">Assignment Graded</h3>
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 font-medium">Your Score:</span>
                  <span className="text-3xl font-bold text-green-600">
                    {submission.score}/{submission.maxScore}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Percentage:</span>
                  <span className="text-xl font-semibold text-green-600">{submission.percentage}%</span>
                </div>
              </div>
              {submission.isPassed ? (
                <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-3 rounded-lg">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">✓ Passed (≥50%)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-red-100 text-red-800 px-4 py-3 rounded-lg">
                  <X className="h-5 w-5" />
                  <span className="font-semibold">Not Passed (&lt;50%)</span>
                </div>
              )}
              {submission.feedback && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Instructor Feedback:
                  </p>
                  <p className="text-gray-800 leading-relaxed">{submission.feedback}</p>
                </div>
              )}
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Graded on: {new Date(submission.gradedAt).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Your Submission Review */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Your Submission
            </h3>
            <div className="space-y-4">
              {submission.submissionText && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Answer:</p>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-800 whitespace-pre-wrap">{submission.submissionText}</p>
                  </div>
                </div>
              )}
              {submission.submissionFiles && submission.submissionFiles.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</p>
                  <div className="space-y-2">
                    {submission.submissionFiles.map((file, index) => (
                      <a
                        key={index}
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 bg-gray-50 p-3 rounded-lg border border-gray-200 transition-colors"
                      >
                        <Download className="h-5 w-5" />
                        <span className="font-medium">{file.fileName}</span>
                        <span className="text-sm text-gray-500 ml-auto">({(file.fileSize / 1024).toFixed(2)} KB)</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-sm text-gray-600 flex items-center gap-2 pt-2 border-t border-gray-200">
                <Clock className="h-4 w-4" />
                Submitted on: {new Date(submission.submittedAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submitted but Not Graded */}
      {hasSubmitted && !isGraded && (
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-6 border-2 border-yellow-300 shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-yellow-500 rounded-lg animate-pulse">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-yellow-900">Under Evaluation</h3>
            </div>
            <p className="text-yellow-800 leading-relaxed">
              Your assignment has been submitted successfully and is currently being evaluated by your instructor.
              You will be notified once grading is complete.
            </p>
          </div>

          {/* Submission Review */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Your Submission
            </h3>
            <div className="space-y-4">
              {submission.submissionText && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Answer:</p>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-800 whitespace-pre-wrap">{submission.submissionText}</p>
                  </div>
                </div>
              )}
              {submission.submissionFiles && submission.submissionFiles.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</p>
                  <div className="space-y-2">
                    {submission.submissionFiles.map((file, index) => (
                      <a
                        key={index}
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 bg-gray-50 p-3 rounded-lg border border-gray-200 transition-colors"
                      >
                        <Download className="h-5 w-5" />
                        <span className="font-medium">{file.fileName}</span>
                        <span className="text-sm text-gray-500 ml-auto">({(file.fileSize / 1024).toFixed(2)} KB)</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-sm text-gray-600 flex items-center gap-2 pt-2 border-t border-gray-200">
                <Clock className="h-4 w-4" />
                Submitted on: {new Date(submission.submittedAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submission Form */}
      {!hasSubmitted && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Your Assignment</h3>
          
          {/* Text Submission */}
          {(submissionFormat === 'text' || submissionFormat === 'both') && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Answer {submissionFormat === 'text' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Type your answer here..."
              />
            </div>
          )}

          {/* File Upload */}
          {(submissionFormat === 'file' || submissionFormat === 'both') && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Files {submissionFormat === 'file' && <span className="text-red-500">*</span>}
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-1">Click to upload files</p>
                  <p className="text-sm text-gray-500">PDF, DOC, DOCX, TXT, JPG, PNG (Max 10MB per file)</p>
                </label>
              </div>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={submitAssignmentMutation.isPending || uploading}
            className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {submitAssignmentMutation.isPending || uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                {uploading ? 'Uploading...' : 'Submitting...'}
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                Submit Assignment
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default AssignmentViewer;

