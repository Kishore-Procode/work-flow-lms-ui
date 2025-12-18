import React, { useState, useEffect } from 'react';
import { BookOpen, Upload, Calendar, Eye, Camera, Plus, CheckCircle, Clock, GraduationCap, MapPin, Ruler, Trash2, MoreVertical } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useIsMobile } from '../../hooks/useIsMobile';
import { ApiService, getImageUrl } from '../../services/api';
import { useToast } from '../UI/Toast';
import CameraCaptureModal from '../Camera/CameraCaptureModal';

interface EnhancedStudentDashboardProps {
  onNavigate: (tab: string) => void;
}

const EnhancedStudentDashboard: React.FC<EnhancedStudentDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isMobile = useIsMobile(); // Use mobile detection hook
  const toast = useToast();
  const [resourceEnrollment, setResourceEnrollment] = useState<any>(null);
  const [availableResources, setAvailableResources] = useState<any[]>([]);
  const [submissionFiles, setSubmissionFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResourceSelection, setShowResourceSelection] = useState(false);
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedImageType, setSelectedImageType] = useState<'progress' | 'issue' | 'general'>('progress');
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    try {
      // Load resource enrollment
      const enrollment = await ApiService.getMyTreeSelection();
      setResourceEnrollment(enrollment);

      if (enrollment && (enrollment.treeId || enrollment.tree_id || enrollment.id)) {
        console.log('Resource enrollment data:', enrollment);
        // Load submission files using the correct resource ID (handle both camelCase and snake_case)
        const resourceId = enrollment.treeId || enrollment.tree_id || enrollment.id;
        const files = await ApiService.getTreeImages(resourceId);

        // Fix file URLs to use full API path
        const fixedFiles = files.map((file, index) => {
          let fileUrl = null;

          console.log(`🔍 Processing file ${index}:`, {
            id: file.id,
            fileUrl: file.imageUrl,
            photoUrl: img.photoUrl,
            filename: img.filename
          });

          if (img.imageUrl && img.imageUrl.startsWith('http')) {
            // Already a full URL
            imageUrl = img.imageUrl;
          } else if (img.imageUrl) {
            // Use the centralized getImageUrl function
            imageUrl = getImageUrl(img.imageUrl);
          } else if (img.photoUrl) {
            // Handle photoUrl field
            imageUrl = getImageUrl(img.photoUrl);
          } else if (img.filename) {
            // Handle filename field
            imageUrl = getImageUrl(img.filename);
          }

          console.log(`🔧 Final URL for image ${index}: ${imageUrl}`);

          return {
            ...img,
            imageUrl
          };
        });

        setTreeImages(fixedImages);
      } else {
        // Load available trees for selection
        const available = await ApiService.getAvailableTrees();
        setAvailableTrees(available);
      }
    } catch (error) {
      console.error('Failed to load student data:', error);
      toast.error('Failed to load student data', 'Please try refreshing the page');
      // Load available trees as fallback
      try {
        const available = await ApiService.getAvailableTrees();
        setAvailableTrees(available);
      } catch (fallbackError) {
        console.error('Failed to load available trees:', fallbackError);
        toast.error('Failed to load available trees', 'Please check your connection');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResourceEnrollment = async (resourceId: string) => {
    try {
      await ApiService.selectTree(resourceId);
      toast.success('Course enrollment successful!', 'You can now start working on your assignments.');
      setShowResourceSelection(false);
      loadStudentData(); // Reload to show enrolled course
    } catch (error: any) {
      console.error('Failed to enroll in course:', error);
      const errorMessage = error.response?.data?.message || 'Failed to enroll in course. Please try again.';
      if (errorMessage.includes('already selected')) {
        toast.warning('Already enrolled', 'You are already enrolled in this course. Check your course progress section.');
        // Navigate to course progress
        onNavigate('my-courses');
      } else {
        toast.error('Failed to enroll in course', errorMessage);
      }
    }
  };

  // Handle camera capture with location
  const handleCameraCapture = async (imageBlob: Blob, location: any, caption?: string) => {
    if (!treeSelection) {
      toast.warning('No tree selected', 'Please select a tree first before taking photos.');
      return;
    }

    // Get tree ID from the tree selection data (handle both camelCase and snake_case)
    const treeId = treeSelection.treeId || treeSelection.tree_id || treeSelection.id;
    if (!treeId) {
      toast.error('Tree ID not found', 'Please try refreshing the page.');
      console.error('Tree selection data:', treeSelection);
      return;
    }

    console.log('� Camera Capture Debug Info:');
    console.log('  - Tree ID:', treeId);
    console.log('  - Image Blob size:', imageBlob.size);
    console.log('  - Image Type:', selectedImageType);
    console.log('  - Caption:', caption);
    console.log('  - Location:', location);

    setUploadingImage(true);
    try {
      // Create a File object from the blob
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `tree-${selectedImageType}-${timestamp}.jpg`;
      const file = new File([imageBlob], fileName, { type: 'image/jpeg' });

      // Prepare caption with location data
      let finalCaption = caption || '';
      if (location) {
        finalCaption += ` [📍 Location: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}, Accuracy: ±${Math.round(location.accuracy)}m, Taken: ${new Date(location.timestamp).toLocaleString()}]`;
      }

      await ApiService.uploadTreeImage(treeId, file, selectedImageType, finalCaption);

      toast.success('Photo uploaded successfully!', 'Your tree progress has been updated with location data.');
      setShowCameraCapture(false);
      loadStudentData(); // Reload to show new image
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Failed to upload photo', error.response?.data?.message || 'Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle image deletion
  const handleDeleteImage = async (imageId: string) => {
    setDeletingImageId(imageId);
    try {
      await ApiService.deleteTreeImage(imageId);
      toast.success('Photo deleted successfully!', 'The photo has been removed from your tree gallery.');
      setShowDeleteConfirm(null);
      loadStudentData(); // Reload to update gallery
    } catch (error: any) {
      console.error('Failed to delete image:', error);
      toast.error('Failed to delete photo', error.response?.data?.message || 'Please try again.');
    } finally {
      setDeletingImageId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading your course data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">My Learning Journey</h1>
        <p className="text-blue-100">
          Welcome back, {user?.name}! {resourceEnrollment ? 'Track your course progress and submit assignments.' : 'Enroll in a course to start your learning journey.'}
        </p>
      </div>

      {/* Course Selection or Course Info */}
      {!resourceEnrollment ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <BookOpen className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Enroll in a Course</h2>
            <p className="text-gray-600">Choose a course to enroll in and start your learning journey!</p>
          </div>

          {availableResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableResources.slice(0, 6).map((course) => (
                <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-3">
                    <GraduationCap className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="font-medium text-gray-900">{course.title}</h3>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{course.category || 'General'}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>Available for enrollment</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleResourceEnrollment(course.id)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Enroll in Course
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No courses available for enrollment at the moment.</p>
              <p className="text-sm text-gray-400 mt-2">Please contact your administrator.</p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* My Course Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">My Course</h2>
              <div className="flex items-center space-x-2">
                {resourceEnrollment.isCompleted ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Completed
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    <Clock className="h-4 w-4 mr-1" />
                    Enrolled
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">{resourceEnrollment?.title || 'Unknown Course'}</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{resourceEnrollment?.category || 'Category not specified'}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Enrolled on {new Date(resourceEnrollment.enrollmentDate).toLocaleDateString()}</span>
                  </div>
                  {resourceEnrollment.completionDate && (
                    <div className="flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      <span>Completed on {new Date(resourceEnrollment.completionDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Course Description</h4>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  {resourceEnrollment.description ? (
                    <p>{resourceEnrollment.description.substring(0, 200)}...</p>
                  ) : (
                    <p>Follow the course guidelines and complete assignments as instructed.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Camera buttons - Only show on mobile devices */}
            {isMobile && (
              <div className="mt-6 flex space-x-4">
                <button
                  onClick={() => setShowCameraCapture(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </button>
                <button
                  onClick={() => {
                    setSelectedImageType('general');
                    setShowCameraCapture(true);
                  }}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Take General Photo
                </button>
              </div>
            )}

            {/* Debug indicator - Remove this in production */}
            {/* <div className="mt-4 text-xs text-gray-500 text-center">
              Device: {isMobile ? '📱 Mobile' : '💻 Desktop'} - Camera buttons {isMobile ? 'visible' : 'hidden'}
            </div> */}
          </div>

          {/* Assignment Submissions Gallery */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Submission Gallery</h2>

            {submissionFiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {submissionFiles.filter(file => file.fileUrl).map((file, index) => (
                  <div key={`${file.id}-${file.fileUrl}-${index}`} className="border border-gray-200 rounded-lg overflow-hidden relative group">
                    {/* Delete Button */}
                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setShowDeleteConfirm(file.id)}
                        disabled={deletingImageId === image.id}
                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors disabled:opacity-50"
                        title="Delete photo"
                      >
                        {deletingImageId === image.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <img
                      key={`file-${file.id}-${index}`}
                      src={file.fileUrl}
                      alt={file.caption || 'Assignment submission'}
                      className="w-full h-48 object-cover"
                      onLoad={() => {
                        console.log('✅ Image loaded successfully:', image.imageUrl);
                      }}
                      onError={(e) => {
                        console.error('❌ Image failed to load:', image.imageUrl);
                        console.error('❌ Image object:', image);
                        
                        // Instead of replacing with fallback, hide failed images and show error message
                        e.currentTarget.style.display = 'none';
                        
                        // Add error message to parent container
                        const parentDiv = e.currentTarget.parentElement;
                        if (parentDiv && !parentDiv.querySelector('.error-message')) {
                          const errorDiv = document.createElement('div');
                          errorDiv.className = 'error-message flex items-center justify-center h-48 bg-gray-100 text-gray-500 text-sm';
                          errorDiv.innerHTML = `
                            <div class="text-center">
                              <svg class="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"></path>
                              </svg>
                              <p>Image not available</p>
                              <p class="text-xs">${image.imageType || 'Tree photo'}</p>
                            </div>
                          `;
                          parentDiv.appendChild(errorDiv);
                        }
                      }}
                    />
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 capitalize">{image.imageType || 'progress'}</span>
                        <span className="text-xs text-gray-500">
                          {image.uploadDate ? new Date(image.uploadDate).toLocaleDateString() :
                           image.createdAt ? new Date(image.createdAt).toLocaleDateString() : 'Unknown date'}
                        </span>
                      </div>
                      {image.caption && (
                        <p className="text-sm text-gray-600">{image.caption}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No assignments submitted yet</p>
                <p className="text-sm text-gray-400 mt-2">Start submitting your course assignments!</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Camera Capture Modal */}
      {showCameraCapture && (
        <CameraCaptureModal
          onClose={() => setShowCameraCapture(false)}
          onCapture={handleCameraCapture}
          imageType={selectedImageType}
          setImageType={setSelectedImageType}
          uploading={uploadingImage}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Photo</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this file? This will permanently remove it from your submission gallery.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deletingImageId !== null}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteImage(showDeleteConfirm)}
                disabled={deletingImageId !== null}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {deletingImageId === showDeleteConfirm ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Photo'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedStudentDashboard;
