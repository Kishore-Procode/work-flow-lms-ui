import React, { useState } from 'react';
import { Upload, Download, FileText, CheckCircle, XCircle, AlertCircle, Building } from 'lucide-react';
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

interface BulkCollegeUploadProps {
  onSuccess?: () => void;
}

const BulkCollegeUpload: React.FC<BulkCollegeUploadProps> = ({ onSuccess }) => {
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
      const blob = await ApiService.downloadCollegeUploadTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'college_upload_template.csv';
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
      const result = await ApiService.uploadCollegesCSV(selectedFile);
      setUploadResult(result.data);
      setShowResults(true);

      if (result.data.errors === 0) {
        toast.success('🎉 Bulk Upload Successful!', `✅ ${result.data.successfulUploads} colleges added to database\n🔄 College list will refresh automatically`);
      } else {
        toast.warning('⚠️ Upload Completed with Issues', `✅ ${result.data.successfulUploads} colleges added successfully\n❌ ${result.data.errors} errors encountered\nPlease check the details below`);
      }

      // Call onSuccess callback if provided and there were successful uploads
      if (onSuccess && result.data.successfulUploads > 0) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Upload failed:', error);

      // Check if this is a validation error response
      if (error.response && error.response.status === 400 && error.response.data) {
        const errorData = error.response.data;

        // Transform the validation error response to match the expected UI structure
        const transformedResult = {
          totalProcessed: errorData.summary?.totalProcessed || 0,
          successfulUploads: errorData.summary?.successCount || 0,
          invitationsSent: 0,
          errors: errorData.summary?.errorCount || errorData.errors?.length || 0,
          details: {
            successful: [],
            invitations: [],
            errors: errorData.errors || []
          }
        };

        setUploadResult(transformedResult);
        setShowResults(true);

        toast.error('❌ Validation Failed', `${transformedResult.errors} validation errors found. Please check the details below and fix your CSV file.`);
      } else {
        toast.error('Upload failed', 'Failed to process CSV file. Please check the format and try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setShowResults(false);
    // Reset file input
    const fileInput = document.getElementById('collegeCsvFile') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">College Bulk Upload</h2>
        <p className="text-gray-600">
          Upload multiple colleges using a CSV file with Excel format. Status will be set to active by default.
        </p>
      </div>

      {/* Step 1: Download Template */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
          Download CSV Template
        </h3>
        <p className="text-gray-600 mb-3">
          Download the CSV template with the required format for college information (Excel format).
        </p>
        <button
          onClick={downloadTemplate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download Template
        </button>
      </div>

      {/* Step 2: Upload CSV */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
          Upload CSV File
        </h3>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          
          {selectedFile ? (
            <div className="mb-4">
              <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
                <FileText className="w-5 h-5" />
                <span className="font-medium">{selectedFile.name}</span>
              </div>
              <p className="text-sm text-gray-500">
                File size: {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          ) : (
            <div className="mb-4">
              <p className="text-gray-600 mb-2">Select a CSV file to upload</p>
              <p className="text-sm text-gray-500">Maximum file size: 10MB</p>
            </div>
          )}

          <input
            id="collegeCsvFile"
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex gap-3 justify-center">
            {!selectedFile && (
            <label
              htmlFor="collegeCsvFile"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
            >
              {selectedFile ? 'Change File' : 'Select File'}
            </label>
            )}
            
            {selectedFile && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                    All {uploadResult.successfulUploads} colleges have been successfully added to the database.
                    The college list will refresh automatically.
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
                    {uploadResult.successfulUploads} colleges were added successfully, but {uploadResult.errors} errors occurred.
                    Please review the error details below.
                  </p>
                </div>
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
                    ❌ {error}
                  </div>
                ))}
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
                <Building className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Colleges Created</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{uploadResult.successfulUploads}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Status</span>
              </div>
              <p className="text-lg font-bold text-blue-900">Active</p>
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
                Successfully Created ({uploadResult.details.successful.length})
              </h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                {uploadResult.details.successful.map((item, index) => (
                  <div key={index} className="text-sm text-blue-800 mb-1">
                    ✅ {item.college?.name || item.name} ({item.college?.email || item.email}) - Status: Active
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
        <h4 className="font-semibold text-blue-800 mb-2">CSV Format Requirements (Excel Format):</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Required columns: <strong>College Name, College Address, Email ID, Phone Number</strong></li>
          <li>• Optional columns: <strong>Website, Established Year</strong></li>
          <li>• Email addresses must be unique and valid</li>
          <li>• Phone numbers should include country code (e.g., +1-555-0123)</li>
          <li>• Status will be set to <strong>Active</strong> by default for all colleges</li>
          <li>• Use the exact column names as shown in the template</li>
        </ul>
      </div>
    </div>
  );
};

export default BulkCollegeUpload;
