import React, { useState } from 'react';
import { Award, Download, X, CheckCircle, Calendar, BookOpen } from 'lucide-react';
import { saveAs } from 'file-saver';
import ApiService from '../../services/api';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  sessionTitle: string;
  subjectName: string;
  completionPercentage: number;
  completedBlocks: number;
  totalBlocks: number;
}

const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  sessionTitle,
  subjectName,
  completionPercentage,
  completedBlocks,
  totalBlocks,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadCertificate = async () => {
    setIsDownloading(true);
    setDownloadError(null);

    try {
      const blob = await ApiService.downloadPlaySessionCertificate(sessionId);
      const filename = `certificate-${sessionTitle.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
      saveAs(blob, filename);
    } catch (error: any) {
      console.error('Failed to download certificate:', error);

      if (error.response?.status === 400) {
        setDownloadError('Please complete all required content blocks to download the certificate.');
      } else {
        setDownloadError('Failed to download certificate. Please try again.');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 transform transition-all">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75" />
              <div className="relative bg-green-500 rounded-full p-6">
                <Award className="h-16 w-16 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">
            Congratulations! 🎉
          </h2>
          <p className="text-center text-gray-600 mb-8">
            You have successfully completed this learning session
          </p>

          {/* Session Details */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Session</p>
                  <p className="font-semibold text-gray-900">{sessionTitle}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Subject</p>
                  <p className="font-semibold text-gray-900">{subjectName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Completion Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{completionPercentage}%</p>
              <p className="text-sm text-gray-600 mt-1">Completion</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{completedBlocks}/{totalBlocks}</p>
              <p className="text-sm text-gray-600 mt-1">Content Blocks</p>
            </div>
          </div>

          {/* Error Message */}
          {downloadError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{downloadError}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleDownloadCertificate}
              disabled={isDownloading || completionPercentage < 100}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                completionPercentage < 100
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isDownloading
                  ? 'bg-blue-400 text-white cursor-wait'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Download className="h-5 w-5" />
              {isDownloading ? 'Downloading...' : 'Download Certificate'}
            </button>

            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>

          {/* Info Text */}
          {completionPercentage < 100 && (
            <p className="text-center text-sm text-gray-500 mt-4">
              Complete all required content blocks to download your certificate
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificateModal;

