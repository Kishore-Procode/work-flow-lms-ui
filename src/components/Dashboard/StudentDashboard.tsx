import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Camera, GraduationCap, MapPin, TrendingUp, Award, Trash2, FileText, Download, ExternalLink, Activity, Users, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useIsMobile } from '../../hooks/useIsMobile';
import { ApiService, getImageUrl } from '../../services/api';
import { useToast } from '../UI/Toast';
import CameraCaptureModal from '../Camera/CameraCaptureModal';
import TreeSelfAssignmentModal from '../Student/TreeSelfAssignmentModal';
import { saveAs } from 'file-saver';

interface LearningResourceData {
  id: string;
  resourceCode: string;
  title: string;
  enrolledDate: string;
  description: string;
  assignedStudentId: string;
  status: string;
  notes?: string;
  category?: string;
  difficulty?: string;
}

interface SubmissionFile {
  id: string;
  fileUrl: string;
  caption?: string;
  createdAt: string;
  fileType: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

interface StudentDashboardProps {
  onNavigate?: (tab: string) => void;
}

interface ResourceItem {
  title: string;
  description: string;
  type: string;
  size: string;
  link: string;
}

interface ResourceCategory {
  category: string;
  icon: any;
  items: ResourceItem[];
}



const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isMobile = useIsMobile(); // Use mobile detection hook
  const [myResources, setMyResources] = useState<LearningResourceData[]>([]);
  const [availableResources, setAvailableResources] = useState<LearningResourceData[]>([]);
  const [submissionFiles, setSubmissionFiles] = useState<SubmissionFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [showCameraTest, setShowCameraTest] = useState(false);
  const [showResourceSelection, setShowResourceSelection] = useState(false);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedResource, setSelectedResource] = useState<LearningResourceData | null>(null);
  const [selectedImageType, setSelectedImageType] = useState<'progress' | 'issue' | 'general'>('progress');
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [photoRestriction, setPhotoRestriction] = useState<any>(null);
  const [checkingRestrictions, setCheckingRestrictions] = useState(false);
  const [latestUpdates, setLatestUpdates] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [studentData, setStudentData] = useState<any>(null);
  const [stats, setStats] = useState({
    totalResources: 0,
    totalSubmissions: 0,
    daysSinceEnrolled: 0,
    completedResources: 0,
    progressScore: 0,
    enrollmentStatus: 'none' as 'none' | 'selected' | 'enrolled',
    monthsSinceEnrolled: 0
  });
  const toast = useToast();

  // Load resources from backend
  const loadResources = async () => {
    try {
      const resourcesData = await ApiService.getResources();

      // Group resources by category
      const groupedResources = resourcesData.reduce((acc: any, resource: any) => {
        const category = resource.category;
        if (!acc[category]) {
          acc[category] = {
            category,
            icon: getIconForCategory(category),
            items: []
          };
        }
        acc[category].items.push({
          title: resource.title,
          description: resource.description,
          type: resource.type,
          size: resource.size,
          link: resource.link
        });
        return acc;
      }, {});

      setResources(Object.values(groupedResources));
    } catch (error) {
      console.error('Failed to load resources:', error);
      // Fallback to empty array if resources fail to load
      setResources([]);
    }
  };

  // Helper function to get icon for category
  const getIconForCategory = (category: string) => {
    switch (category.toLowerCase()) {
      case 'educational materials':
      case 'education':
        return BookOpen;
      case 'care instructions':
      case 'care':
        return Leaf;
      case 'tools & supplies':
      case 'tools':
        return FileText;
      default:
        return BookOpen;
    }
  };

  // Get the highest semester that has been submitted
const getHighestSubmittedSemester = (): number => {
  if (!studentData?.academicYearName || !submissionFiles.length) {
    return 0;
  }

  let highestSemester = 0;
  submissionFiles.forEach(file => {
    const submissionDate = file.createdAt || file.uploadDate;
    if (submissionDate) {
      const date = new Date(submissionDate);
      const semesterInfo = getCurrentSemester(studentData.academicYearName, date);
      if (semesterInfo && semesterInfo.semester > highestSemester) {
        highestSemester = semesterInfo.semester;
      }
    }
  });

  return highestSemester;
};

// Check if student has completed submissions for all semesters
const hasCompletedAllSemesterSubmissions = () => {
  if (!studentData?.academicYearName || !submissionFiles.length) {
    console.log('❌ Certificate check failed: Missing data', {
      hasAcademicYear: !!studentData?.academicYearName,
      hasSubmissions: submissionFiles.length > 0,
      submissionCount: submissionFiles.length
    });
    return false;
  }

  // Calculate total semesters based on academic year range
  const totalSemesters = getTotalSemesters(studentData.academicYearName);

  // Get unique semesters that have submissions
  const semestersWithSubmissions = new Set<number>();
  submissionFiles.forEach(file => {
    const submissionDate = file.createdAt || file.uploadDate;
    if (submissionDate) {
      const date = new Date(submissionDate);
      const semesterInfo = getCurrentSemester(studentData.academicYearName, date);
      if (semesterInfo) {
        semestersWithSubmissions.add(semesterInfo.semester);
      }
    }
  });

  const isCompleted = semestersWithSubmissions.size >= totalSemesters;

  console.log('🎓 Certificate Eligibility Check:', {
    academicYear: studentData.academicYearName,
    totalRequiredSemesters: totalSemesters,
    uniqueSemestersWithSubmissions: semestersWithSubmissions.size,
    semestersList: Array.from(semestersWithSubmissions).sort(),
    totalSubmissions: submissionFiles.length,
    isEligible: isCompleted
  });

  return isCompleted;
};

// Helper function to calculate total semesters based on academic year
const getTotalSemesters = (academicYearName: string): number => {
  if (!academicYearName || !academicYearName.includes(' - ')) {
    return 8; // Default to 8 semesters (4 years)
  }

  try {
    const [startYear, endYear] = academicYearName.split(' - ').map(year => parseInt(year.trim()));
    // Academic year "2025 - 2029" means: 2025, 2026, 2027, 2028 = 4 years
    // So we should NOT add 1, just subtract: 2029 - 2025 = 4 years
    const totalYears = endYear - startYear;
    const totalSemesters = totalYears * 2; // 2 semesters per year
    
    console.log('📊 Semester Calculation:', {
      academicYear: academicYearName,
      startYear,
      endYear,
      totalYears,
      totalSemesters
    });
    
    return totalSemesters;
  } catch (error) {
    console.error('Error calculating total semesters:', error);
    return 8; // Default to 8 semesters (4 years)
  }
};

// Handle certificate download
const handleDownloadCertificate = async () => {
  try {
    const pdfBlob = await ApiService.downloadCertificate();
    saveAs(pdfBlob, 'certificate.pdf');
  } catch (error) {
    console.error('Failed to download certificate:', error);
    alert("Certificate download is not available yet. You must complete your assignments for every semester to unlock your certificate.");
  }
};

  useEffect(() => {
    loadStudentData();
    loadLatestUpdates();
    loadResources();
  }, []);

  // Check submission restrictions when resource is selected
  useEffect(() => {
    if (selectedResource) {
      checkSubmissionRestrictions(selectedResource.id);
    }
  }, [selectedResource]);

  // Helper function to calculate academic year for any given date
  const getAcademicYearForDate = (academicYearName: string, targetDate?: Date): string => {
    if (!academicYearName || !academicYearName.includes(' - ')) {
      return 'Unknown Year';
    }
  
    try {
      const [startYear, endYear] = academicYearName.split(' - ').map(year => parseInt(year.trim()));
      const dateToCheck = targetDate || new Date();
      const checkYear = dateToCheck.getFullYear();
      const checkMonth = dateToCheck.getMonth() + 1; // JavaScript months are 0-indexed
    
      // Academic year runs from June to March
      // If month is June or later, we're in the academic year starting this calendar year
      // If month is before June, we're in the academic year that started last calendar year
      let academicStartYear;
      if (checkMonth >= 6) {
        academicStartYear = checkYear;
      } else {
        academicStartYear = checkYear - 1;
      }
    
      // Calculate which year of the course the student was in at that time
      const yearInCourse = academicStartYear - startYear + 1;
      const totalYears = endYear - startYear; // FIXED: Remove +1
    
      // Validate the year is within the course duration
      if (yearInCourse < 1) {
        return 'Not Started';
      } else if (yearInCourse > totalYears) {
        return 'Graduated';
      } else {
        const yearSuffix = ['st', 'nd', 'rd'][yearInCourse - 1] || 'th';
        return `${yearInCourse}${yearSuffix} Year`;
      }
    } catch (error) {
      console.error('Error calculating academic year:', error);
      return 'Unknown Year';
    }
  };

  // Helper function to get ordinal suffix for numbers (1st, 2nd, 3rd, 4th, etc.)
  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) {
      return num + 'st';
    }
    if (j === 2 && k !== 12) {
      return num + 'nd';
    }
    if (j === 3 && k !== 13) {
      return num + 'rd';
    }
    return num + 'th';
  };

  // Helper function to calculate current academic year
  const getCurrentAcademicYear = (academicYearName: string): string => {
    return getAcademicYearForDate(academicYearName);
  };

  // Helper function to calculate current semester
  const getCurrentSemester = (academicYearName: string, currentDate?: Date): { semester: number; year: number; semesterName: string } | null => {
    if (!academicYearName || !academicYearName.includes(' - ')) {
      return null;
    }

    try {
      const [startYear, endYear] = academicYearName.split(' - ').map(year => parseInt(year.trim()));
      const dateToCheck = currentDate || new Date();
      const checkYear = dateToCheck.getFullYear();
      const checkMonth = dateToCheck.getMonth(); // 0-based (0 = January)

      // Calculate which academic year we're in
      let academicStartYear: number;
      if (checkMonth >= 5) { // June (month 5) or later
        academicStartYear = checkYear;
      } else { // January to May
        academicStartYear = checkYear - 1;
      }

      // Calculate which year of the course (1st year, 2nd year, etc.)
      const yearInCourse = academicStartYear - startYear + 1;
      const totalYears = endYear - startYear; // FIXED: Remove +1

      if (yearInCourse < 1 || yearInCourse > totalYears) {
        return null; // Outside course duration
      }

      // Determine semester within the year
      let semesterInYear: number;
      if (checkMonth >= 5 && checkMonth <= 10) { // June to November
        semesterInYear = 1; // 1st semester of the academic year
      } else { // December to May
        semesterInYear = 2; // 2nd semester of the academic year
      }

      // Calculate overall semester number (1-8 for 4-year course)
      const overallSemester = (yearInCourse - 1) * 2 + semesterInYear;
      const semesterName = `${getOrdinalSuffix(overallSemester)} Semester`;

      return {
        semester: overallSemester,
        year: yearInCourse,
        semesterName
      };
    } catch (error) {
      console.error('Error calculating current semester:', error);
      return null;
    }
  };

  // Helper function to get next semester info
  const getNextSemester = (academicYearName: string): { semester: number; semesterName: string; startDate: string } | null => {
    const currentSemesterInfo = getCurrentSemester(academicYearName);
    if (!currentSemesterInfo) return null;

    const nextSemesterNum = currentSemesterInfo.semester + 1;
    if (nextSemesterNum > 8) return null; // Max 8 semesters for 4-year course

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    let nextSemesterStart: string;
    if (currentMonth >= 5 && currentMonth <= 10) { // Currently in 1st semester (Jun-Nov)
      nextSemesterStart = `December ${currentYear}`; // Next semester starts in December
    } else { // Currently in 2nd semester (Dec-May)
      nextSemesterStart = `June ${currentYear + (currentMonth >= 11 ? 1 : 0)}`; // Next semester starts in June
    }

    return {
      semester: nextSemesterNum,
      semesterName: `${getOrdinalSuffix(nextSemesterNum)} Semester`,
      startDate: nextSemesterStart
    };
  };

  const loadLatestUpdates = async () => {
    try {
      console.log('Loading latest updates...');
      // Get recent tree monitoring data from all students in the college
      const recentUploads = await ApiService.getRecentTreeUploads(15);
      console.log('Recent uploads received:', recentUploads);

      // Format the data for display - only show name, department, tree name, updated time
      const formattedUpdates = recentUploads.slice(0, 12).map((upload: any) => {
        const academicYearName = upload.academicYear?.yearName || upload.user?.academicYear?.yearName || null;
        const uploadDate = new Date(upload.uploadDate || upload.createdAt);
        const currentYear = academicYearName ? getCurrentAcademicYear(academicYearName) : 'Unknown Year';
        const yearWhenTaken = academicYearName ? getAcademicYearForDate(academicYearName, uploadDate) : 'Unknown Year';

        // Calculate semester information
        const currentSemesterInfo = academicYearName ? getCurrentSemester(academicYearName) : null;
        const semesterWhenTaken = academicYearName ? getCurrentSemester(academicYearName, uploadDate) : null;

        console.log('Processing upload:', {
          studentName: upload.studentName || upload.user?.name,
          academicYearName,
          uploadDate: uploadDate.toISOString(),
          currentYear,
          yearWhenTaken,
          currentSemester: currentSemesterInfo?.semesterName,
          semesterWhenTaken: semesterWhenTaken?.semesterName,
          rawUpload: upload
        });

        return {
          id: upload.id,
          studentName: upload.studentName || upload.user?.name || 'Anonymous Student',
          treeName: upload.tree?.species || 'Unknown Species',
          treeCode: upload.tree?.treeCode || 'N/A',
          uploadDate: upload.uploadDate || upload.createdAt,
          department: upload.department?.name || upload.user?.department?.name || 'Unknown Department',
          academicYear: academicYearName,
          currentYear: currentYear,
          yearWhenTaken: yearWhenTaken,
          currentSemester: currentSemesterInfo?.semesterName,
          semesterWhenTaken: semesterWhenTaken?.semesterName,
          timeAgo: getTimeAgo(upload.uploadDate || upload.createdAt),
          fullDateTime: uploadDate ? new Date(uploadDate).toLocaleString() : 'Unknown date'
        };
      });

      console.log('Formatted updates:', formattedUpdates);
      setLatestUpdates(formattedUpdates);
    } catch (error) {
      console.error('Failed to load latest updates:', error);
      // Don't show error toast for this as it's not critical
    }
  };

  // Helper function to calculate time ago
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const uploadDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;

    return uploadDate.toLocaleDateString();
  };

  const loadStudentData = async () => {
    try {
      if (!user?.id) {
        console.error('User ID not found');
        setLoading(false);
        return;
      }

      console.log('Loading student data for user:', user.id);

      // Load current student's profile data
      let profileData = null;
      try {
        profileData = await ApiService.getProfile();
        console.log('Student profile data:', profileData);
      } catch (profileError) {
        console.log('Could not load student profile:', profileError);
        // Continue without profile data
      }
      
      // Initialize student data with profile data
      setStudentData(profileData || {});

      // Load student's tree selection using the correct tree-selection API
      let treeSelection = null;
      let hasExistingTree = false;

      try {
        // Try to get tree selection directly first (fallback approach)
        try {
          treeSelection = await ApiService.getMyTreeSelection();
          console.log("treeSelection",treeSelection)
          hasExistingTree = treeSelection && treeSelection.treeId ? true : false;
          console.log('Loaded tree selection:', treeSelection);
        } catch (selectionError: any) {
          // If tree selection fails, try status check
          if (selectionError.response?.status === 404) {
            console.log('No tree selection found for student');
            treeSelection = null;
            hasExistingTree = false;
          } else {
            // Try status endpoint as fallback
            try {
              const treeStatus = await ApiService.getTreeSelectionStatus();
              hasExistingTree = treeStatus?.hasTree || false;
            } catch (statusError) {
              console.log('Status check also failed, assuming no tree assigned');
              hasExistingTree = false;
            }
          }
        }
      } catch (error: any) {
        console.log('Error in tree selection loading:', error);
        treeSelection = null;
        hasExistingTree = false;
      }

      if (hasExistingTree && treeSelection && (treeSelection.treeId || treeSelection.tree)) {
        // Student has a tree assigned
        // debugger
        const treeData = {
          id: treeSelection.treeId,
          treeCode: treeSelection.treeCode,
          species: treeSelection.species,
          plantedDate: treeSelection.plantedDate || new Date().toISOString(),
          locationDescription: treeSelection.locationDescription,
          assignedStudentId: user.id,
          status: treeSelection.isPlanted ? 'planted' : 'assigned',
          isPlanted: treeSelection.isPlanted,
          selectionId: treeSelection.id
        };

        setMyTrees([treeData]);
        setSelectedTree(treeData);
        setShowTreeSelection(false);

        // Load tree images for the assigned tree
        try {
          const images = await ApiService.getTreeImages(treeData.id);
          console.log('Raw images response:', images);
          
          if (images && images.length > 0) {
            // Log each image URL to understand the format
            images.forEach((img, index) => {
              console.log(`Image ${index}:`, {
                id: img.id,
                imageUrl: img.imageUrl,
                caption: img.caption,
                createdAt: img.createdAt
              });
            });
            
            setTreeImages(images || []);
            console.log('First image URL:', images[0].imageUrl);
            
            // Test URL construction
            const constructedURL = images[0].imageUrl?.startsWith('http') ?
              images[0].imageUrl :
              getImageUrl(images[0].imageUrl);
            console.log('Constructed URL will be:', constructedURL);
          } else {
            setTreeImages([]);
          }
        } catch (imageError) {
          console.log(`No images found for tree ${treeData.treeCode}:`, imageError);
          setTreeImages([]);
        }

        // Calculate improved statistics for assigned tree
        const totalUploads = treeImages.length;
        let daysSincePlanted = 0;
        let plantedDate = null;

        // Use planting date from tree selection if available, otherwise use tree planted date
        if (treeSelection.plantingDate) {
          plantedDate = new Date(treeSelection.plantingDate);
        } else if (treeData.plantedDate) {
          plantedDate = new Date(treeData.plantedDate);
        }

        if (plantedDate) {
          const today = new Date();
          daysSincePlanted = Math.floor((today.getTime() - plantedDate.getTime()) / (1000 * 60 * 60 * 24));
        }

        // Calculate health status based on multiple factors
        const isHealthy = treeData.status === 'healthy' ||
                         treeData.status === 'assigned' ||
                         (totalUploads > 0 && daysSincePlanted < 365); // Has photos and planted within a year

        // Calculate care score based on upload frequency
        const expectedUploadsPerMonth = 2; // Expected 2 uploads per month
        const monthsSincePlanted = Math.max(1, Math.ceil(daysSincePlanted / 30));
        const expectedTotalUploads = monthsSincePlanted * expectedUploadsPerMonth;
        const careScore = Math.min(100, Math.round((totalUploads / expectedTotalUploads) * 100));

        setStats({
          totalTrees: 1,
          totalUploads,
          daysSincePlanted: Math.max(0, daysSincePlanted),
          healthyTrees: isHealthy ? 1 : 0,
          careScore: careScore,
          plantingStatus: treeSelection.isPlanted ? 'planted' : 'selected',
          monthsSincePlanted: monthsSincePlanted
        });
      } else {
        // No tree assigned - show self-assignment option
        console.log('No tree assigned, student can self-assign from inventory');
        setMyTrees([]);
        setSelectedTree(null);
        setShowTreeSelection(false);
        setShowSelfAssignModal(false); // Will be shown via button click

        // Set empty stats when no tree is assigned
        setStats({
          totalTrees: 0,
          totalUploads: 0,
          daysSincePlanted: 0,
          healthyTrees: 0,
          careScore: 0,
          plantingStatus: 'none',
          monthsSincePlanted: 0
        });
        setTreeImages([]);
      }
    } catch (error) {
      console.error('Failed to load student data:', error);
      // Set empty data on error
      setMyTrees([]);
      setTreeImages([]);
      setSelectedTree(null);
      setStats({
        totalTrees: 0,
        totalUploads: 0,
        daysSincePlanted: 0,
        healthyTrees: 0,
        careScore: 0,
        plantingStatus: 'none',
        monthsSincePlanted: 0
      });
    } finally {
      setLoading(false);
      // Load latest updates from all students (non-blocking)
      loadLatestUpdates();
    }
  };

  const handleTreeSelection = async (treeId: string) => {
    try {
      console.log('Selecting tree:', treeId);

      // Double-check that student doesn't already have a tree
      const currentStatus = await ApiService.getTreeSelectionStatus();
      if (currentStatus?.hasTree) {
        toast.warning('Tree Already Assigned', 'You already have a tree assigned. Refreshing your dashboard...');
        await loadStudentData();
        return;
      }

      const result = await ApiService.selectTree(treeId);
      console.log('Tree selection result:', result);
      toast.success('Tree Selected Successfully!', 'You can now start monitoring your tree and uploading progress photos.');
      setShowTreeSelection(false);
      await loadStudentData(); // Reload to show selected tree
    } catch (error: any) {
      console.error('Failed to select tree:', error);
      const errorMessage = error.response?.data?.message || 'Failed to select tree. Please try again.';

      if (errorMessage.includes('already have a tree') || errorMessage.includes('already selected')) {
        toast.warning('Tree Already Assigned', 'You already have a tree assigned. Refreshing your dashboard...');
        await loadStudentData();
      } else if (errorMessage.includes('already assigned to another student')) {
        toast.error('Tree Unavailable', 'This tree has been assigned to another student. Please select a different tree.');
        // Refresh available trees
        try {
          const availableTreesData = await ApiService.getAvailableTrees();
          setAvailableTrees(availableTreesData || []);
        } catch (refreshError) {
          console.error('Failed to refresh available trees:', refreshError);
        }
      } else {
        toast.error('Selection Failed', errorMessage);
      }
    }
  };

  // Check submission restrictions for selected resource
  const checkSubmissionRestrictions = async (resourceId: string) => {
    if (!resourceId) return null;

    setCheckingRestrictions(true);
    try {
      const response = await ApiService.checkPhotoRestrictions(resourceId);
      setPhotoRestriction(response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error checking submission restrictions:', error);
      alert('Failed to check submission restrictions');
      return null;
    } finally {
      setCheckingRestrictions(false);
    }
  };

  // Handle Submit Assignment button click
  const handleSubmitAssignmentClick = async () => {
    if (!selectedResource) {
      alert('Please select a course first');
      return;
    }

    const restrictions = await checkSubmissionRestrictions(selectedResource.id);

    if (restrictions && !restrictions.canTakePhoto) {
      // Show restriction message
      const message = restrictions.reason;
      const nextDate = restrictions.nextAllowedDate ?
        new Date(restrictions.nextAllowedDate).toLocaleDateString() : null;

      const fullMessage = nextDate ?
        `${message} Next allowed date: ${nextDate}` : message;

      alert(`Assignment Submission Restricted: ${fullMessage}`);
      return;
    }

    // Restrictions passed, open file upload
    setShowCameraCapture(true);
  };

  // Handle file upload
  const handleCameraCapture = async (imageBlob: Blob, location: any, caption?: string) => {
    if (!selectedResource) {
      alert('No course selected yet.');
      return;
    }

    setUploadingFile(true);
    try {
      console.log('📁 File Upload Debug Info:');
      console.log('  - Resource ID:', selectedResource.id);
      console.log('  - File Blob size:', imageBlob.size);
      console.log('  - File Type:', selectedImageType);
      console.log('  - Caption:', caption);
      console.log('  - Location:', location);

      // Convert blob to file for upload
      const file = new File([imageBlob], `assignment-${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });

      const finalCaption = location ?
        `${caption || 'Assignment submission'} (📍 ${location.latitude?.toFixed(6)}, ${location.longitude?.toFixed(6)})` :
        (caption || 'Assignment submission');

      await ApiService.uploadTreeImage(
        selectedResource.id,
        file,
        selectedImageType,
        finalCaption
      );

      alert('Assignment submitted successfully!');
      setShowCameraCapture(false);
      loadStudentData(); // Reload to show new submission

      // Refresh submission restrictions
      if (selectedResource) {
        await checkSubmissionRestrictions(selectedResource.id);
      }
    } catch (error: any) {
      console.error('Failed to upload assignment:', error);
      // Check if it's a submission restriction error
      if (error.message.includes('academic year') || error.message.includes('already taken')) {
        alert(`Assignment Submission Restricted: ${error.message}`);
      }
      else if(error.response.data.message.includes('more than 25 meters')){
        alert(`Assignment Submission Restricted: ${error.response.data.message}`);
      }
      else {
        alert('Failed to submit assignment. Please try again.');
      }
    } finally {
      setUploadingFile(false);
    }
  };

  // Handle file deletion
  const handleDeleteImage = async (fileId: string) => {
    setDeletingImageId(fileId);
    try {
      await ApiService.deleteTreeImage(fileId);
      toast.success('File deleted successfully!', 'The file has been removed from your submissions.');
      setShowDeleteConfirm(null);
      loadStudentData(); // Reload to update submissions
    } catch (error: any) {
      console.error('Failed to delete file:', error);
      toast.error('Failed to delete file', error.response?.data?.message || 'Please try again.');
    } finally {
      setDeletingImageId(null);
    }
  };

  // Use real submission files as upload history
  const uploadHistory = submissionFiles.map((file, index) => ({
    id: file.id || index,
    date: file.createdAt ? new Date(file.createdAt).toLocaleDateString() : 'Unknown',
    description: file.caption || 'Assignment submission',
    image: file.fileUrl,
    status: 'submitted'
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-center">Loading your learning dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-50 pb-20 lg:pb-6">
      <div className="pt-4 lg:pt-0 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-xl lg:text-3xl xl:text-4xl font-bold text-gray-900">
              Welcome back, {user?.name}! 🌱
            </h1>
            {/* Certificate Download Button - ADD THIS */}
            {(() => {
            const isEligible = hasCompletedAllSemesterSubmissions();
            return (
              isEligible && (
                <button
                  onClick={handleDownloadCertificate}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                >
                  <Award className="w-5 h-5" />
                  <span>Download Certificate</span>
                </button>
              )
            );
            })()}
            {studentData?.academicYearName && (
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                  {getCurrentAcademicYear(studentData.academicYearName)}
                </span>
                {(() => {
                  const currentSemesterInfo = getCurrentSemester(studentData.academicYearName);
                  return currentSemesterInfo && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                      {currentSemesterInfo.semesterName}
                    </span>
                  );
                })()}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-gray-600 text-sm lg:text-lg">
              Track your learning progress and achieve academic excellence
            </p>
            {studentData && (
              <div className="space-y-1">
                <p className="text-gray-500 text-xs lg:text-sm">
                  Academic Year: {studentData.academicYearName || 'Not specified'} • Department: {studentData.departmentName || 'Not specified'}
                </p>
                {(() => {
                  const nextSemesterInfo = getNextSemester(studentData.academicYearName);
                  return nextSemesterInfo && (
                    <p className="text-gray-500 text-xs lg:text-sm">
                      📸 Next photo allowed in {nextSemesterInfo.semesterName} (starts {nextSemesterInfo.startDate})
                    </p>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Statistics Cards
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
          <div className="bg-white p-3 lg:p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center space-x-2 lg:space-x-3">
              <div className="p-2 lg:p-3 bg-blue-100 rounded-xl">
                <BookOpen className="w-4 h-4 lg:w-6 lg:h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-gray-500">My Courses</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.totalResources}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 lg:p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center space-x-2 lg:space-x-3">
              <div className="p-2 lg:p-3 bg-blue-100 rounded-xl">
                <Calendar className="w-4 h-4 lg:w-6 lg:h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-gray-500">Days Learning</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.daysSinceEnrolled}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 lg:p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center space-x-2 lg:space-x-3">
              <div className="p-2 lg:p-3 bg-purple-100 rounded-xl">
                <Camera className="w-4 h-4 lg:w-6 lg:h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-gray-500">Photos</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.totalSubmissions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 lg:p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center space-x-2 lg:space-x-3">
              <div className="p-2 lg:p-3 bg-blue-100 rounded-xl">
                <Leaf className="w-4 h-4 lg:w-6 lg:h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs lg:text-sm text-gray-500">Completed Courses</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.completedResources}</p>
              </div>
            </div>
          </div>
        </div> */}

        {/* Main Learning Content Section - Now appears first */}



        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Learning Resource Display Section */}
          <div className="lg:col-span-2">
            {selectedResource ? (
              <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-xl border border-gray-100">
                {/* Course Material */}
                <div className="mb-6">
                  <div className="relative">
                    {submissionFiles.length > 0 ? (
                      <img
                        src={submissionFiles[0].fileUrl?.startsWith('http') ?
                          submissionFiles[0].fileUrl :
                          getImageUrl(submissionFiles[0].fileUrl?.replace('/api/uploads/submissions/', '') || '')
                        }
                        alt={`${selectedResource?.title || 'Course'} Submission`}
                        className="w-full h-48 sm:h-64 lg:h-80 object-cover rounded-xl shadow-lg"
                        onError={(e) => {
                          console.error('File failed to load:', submissionFiles[0]?.fileUrl);
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.resource-placeholder')) {
                            const placeholder = document.createElement('div');
                            placeholder.className = 'resource-placeholder w-full h-48 sm:h-64 lg:h-80 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-xl shadow-lg flex items-center justify-center';
                            placeholder.innerHTML = `
                              <div class="text-center">
                                <svg class="w-16 h-16 text-blue-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3l14 9-14 9V3z"/>
                                </svg>
                                <p class="text-blue-700 font-medium">No file available</p>
                                <p class="text-blue-600 text-sm">Submit your first assignment!</p>
                              </div>
                            `;
                            parent.appendChild(placeholder);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-48 sm:h-64 lg:h-80 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-xl shadow-lg flex items-center justify-center">
                        <div className="text-center">
                          <BookOpen className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                          <p className="text-blue-700 font-medium">No submissions yet</p>
                          <p className="text-blue-600 text-sm">Submit your first assignment to get started!</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-lg">
                      <span className="text-sm font-medium text-blue-600 capitalize">{selectedResource.status}</span>
                    </div>
                  </div>
                </div>

                {/* Course Information */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                      {selectedResource?.title || 'Unknown Course'}
                    </h2>
                    <p className="text-gray-600">Course Code: {selectedResource?.resourceCode || 'No Code'}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Enrolled Date</p>
                      <p className="font-semibold text-gray-900">
                        {selectedResource.enrolledDate.split("T")[0] || 'dd/MM/yyyy'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Category</p>
                      <p className="font-semibold text-gray-900">{selectedResource.category || 'General'}</p>
                    </div>
                  </div>

                  {selectedResource.notes && (
                    <div className="bg-gradient-to-r from-blue-50 to-emerald-50 p-4 rounded-xl border border-blue-100">
                      <h4 className="font-semibold text-blue-800 mb-2">Course Description</h4>
                      <p className="text-blue-700">{selectedResource.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : !selectedResource && stats.totalResources === 0 ? (
              /* No Course Assigned - Show Enrollment Option */
              <div className="bg-white p-8 lg:p-12 rounded-2xl shadow-xl border border-gray-100 text-center">
                <div className="max-w-md mx-auto">
                  <BookOpen className="w-20 h-20 text-blue-500 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Enroll in a Course!</h3>
                  <p className="text-gray-600 mb-6">
                    You haven't enrolled in any courses yet. Browse available courses from your department and start your learning journey!
                  </p>
                  <button
                    onClick={() => setShowEnrollmentModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center space-x-2 mx-auto"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>Browse Courses</span>
                  </button>
                  <div className="bg-blue-50 p-4 rounded-xl mt-6">
                    <p className="text-blue-800 text-sm">
                      <strong>What you'll do:</strong> Choose courses, complete assignments, and track your academic progress!
                    </p>
                  </div>
                </div>
              </div>
            ) : selectedResource ? (
              // This case should not happen as selectedResource is checked above, but adding for safety
              <div className="bg-white p-8 lg:p-12 rounded-2xl shadow-xl border border-gray-100 text-center">
                <div className="max-w-md mx-auto">
                  <CheckCircle className="w-20 h-20 text-blue-500 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Course Already Enrolled</h3>
                  <p className="text-gray-600 mb-6">
                    You are already enrolled in this course. You can track your progress and submit assignments.
                  </p>
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <p className="text-blue-800 text-sm">
                      Your course: <strong>{selectedResource.title}</strong> (Code: {selectedResource.resourceCode})
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-8 lg:p-12 rounded-2xl shadow-xl border border-gray-100 text-center">
                <div className="max-w-md mx-auto">
                  <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h3>
                  <p className="text-gray-600">
                    Please wait while we load your course information.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {/* Take Photo button - Only show on mobile devices */}
                {isMobile && (
                  <button
                    onClick={handleSubmitAssignmentClick}
                    disabled={!selectedResource || checkingRestrictions}
                    className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-4 py-3 rounded-xl hover:from-blue-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkingRestrictions ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Checking...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-5 h-5" />
                        <span>Submit Assignment</span>
                      </>
                    )}
                  </button>
                )}
                
                {/* Photo restriction info */}
                {photoRestriction && !photoRestriction.canTakePhoto && (
                  <div className={`${photoRestriction.isCompleted ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'} border rounded-lg p-3`}>
                    <div className="flex items-start space-x-2">
                      <div className={`w-5 h-5 ${photoRestriction.isCompleted ? 'text-blue-600' : 'text-yellow-600'} mt-0.5`}>
                        {photoRestriction.isCompleted ? '✅' : '⚠️'}
                      </div>
                      <div className="text-sm">
                        <p className={`${photoRestriction.isCompleted ? 'text-blue-800' : 'text-yellow-800'} font-medium`}>
                          {photoRestriction.isCompleted ? 'All Photos Completed!' : 'Photo Upload Restricted'}
                        </p>
                        <p className={`${photoRestriction.isCompleted ? 'text-blue-700' : 'text-yellow-700'} mt-1`}>
                          {photoRestriction.reason}
                        </p>
                        {photoRestriction.nextAllowedDate && !photoRestriction.isCompleted && (
                          <p className="text-yellow-600 text-xs mt-1">
                            Next allowed: {new Date(photoRestriction.nextAllowedDate).toLocaleDateString('en-GB')}
                          </p>
                        )}
                        {photoRestriction.academicYearInfo && !photoRestriction.isCompleted && (
                          <div className="text-yellow-600 text-xs mt-1 space-y-1">
                            <p>Academic Year: {photoRestriction.academicYearInfo.yearName}</p>
                            {photoRestriction.currentSemester && (
                              <p>Current Semester: {photoRestriction.currentSemester}</p>
                            )}
                            {photoRestriction.nextSemester && (
                              <p>Next Photo Allowed: Semester {photoRestriction.nextSemester}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Debug indicator - Remove this in production */}
                {/* <div className="text-xs text-gray-500 text-center">
                  Device: {isMobile ? '📱 Mobile' : '💻 Desktop'}
                </div> */}
                <button
                  onClick={() => onNavigate && onNavigate('my-courses')}
                  className="w-full bg-blue-100 text-blue-700 px-4 py-3 rounded-xl hover:bg-blue-200 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedResource}
                >
                  <TrendingUp className="w-5 h-5" />
                  <span>View Course Progress</span>
                </button>
                <button 
                  onClick={() => onNavigate && onNavigate('guidelines')}
                  className="w-full bg-purple-100 text-purple-700 px-4 py-3 rounded-xl hover:bg-purple-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Guidelines</span>
                </button>
                <button 
                  onClick={() => onNavigate && onNavigate('resources')}
                  className="w-full bg-orange-100 text-orange-700 px-4 py-3 rounded-xl hover:bg-orange-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>Resources</span>
                </button>
              </div>
            </div>

            {/* Upload History */}
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Submissions</h3>
              {uploadHistory.length > 0 ? (
                <div className="space-y-4">
                  {uploadHistory.slice(0, 1).map((upload) => (
                    <div key={upload.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img
                          src={upload.image?.startsWith('http') ?
                            upload.image :
                            getImageUrl(upload.image?.replace('/api/uploads/submissions/', '') || '')
                          }
                          alt="Assignment submission"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Upload history image failed:', upload.image);
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector('.fallback-icon')) {
                              parent.innerHTML = `
                                <svg class="fallback-icon w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                              `;
                            }
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {upload.description}
                        </p>
                        <p className="text-xs text-gray-500">{upload.date ? new Date(upload.date).toLocaleDateString() : 'unknown date'}</p>
                      </div>

                      {/* Delete Button */}
                      {/* <button
                        onClick={() => setShowDeleteConfirm(upload.id.toString())}
                        disabled={deletingImageId === upload.id.toString()}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                        title="Delete photo"
                      >
                        {deletingImageId === upload.id.toString() ? (
                          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button> */}
                    </div>
                  ))}
                  {uploadHistory.length > 3 && (
                    <button
                      onClick={() => onNavigate && onNavigate('my-courses')}
                      className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View all {uploadHistory.length} submissions
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No uploads yet</p>
                  <p className="text-gray-400 text-xs">Start by uploading your first photo!</p>
                </div>
              )}
            </div>


          </div>
        </div>

        {/* Latest Updates Section - Now appears after main course content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 lg:p-8 mb-6 lg:mb-8 mt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">Latest Updates</h2>
              <p className="text-gray-600 text-sm">Recent academic progress from students across all departments</p>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">{latestUpdates.length} recent updates</span>
            </div>
          </div>

          {latestUpdates.length > 0 ? (
            <div className="space-y-3">
              {latestUpdates.map((update) => (
                <div key={update.id} className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {update.studentName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Student name and department - stacked on mobile, inline on larger screens */}
                        <div className="mb-1">
                          <div className="flex items-center space-x-2 mb-0.5">
                            <p className="font-medium text-gray-900 text-sm truncate">{update.studentName}</p>
                            {update.currentYear && update.currentYear !== 'Unknown Year' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                                {update.currentYear}
                              </span>
                            )}
                            {update.currentSemester && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                                {update.currentSemester}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mb-0.5">
                            {update.semesterWhenTaken && update.semesterWhenTaken !== update.currentSemester && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 flex-shrink-0">
                                📸 {update.semesterWhenTaken}
                              </span>
                            )}
                            {update.yearWhenTaken && update.yearWhenTaken !== 'Unknown Year' && update.yearWhenTaken !== update.currentYear && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 flex-shrink-0">
                                📸 {update.yearWhenTaken}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 truncate">
                            {update.department}
                            {update.academicYear && (
                              <span className="text-gray-500 ml-1">({update.academicYear})</span>
                            )}
                          </p>
                        </div>
                        {/* Course information */}
                        <div className="flex items-center space-x-2">
                          <BookOpen className="w-3 h-3 text-blue-600 flex-shrink-0" />
                          <p className="text-xs text-gray-700 truncate">
                            <span className="font-medium">{update.courseName}</span>
                            {update.courseCode && update.courseCode !== 'N/A' && (
                              <span className="text-gray-500"> ({update.courseCode})</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 whitespace-nowrap" title={update.fullDateTime}>
                          {update.timeAgo}
                        </p>
                        <p className="text-xs text-gray-400 whitespace-nowrap">
                          {update.fullDateTime}
                        </p>
                      </div>
                      <div className="flex items-center justify-end mt-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-xs text-blue-600 ml-1 whitespace-nowrap">Updated</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No recent updates available</p>
              <p className="text-sm text-gray-500">Updates from students will appear here as they submit assignments</p>
            </div>
          )}
        </div>

        {/* Resources Section - Now appears after Latest Updates */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 lg:p-8 mb-6 lg:mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">Learning Resources</h2>
              <p className="text-gray-600 text-sm">Essential guides and materials for successful learning</p>
            </div>
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">{resources.length} categories</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((category, categoryIndex) => {
              const Icon = category.icon;
              return (
                <div key={categoryIndex} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{category.category}</h3>
                      <p className="text-sm text-gray-600">{category.items.length} resources</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {category.items.slice(0, 3).map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-blue-200 transition-colors">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">{item.title}</h4>
                          <p className="text-xs text-gray-600 line-clamp-2 mt-1">{item.description}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              item.type === 'PDF' ? 'bg-red-100 text-red-700' :
                              item.type === 'Video' ? 'bg-purple-100 text-purple-700' :
                              item.type === 'Article' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {item.type}
                            </span>
                            <button
                              onClick={() => window.open(item.link, '_blank')}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              View →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {category.items.length > 3 && (
                      <button
                        onClick={() => onNavigate && onNavigate('resources')}
                        className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        View All {category.items.length} Resources
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => onNavigate && onNavigate('resources')}
              className="bg-gradient-to-r from-blue-600 to-blue-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2 mx-auto"
            >
              <BookOpen className="w-5 h-5" />
              <span>Explore All Resources</span>
            </button>
          </div>
        </div>

        {/* File Upload Modal */}
        {showCameraCapture && selectedResource && (
          <CameraCaptureModal
            onClose={() => setShowCameraCapture(false)}
            onCapture={handleCameraCapture}
            imageType={selectedImageType}
            setImageType={setSelectedImageType}
            uploading={uploadingFile}
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
                Are you sure you want to delete this file? This will permanently remove it from your submissions.
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

        {/* Course Enrollment Modal */}
        {showEnrollmentModal && user && studentData && (
          <TreeSelfAssignmentModal
            studentId={user.id}
            departmentId={studentData.departmentId || studentData.department_id}
            onClose={() => setShowSelfAssignModal(false)}
            onSuccess={() => {
              setShowEnrollmentModal(false);
              loadStudentData(); // Reload to show enrolled course
            }}
          />
        )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;