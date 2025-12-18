import React, { useState } from 'react';
import { Upload, Download, FileText, CheckCircle, XCircle, AlertCircle, Users, GraduationCap, BookOpen } from 'lucide-react';
import { ApiService } from '../../services/api';
import { useToast } from '../UI/Toast';

interface BulkUploadResult {
  totalProcessed: number;
  successfulUploads: number;
  invitationsSent: number;
  errors: number;
  details: {
    successful: any[];
    invitations: any[];
    errors: string[];
  };
}

interface BulkStudentUploadProps {
  onSuccess?: () => void;
}

const BulkStudentUpload: React.FC<BulkStudentUploadProps> = ({ onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const toast = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast.error('Invalid file type', 'Please select a CSV file');
        return;
      }
      setSelectedFile(file);
      setUploadResult(null);
      setShowResults(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const blob = await ApiService.downloadStudentUploadTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'student_upload_template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Template downloaded', 'CSV template has been downloaded successfully');
    } catch (error) {
      console.error('Failed to download template:', error);
      toast.error('Download failed', 'Failed to download CSV template');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('No file selected', 'Please select a CSV file to upload');
      return;
    }

    setUploading(true);
    try {
      const result = await ApiService.uploadStudentsCSV(selectedFile);
      setUploadResult(result.data);
      setShowResults(true);
      
      if (result.data.errors === 0) {
        toast.success('🎉 Bulk Upload Successful!', `✅ ${result.data.successfulUploads} students added to database\n📧 ${result.data.invitationsSent} email invitations sent\n🔄 Click "Upload Another File" to refresh the student list`);
      } else {
        toast.warning('⚠️ Upload Completed with Issues', `✅ ${result.data.successfulUploads} students added successfully\n❌ ${result.data.errors} errors encountered\nPlease check the details below`);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload failed', 'Failed to process CSV file. Please check the format and try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setShowResults(false);
    // Reset file input
    const fileInput = document.getElementById('studentCsvFile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    // Call onSuccess callback to refresh the student list
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
      <div className="mb-6">
        <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-2">Student Bulk Upload</h2>
        <p className="text-sm lg:text-base text-gray-600">
          Upload student information using a CSV file. Automated email invitations will be sent to all students for platform registration.
        </p>
      </div>

      {/* Step 1: Download Template */}
      <div className="mb-6">
        <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
          Download CSV Template
        </h3>
        <p className="text-sm lg:text-base text-gray-600 mb-3">
          Download the CSV template with the required format for student information.
        </p>
        <button
          onClick={downloadTemplate}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-3 lg:py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
        >
          <Download className="w-4 h-4" />
          Download Template
        </button>
      </div>

      {/* Step 2: Upload CSV */}
      <div className="mb-6">
        <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
          Upload CSV File
        </h3>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 lg:p-6 text-center">
          <Upload className="w-10 lg:w-12 h-10 lg:h-12 text-gray-400 mx-auto mb-4" />
          
          {selectedFile ? (
            <div className="mb-4">
              <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
                <FileText className="w-5 h-5" />
                <span className="font-medium text-sm lg:text-base truncate max-w-[200px] lg:max-w-none">{selectedFile.name}</span>
              </div>
              <p className="text-xs lg:text-sm text-gray-500">
                File size: {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          ) : (
            <div className="mb-4">
              <p className="text-gray-600 mb-2 text-sm lg:text-base">Select a CSV file to upload</p>
              <p className="text-xs lg:text-sm text-gray-500">Maximum file size: 10MB</p>
            </div>
          )}

          <input
            id="studentCsvFile"
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!selectedFile && (
            <label
              htmlFor="studentCsvFile"
              className="bg-gray-600 text-white px-4 py-3 lg:py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer min-h-[44px] flex items-center justify-center"
            >
              {selectedFile ? 'Change File' : 'Select File'}
            </label>
            )}
            
            {selectedFile && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="bg-blue-600 text-white px-6 py-3 lg:py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload & Process
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Upload Results */}
      {showResults && uploadResult && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
            Upload Results
          </h3>

          {/* Success Banner */}
          {uploadResult.errors === 0 && uploadResult.successfulUploads > 0 && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
              <div className="flex items-center">
                <CheckCircle className="w-6 h-6 text-blue-600 mr-3" />
                <div>
                  <h4 className="text-lg font-semibold text-blue-800">🎉 Bulk Upload Successful!</h4>
                  <p className="text-blue-700 mt-1">
                    All {uploadResult.successfulUploads} students have been successfully added to the database and invitation emails have been sent.
                    The student list will refresh automatically.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Partial Success Banner */}
          {uploadResult.errors > 0 && uploadResult.successfulUploads > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex items-center">
                <AlertCircle className="w-6 h-6 text-yellow-600 mr-3" />
                <div>
                  <h4 className="text-lg font-semibold text-yellow-800">⚠️ Partial Upload Success</h4>
                  <p className="text-yellow-700 mt-1">
                    {uploadResult.successfulUploads} students were added successfully, but {uploadResult.errors} errors occurred.
                    Please review the error details below.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {uploadResult.errors > 0 && uploadResult.successfulUploads === 0 && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <div className="flex items-center">
                <XCircle className="w-6 h-6 text-red-600 mr-3" />
                <div>
                  <h4 className="text-lg font-semibold text-red-800">❌ Upload Failed</h4>
                  <p className="text-red-700 mt-1">
                    No students were added due to errors. Please review the error details below and fix the issues in your CSV file.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Total Processed</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{uploadResult.totalProcessed}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Students Added</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{uploadResult.successfulUploads}</p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Invitations Sent</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">{uploadResult.invitationsSent}</p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-red-800">Errors</span>
              </div>
              <p className="text-2xl font-bold text-red-900">{uploadResult.errors}</p>
            </div>
          </div>

          {/* Detailed Results */}
          {uploadResult.details.successful.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Successfully Added ({uploadResult.details.successful.length})
              </h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                {uploadResult.details.successful.map((item, index) => (
                  <div key={index} className="text-sm text-blue-800 mb-1">
                    ✅ {item.name} - Successfully added
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploadResult.details.errors.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Errors ({uploadResult.details.errors.length})
              </h4>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                {uploadResult.details.errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-800 mb-1">
                    ❌ {JSON.stringify(error)}
                  </div>
                ))}
              </div>
            </div>
          )}
          

          <div className="flex gap-3">
            <button
              onClick={resetUpload}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Upload Another File
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">CSV Format Requirements:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Required columns: name, email, phone, rollNumber, year, departmentName</li>
          <li>• Optional columns: section, departmentCode, guardianName, guardianPhone, address</li>
          <li>• Email addresses must be unique and valid</li>
          <li>• Roll numbers must be unique within the college</li>
          <li>• Phone numbers should include country code (e.g., +1-555-0123)</li>
          <li>• Year should be the admission year (e.g., 2021, 2022)</li>
          <li>• Staff can only upload students for their own department</li>
          <li>• HODs can upload students for any department in their college</li>
          <li>• Automated email invitations will be sent to all students</li>
        </ul>
      </div>
    </div>
  );
};

export default BulkStudentUpload;
