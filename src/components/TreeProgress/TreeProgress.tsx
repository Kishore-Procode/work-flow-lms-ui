import React, { useState, useEffect } from 'react';
import {
  Camera,
  Calendar,
  TrendingUp,
  Heart,
  Eye,
  Award
} from 'lucide-react';
import { saveAs } from 'file-saver';

import { ApiService, getImageUrl } from '../../services/api';
import Card, { StatCard } from '../UI/Card';
import LoadingSpinner from '../UI/LoadingSpinner';
import SecureImage from '../UI/SecureImage';
import { useAuth } from '../../hooks/useAuth';

interface TreeImage {
  id: string;
  imageUrl?: string;
  photoUrl?: string;
  url?: string;
  uploadDate?: string;
  createdAt?: string;
  taken_at?: string;
  description?: string;
  caption?: string;
  measurements?: {
    height: number;
    diameter: number;
  };
}

interface TreeProgress {
  tree: {
    id: string;
    species: string;
    treeCode: string;
    plantedDate: string;
    locationDescription: string;
  };
  images: TreeImage[];
  totalImages: number;
  lastUpdate: string;
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor';
  growthRate: number;
}


const TreeProgress: React.FC = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<TreeProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<TreeImage | null>(null);
  const [studentData, setStudentData] = useState<any>(null);

  useEffect(() => {
    loadProgress();
    loadStudentData();
  }, []);

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
      const totalYears = endYear - startYear;

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
      const semesterName = `Semester ${overallSemester}`;

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

  // Helper function to get academic year for a specific date
  const getAcademicYearForDate = (academicYearName: string, targetDate?: Date): string => {
    if (!academicYearName || !academicYearName.includes(' - ')) {
      return 'Unknown Year';
    }

    try {
      const [startYear, endYear] = academicYearName.split(' - ').map(year => parseInt(year.trim()));
      const dateToCheck = targetDate || new Date();
      const checkYear = dateToCheck.getFullYear();
      const checkMonth = dateToCheck.getMonth(); // 0-based

      // Calculate which academic year we're in
      let academicStartYear: number;
      if (checkMonth >= 5) { // June or later
        academicStartYear = checkYear;
      } else { // January to May
        academicStartYear = checkYear - 1;
      }

      // Calculate which year of the course
      const yearInCourse = academicStartYear - startYear + 1;
      const totalYears = endYear - startYear;

      if (yearInCourse < 1) {
        return 'Not Started';
      } else if (yearInCourse > totalYears) {
        return 'Graduated';
      } else {
        const yearSuffix = yearInCourse === 1 ? 'st' : yearInCourse === 2 ? 'nd' : yearInCourse === 3 ? 'rd' : 'th';
        return `${yearInCourse}${yearSuffix} Year`;
      }
    } catch (error) {
      console.error('Error calculating academic year for date:', error);
      return 'Unknown Year';
    }
  };

  const loadStudentData = async () => {
    try {
      const profile = await ApiService.getProfile();
      console.log('TreeProgress - Student profile loaded:', profile);
      setStudentData(profile);
    } catch (error) {
      console.error('TreeProgress - Failed to load student data:', error);
    }
  };

  const loadProgress = async () => {
    try {
      // Use the same approach as StudentDashboard
      let treeData = null;
      let images: any[] = [];

      try {
        // Load student's tree selection (same as StudentDashboard)
        const treeSelection = await ApiService.getMyTreeSelection();
        console.log('🌳 TreeProgress - Loaded tree selection:', treeSelection);

        if (treeSelection && treeSelection.treeId) {
          // Student has a tree assigned - create tree data object
          treeData = {
            id: treeSelection.treeId,
            treeCode: treeSelection.treeCode,
            species: treeSelection.species,
            plantedDate: treeSelection.plantingDate || new Date().toISOString(),
            locationDescription: treeSelection.locationDescription
          };

          console.log('🌳 TreeProgress - Using tree data:', treeData);

          // Load tree images for the assigned tree using same logic as StudentDashboard
          try {
            images = await ApiService.getTreeImages(treeData.id);
            console.log('📸 TreeProgress - Raw images response:', images);
            
            if (images && images.length > 0) {
              // Filter out any invalid images and fix image URLs (same as StudentDashboard)
              images = images.filter(img => img && img.id && (img.imageUrl || img.photoUrl || img.filename || img.photo_url || img.image_path));

              // Fix image URLs to use secure API endpoints
              images = images.map(img => {
                let imageUrl = null;

                if (img.imageUrl && img.imageUrl.startsWith('http')) {
                  imageUrl = img.imageUrl;
                } else if (img.imageUrl && img.imageUrl.startsWith('/uploads')) {
                  imageUrl = img.imageUrl;
                } else if (img.photoUrl || img.photo_url) {
                  const photoPath = img.photoUrl || img.photo_url;
                  imageUrl = getImageUrl(photoPath);
                } else if (img.filename) {
                  imageUrl = getImageUrl(img.filename);
                } else if (img.image_path) {
                  imageUrl = getImageUrl(img.image_path);
                }

                return {
                  ...img,
                  imageUrl
                };
              });

              console.log('✅ TreeProgress - Valid images after filtering:', images.length);
              console.log('🔧 TreeProgress - Processed images with imageUrl:', images);
            } else {
              images = [];
            }
          } catch (imageError) {
            console.log(`❌ TreeProgress - No images found for tree ${treeData.treeCode}:`, imageError);
            images = [];
          }
        } else {
          console.log('❌ TreeProgress - No tree assigned');
          treeData = null;
          images = [];
        }
      } catch (selectionError: any) {
        console.error('❌ TreeProgress - Failed to get tree selection:', selectionError);
        treeData = null;
        images = [];
      }

      if (treeData) {
        // Ensure we only set valid images
        const validImages = Array.isArray(images) ? images : [];
        console.log('🔧 Setting progress with images:', validImages);

        setProgress({
          tree: treeData,
          images: validImages,
          totalImages: validImages.length,
          lastUpdate: validImages[0]?.uploadDate || validImages[0]?.createdAt || treeData.plantedDate,
          healthStatus: 'good', // Default to good status
          growthRate: 15 // This would be calculated from monitoring data
        });

        console.log('✅ Progress state set with', validImages.length, 'images');
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File, description: string) => {
    if (!progress || !progress.tree) return;

    setUploadingImage(true);
    try {
      await ApiService.uploadTreeImage(progress.tree.id, file, 'progress', description);
      await loadProgress(); // Reload to get updated data
      setShowUploadModal(false);
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-blue-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Calculate Growth Rate based on photo analysis and time progression
  const calculateGrowthRate = () => {
    if (!progress?.images || progress.images.length < 2) return 0;

    // Sort images by date
    const sortedImages = [...progress.images].sort((a, b) =>
      new Date(a.uploadDate || a.createdAt).getTime() - new Date(b.uploadDate || b.createdAt).getTime()
    );

    const firstImage = sortedImages[0];
    const lastImage = sortedImages[sortedImages.length - 1];

    // Calculate time difference in months
    const firstDate = new Date(firstImage.uploadDate || firstImage.createdAt);
    const lastDate = new Date(lastImage.uploadDate || lastImage.createdAt);
    const monthsDiff = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

    // Simulate growth rate based on photo frequency and time
    const photoFrequency = progress.images.length / monthsDiff;
    const baseGrowthRate = Math.min(25, photoFrequency * 8); // Max 25% growth rate

    return Math.round(baseGrowthRate);
  };

  // Calculate Growth Trend
  const calculateGrowthTrend = () => {
    const growthRate = calculateGrowthRate();
    if (growthRate > 15) return '+Excellent';
    if (growthRate > 10) return '+Good';
    if (growthRate > 5) return '+Fair';
    return 'Needs attention';
  };

  // Calculate Care Score based on multiple factors
  const calculateCareScore = () => {
    if (!progress?.tree) return 0;

    const plantedDate = new Date(progress.tree.plantedDate);
    const today = new Date();
    const daysSincePlanted = Math.ceil((today.getTime() - plantedDate.getTime()) / (1000 * 60 * 60 * 24));
    const monthsSincePlanted = Math.max(1, daysSincePlanted / 30);

    // Expected photos (2 per month minimum)
    const expectedPhotos = Math.ceil(monthsSincePlanted * 2);
    const actualPhotos = progress.totalImages;

    // Photo consistency score (40% of total)
    const photoScore = Math.min(40, (actualPhotos / expectedPhotos) * 40);

    // Regularity score - check if photos are spread out (30% of total)
    let regularityScore = 0;
    if (progress.images.length >= 2) {
      const sortedImages = [...progress.images].sort((a, b) =>
        new Date(a.uploadDate || a.createdAt).getTime() - new Date(b.uploadDate || b.createdAt).getTime()
      );

      const intervals = [];
      for (let i = 1; i < sortedImages.length; i++) {
        const prevDate = new Date(sortedImages[i-1].uploadDate || sortedImages[i-1].createdAt);
        const currDate = new Date(sortedImages[i].uploadDate || sortedImages[i].createdAt);
        intervals.push((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      // Prefer regular intervals (around 15-30 days)
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      if (avgInterval >= 15 && avgInterval <= 45) {
        regularityScore = 30;
      } else if (avgInterval >= 7 && avgInterval <= 60) {
        regularityScore = 20;
      } else {
        regularityScore = 10;
      }
    }

    // Recent activity score (30% of total)
    const lastPhotoDate = progress.images.length > 0
      ? new Date(Math.max(...progress.images.map(img => new Date(img.uploadDate || img.createdAt).getTime())))
      : plantedDate;
    const daysSinceLastPhoto = (today.getTime() - lastPhotoDate.getTime()) / (1000 * 60 * 60 * 24);

    let recentActivityScore = 0;
    if (daysSinceLastPhoto <= 15) recentActivityScore = 30;
    else if (daysSinceLastPhoto <= 30) recentActivityScore = 25;
    else if (daysSinceLastPhoto <= 60) recentActivityScore = 15;
    else recentActivityScore = 5;

    const totalScore = Math.round(photoScore + regularityScore + recentActivityScore);
    return Math.min(100, Math.max(0, totalScore));
  };

  // Calculate Care Score Trend
  const calculateCareScoreTrend = () => {
    const careScore = calculateCareScore();
    if (careScore >= 90) return '+Excellent';
    if (careScore >= 80) return '+Very Good';
    if (careScore >= 70) return '+Good';
    if (careScore >= 60) return '+Fair';
    return 'Needs improvement';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-50 pb-20 lg:pb-6">
        <div className="pt-6 lg:pt-0 px-4 lg:px-6 pb-4 lg:pb-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white p-8 lg:p-12 rounded-2xl shadow-xl text-center">
              <LoadingSpinner size="lg" text="Loading your tree progress..." />
              <p className="text-gray-500 text-sm mt-4">Please wait while we fetch your tree data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-50 pb-20 lg:pb-6">
        <div className="pt-6 lg:pt-0 px-4 lg:px-6 pb-4 lg:pb-6">
          <div className="max-w-2xl mx-auto">
            <Card className="text-center py-16 lg:py-20">
              <div className="bg-gray-50 rounded-full p-8 w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                <Heart className="w-16 h-16 text-gray-300" />
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3">No Tree Assigned Yet</h3>
              <p className="text-gray-600 mb-6 text-sm lg:text-base max-w-md mx-auto leading-relaxed">
                You haven't selected a tree to monitor yet. Visit your dashboard to choose from the available trees and start your tree care journey.
              </p>
              <div className="space-y-4">
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-emerald-700 transition-all duration-200 font-medium flex items-center justify-center mx-auto space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7zm16 3-7 4-7-4" />
                  </svg>
                  <span>Go to Dashboard</span>
                </button>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm mx-auto">
                  <p className="text-blue-800 text-sm">
                    💡 <span className="font-medium">Tip:</span> Once you select a tree, you'll be able to track its growth with photos and measurements!
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

      // Helper function to calculate semester stats for photo tracking
      const getSemesterStats = (
        academicYearName: string,
        images: TreeImage[]
      ) => {
        // Assume 4 years, 2 semesters per year
        const semesters: {
          semester: number;
          semesterName: string;
          startDate: Date;
          endDate: Date;
          photoUploaded: boolean;
        }[] = [];
        if (!academicYearName || !academicYearName.includes(' - ')) {
          return {
            currentSemester: null,
            upcomingSemester: null,
            completedSemesters: 0,
            totalSemesters: 8,
            progressPercentage: 0,
            allSemestersCompleted: false,
          };
        }
        const [startYear, endYear] = academicYearName.split(' - ').map(year => parseInt(year.trim()));
        let semesterIdx = 1;
        for (let year = startYear; year < endYear; year++) {
          // 1st semester: June-November
          semesters.push({
            semester: semesterIdx,
            semesterName: `Semester ${semesterIdx}`,
            startDate: new Date(year, 5, 1), // June 1
            endDate: new Date(year, 10, 30), // Nov 30
            photoUploaded: false,
          });
          semesterIdx++;
          // 2nd semester: December-May
          semesters.push({
            semester: semesterIdx,
            semesterName: `Semester ${semesterIdx}`,
            startDate: new Date(year, 11, 1), // Dec 1
            endDate: new Date(year + 1, 4, 31), // May 31
            photoUploaded: false,
          });
          semesterIdx++;
        }
        // Mark photoUploaded for each semester
        images.forEach(img => {
          const imgDate = new Date(img.uploadDate || img.createdAt || img.taken_at || '');
          semesters.forEach(sem => {
            if (imgDate >= sem.startDate && imgDate <= sem.endDate) {
              sem.photoUploaded = true;
            }
          });
        });
        // Find current semester
        const today = new Date();
        const currentSemester = semesters.find(sem => today >= sem.startDate && today <= sem.endDate) || null;
        // Find upcoming semester
        const upcomingSemester = semesters.find(sem => today < sem.startDate) || null;
        // Count completed semesters
        const completedSemesters = semesters.filter(sem => sem.photoUploaded).length;
        const totalSemesters = semesters.length;
        const progressPercentage = Math.round((completedSemesters / totalSemesters) * 100);
        const allSemestersCompleted = completedSemesters === totalSemesters;
        return {
          currentSemester,
          upcomingSemester,
          completedSemesters,
          totalSemesters,
          progressPercentage,
          allSemestersCompleted,
        };
      };
    
      // Calculate semesterStats for photo tracking
      const semesterStats = studentData?.academicYearName
        ? getSemesterStats(studentData.academicYearName, progress?.images || [])
        : {
            currentSemester: null,
            upcomingSemester: null,
            completedSemesters: 0,
            totalSemesters: 8,
            progressPercentage: 0,
            allSemestersCompleted: false,
          };
        
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-50 pb-20 lg:pb-6">
      <div className="pt-6 lg:pt-0 px-4 lg:px-6 pb-4 lg:pb-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
                  <Heart className="mr-3 w-7 h-7 lg:w-8 lg:h-8 text-red-500" />
                  My Tree Progress
                </h1>
                {studentData?.academicYearName && (
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const currentSemesterInfo = getCurrentSemester(studentData.academicYearName);
                      const currentYear = getAcademicYearForDate(studentData.academicYearName);
                      return (
                        <>
                          {currentYear && currentYear !== 'Unknown Year' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                              {currentYear}
                            </span>
                          )}
                          {currentSemesterInfo && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                              {currentSemesterInfo.semesterName}
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-gray-600 text-sm lg:text-base">
                  Track the growth and health of your {progress.tree?.species || 'tree'}
                </p>
                {studentData && (
                  <p className="text-gray-500 text-xs lg:text-sm">
                    Academic Year: {studentData.academicYearName || 'Not specified'} • Department: {studentData.departmentName || 'Not specified'}
                  </p>
                )}
              </div>
            </div>

            {/* Dynamic Semester-based Photo Tracking */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <Camera className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <p className="text-blue-800 font-medium text-sm">Semester-based Photo Tracking</p>

                  {/* Current Semester Status */}
                  {semesterStats.currentSemester ? (
                    <div className="bg-white rounded-lg p-3 border border-blue-100 mb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-blue-700 text-xs font-medium mb-1">
                            📚 Current: <span className="font-bold">{semesterStats.currentSemester.semesterName}</span>
                            <span className="ml-2 text-xs font-normal text-blue-600">
                              ({semesterStats.currentSemester.startDate.toLocaleDateString(('en-GB'))} - {semesterStats.currentSemester.endDate.toLocaleDateString(('en-GB'))})
                            </span>
                          </p>
                          <p className={`text-xs flex items-center ${
                            semesterStats.currentSemester.photoUploaded 
                              ? 'text-blue-600' 
                              : 'text-orange-600'
                          }`}>
                            {semesterStats.currentSemester.photoUploaded ? (
                              <>
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                ✓ Photo uploaded for this semester
                              </>
                            ) : (
                              <>
                                <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                                ⚠️ Upload one photo for {semesterStats.currentSemester.semesterName}
                              </>
                            )}
                          </p>
                        </div>
                        {!semesterStats.allSemestersCompleted && (
                          <div className="text-right ml-4">
                            <p className="text-blue-700 text-xs font-medium">
                              {semesterStats.completedSemesters}/{semesterStats.totalSemesters}
                            </p>
                            <div className="w-16 bg-blue-200 rounded-full h-2 mt-1">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${semesterStats.progressPercentage}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : semesterStats.upcomingSemester ? (
                    <div className="bg-white rounded-lg p-3 border border-blue-100 mb-2">
                      <p className="text-blue-700 text-xs">
                        <span className="font-medium">🗓️ Next Semester:</span> {semesterStats.upcomingSemester.semesterName} starts {semesterStats.upcomingSemester.startDate.toLocaleDateString()}
                      </p>
                    </div>
                  ) : null}

                  {/* Congratulations Message - When all semesters completed */}
                  {semesterStats.allSemestersCompleted ? (
                    <div className="bg-gradient-to-r from-blue-100 to-emerald-100 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Award className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-blue-800 font-bold text-sm">🎉 Congratulations!</p>
                          <p className="text-blue-700 text-xs">
                            You've successfully completed all {semesterStats.totalSemesters} semester photo requirements! 
                            Your tree's growth journey is fully documented.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Regular Instructions - Only show when not completed */
                    <div className="space-y-1">
                      <p className="text-blue-600 text-xs">
                        📸 Upload one photo per semester using the camera button on your dashboard
                      </p>
                      <p className="text-blue-600 text-xs">
                        📚 1st Semester: June-November • 2nd Semester: December-May
                      </p>
                      {semesterStats.completedSemesters > 0 && (
                        <p className="text-blue-600 text-xs font-medium mt-2">
                          ✅ Great job! You've completed {semesterStats.completedSemesters} out of {semesterStats.totalSemesters} semesters
                        </p>
                      )}
                    </div>
                  )}

                  {/* Urgent reminder for current semester */}
                  {semesterStats.currentSemester && !semesterStats.currentSemester.photoUploaded && !semesterStats.allSemestersCompleted && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mt-2">
                      <p className="text-orange-700 text-xs flex items-center">
                        <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                        <span className="font-medium">Reminder:</span> Don't forget to upload your photo for {semesterStats.currentSemester.semesterName}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        {/* Tree Info Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-emerald-50 border-blue-200">
          <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <h2 className="text-xl lg:text-2xl font-semibold text-blue-800 mb-1">{progress.tree?.species || 'Unknown Species'}</h2>
              <div className="space-y-1">
                <p className="text-blue-600 font-medium">{progress.tree?.treeCode || 'No Code'}</p>
                <p className="text-sm text-gray-600 flex items-center">
                  <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {progress.tree?.locationDescription || 'Location not specified'}
                </p>
              </div>
            </div>
            {/* <div className="text-left lg:text-right bg-white rounded-lg p-3 lg:p-4 border border-blue-200">
              <div className={`text-lg lg:text-xl font-bold ${getHealthColor(progress.healthStatus)} mb-1`}>
                {progress.healthStatus.charAt(0).toUpperCase() + progress.healthStatus.slice(1)}
              </div>
              <p className="text-xs lg:text-sm text-gray-600">Health Status</p>
            </div> */}
          </div>
        </Card>

        {/* Stats Grid - Removed Days Planted, Enhanced Growth Rate and Care Score */}
        {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-6">
          <StatCard
            title="Photos Uploaded"
            value={progress.totalImages}
            icon={Camera}
            color="blue"
            subtitle={`${progress.totalImages} monitoring photos`}
          />
          <StatCard
            title="Growth Rate"
            value={`${calculateGrowthRate()}%`}
            icon={TrendingUp}
            color="purple"
            trend={{
              value: `${calculateGrowthTrend()}`,
              isPositive: calculateGrowthRate() > 0
            }}
            subtitle="Based on photo analysis"
          />
          <StatCard
            title="Care Score"
            value={calculateCareScore()}
            icon={Award}
            color="yellow"
            trend={{
              value: `${calculateCareScoreTrend()}`,
              isPositive: calculateCareScore() >= 70
            }}
            subtitle="Out of 100"
          />
        </div> */}

        {/* Progress Timeline */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg lg:text-xl font-semibold text-gray-900">Progress Timeline</h3>
            {progress.images.length > 0 && (
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {progress.images.length} photo{progress.images.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          {progress.images.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                {progress.images.filter(image => image && image.id).map((image, index) => {
                  const uploadDate = image.uploadDate || image.createdAt || image.taken_at;

                  // Calculate semester information for this photo
                  const academicYearName = studentData?.academicYearName;
                  const photoDate = uploadDate ? new Date(uploadDate) : null;
                  const semesterWhenTaken = academicYearName && photoDate ? getCurrentSemester(academicYearName, photoDate) : null;
                  const yearWhenTaken = academicYearName && photoDate ? getAcademicYearForDate(academicYearName, photoDate) : null;
                  const currentSemesterInfo = academicYearName ? getCurrentSemester(academicYearName) : null;

                  return (
                    <div key={image.id} className="group">
                      <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
                        <SecureImage
                          src={getImageUrl(image.imageUrl || '')}
                          // src={image.imageUrl || ''}
                          alt={`Progress ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={() => {
                            console.log('Image failed to load:', image.imageUrl);
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity duration-200 rounded-xl flex items-center justify-center">
                          <button
                            onClick={() => setSelectedImage(image)}
                            className="opacity-0 group-hover:opacity-100 bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform scale-95 group-hover:scale-100 shadow-lg"
                          >
                            <Eye className="w-4 h-4 inline mr-2" />
                            View Full
                          </button>
                        </div>
                        {/* Photo number badge */}
                        <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
                          #{index + 1}
                        </div>
                        {/* Semester badges */}
                        <div className="absolute top-2 right-2 flex flex-col space-y-1">
                          {semesterWhenTaken && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 shadow-sm">
                              {semesterWhenTaken.semesterName}
                            </span>
                          )}
                          {yearWhenTaken && yearWhenTaken !== 'Unknown Year' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 shadow-sm">
                              {yearWhenTaken}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-relaxed">
                          {image.description || image.caption || `Tree Progress Update #${index + 1}`}
                        </p>

                        {/* Date and semester info */}
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {uploadDate ? new Date(uploadDate).toLocaleString() : 'Invalid Date'}
                          </p>

                          {/* Semester details */}
                          {semesterWhenTaken && (
                            <div className="flex flex-wrap gap-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                📚 {semesterWhenTaken.semesterName}
                              </span>
                              {yearWhenTaken && yearWhenTaken !== 'Unknown Year' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                  🎓 {yearWhenTaken}
                                </span>
                              )}
                              {currentSemesterInfo && semesterWhenTaken.semester !== currentSemesterInfo.semester && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                                  📸 Past Photo
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {image.measurements && (
                          <div className="flex space-x-3 mt-2 text-xs text-gray-600 bg-gray-50 rounded p-2">
                            <span className="flex items-center">
                              <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                              Height: {image.measurements.height}cm
                            </span>
                            <span className="flex items-center">
                              <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                              Diameter: {image.measurements.diameter}cm
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 lg:py-16">
              <div className="bg-gray-50 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <Camera className="w-12 h-12 text-gray-300" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No progress photos yet</h4>
              <p className="text-gray-500 text-sm lg:text-base mb-4">Start documenting your tree's growth journey</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-blue-800 text-sm">
                  📱 Go to your <span className="font-medium">main dashboard</span> and tap the <span className="font-medium">"Take Photo"</span> button to capture your first progress photo!
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleImageUpload}
          uploading={uploadingImage}
        />
      )}

      {/* Image Viewer Modal */}
      {selectedImage && (
        <ImageViewerModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          studentData={studentData}
          getCurrentSemester={getCurrentSemester}
          getAcademicYearForDate={getAcademicYearForDate}
        />
      )}
      </div>
    </div>
  );
};

// Upload Modal Component
interface UploadModalProps {
  onClose: () => void;
  onUpload: (file: File, description: string, measurements?: { height: number; diameter: number }) => void;
  uploading: boolean;
}

const UploadModal: React.FC<UploadModalProps> = ({ onClose, onUpload, uploading }) => {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [height, setHeight] = useState('');
  const [diameter, setDiameter] = useState('');
  const [includeMeasurements, setIncludeMeasurements] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const measurements = includeMeasurements && height && diameter ? {
      height: parseFloat(height),
      diameter: parseFloat(diameter)
    } : undefined;

    onUpload(file, description, measurements);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Progress Photo</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the current state of your tree..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              required
            />
          </div>
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeMeasurements}
                onChange={(e) => setIncludeMeasurements(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Include measurements</span>
            </label>
          </div>
          
          {includeMeasurements && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diameter (cm)
                </label>
                <input
                  type="number"
                  value={diameter}
                  onChange={(e) => setDiameter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Image Viewer Modal Component
interface ImageViewerModalProps {
  image: TreeImage;
  onClose: () => void;
  studentData?: any;
  getCurrentSemester?: (academicYearName: string, currentDate?: Date) => { semester: number; year: number; semesterName: string } | null;
  getAcademicYearForDate?: (academicYearName: string, targetDate?: Date) => string;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  image,
  onClose,
  studentData,
  getCurrentSemester,
  getAcademicYearForDate
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Progress Photo</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          <SecureImage
            src={getImageUrl(image.imageUrl || '')}
            alt="Tree progress"
            className="w-full h-64 object-cover rounded-lg"
          />

          <div>
            <h3 className="font-medium text-gray-900">Description</h3>
            <p className="text-gray-600 mt-1">{image.description || image.caption || 'No description available'}</p>
          </div>

          {/* Semester Information */}
          {studentData?.academicYearName && getCurrentSemester && getAcademicYearForDate && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Academic Information</h4>
              <div className="space-y-2">
                {(() => {
                  const uploadDate = image.uploadDate || image.createdAt || image.taken_at;
                  const photoDate = uploadDate ? new Date(uploadDate) : null;
                  const semesterWhenTaken = photoDate ? getCurrentSemester(studentData.academicYearName, photoDate) : null;
                  const yearWhenTaken = photoDate ? getAcademicYearForDate(studentData.academicYearName, photoDate) : null;
                  const currentSemesterInfo = getCurrentSemester(studentData.academicYearName);

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {semesterWhenTaken && (
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            📚 {semesterWhenTaken.semesterName}
                          </span>
                          <span className="text-xs text-gray-600">When taken</span>
                        </div>
                      )}
                      {yearWhenTaken && yearWhenTaken !== 'Unknown Year' && (
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            🎓 {yearWhenTaken}
                          </span>
                          <span className="text-xs text-gray-600">Academic year</span>
                        </div>
                      )}
                      {currentSemesterInfo && semesterWhenTaken && (
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            📸 {semesterWhenTaken.semester === currentSemesterInfo.semester ? 'Current' : 'Past'} Photo
                          </span>
                          <span className="text-xs text-gray-600">Status</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          🏫 {studentData.departmentName || 'Unknown Dept'}
                        </span>
                        <span className="text-xs text-gray-600">Department</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          <div className="flex justify-between text-sm text-gray-600">
            <span>Uploaded: {image.uploadDate || image.createdAt || image.taken_at ? new Date(image.uploadDate || image.createdAt || image.taken_at || new Date()).toLocaleString() : 'Unknown date'}</span>
            {image.measurements && (
              <span>Height: {image.measurements.height}cm, Diameter: {image.measurements.diameter}cm</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreeProgress;