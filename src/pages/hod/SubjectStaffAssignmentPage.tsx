/**
 * HOD Subject Staff Assignment Page
 * 
 * Main page for HOD to manage staff assignments to subjects.
 * 
 * @author ACT-LMS Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, CheckCircle, AlertTriangle, RefreshCw, X, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { SubjectStaffAssignmentService } from '../../services/subjectStaffAssignmentService';
import { useAuth } from '../../hooks/useAuth';
import {
  HODSemester,
  SubjectForAssignment,
  StaffForAssignment
} from '../../types/subjectStaffAssignment';

const HODSubjectStaffAssignmentPage: React.FC = () => {
  // Auth hook
  const { user } = useAuth();

  // State management
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingAcademicYears, setLoadingAcademicYears] = useState(false);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [semesters, setSemesters] = useState<HODSemester[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [departmentName, setDepartmentName] = useState<string>('');
  const [subjects, setSubjects] = useState<SubjectForAssignment[]>([]);
  const [academicYearId, setAcademicYearId] = useState<string>('');
  const [availableStaff, setAvailableStaff] = useState<StaffForAssignment[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectForAssignment | null>(null);

  // Load courses on mount
  useEffect(() => {
    loadCourses();
  }, []);

  // Load courses function - Load courses with content mapping
  const loadCourses = async () => {
    if (!user?.departmentId) {
      toast.error('Department information not found');
      return;
    }

    try {
      setLoadingCourses(true);
      console.log('🔍 Loading courses with content mapping for HOD department:', user.departmentId);

      // Use the new endpoint that returns only courses with content mapping
      const response = await SubjectStaffAssignmentService.getHODCourses();
      const responseData = response.data || response;
      const coursesData = responseData.courses || [];

      console.log('🔍 Courses with content mapping loaded:', coursesData.length, 'courses');
      setCourses(coursesData);

      // Auto-select first course
      if (coursesData.length > 0) {
        const firstCourse = coursesData[0];
        setSelectedCourse(firstCourse.id);
        loadAcademicYears(firstCourse.id);
      } else {
        console.log('⚠️ No courses with content mapping found for this department');
        toast('No courses with content mapping found. Please set up content mapping first.', {
          icon: 'ℹ️',
          duration: 5000
        });
      }
    } catch (err: any) {
      console.error('🔍 Error loading courses:', err);
      toast.error('Failed to load courses');
    } finally {
      setLoadingCourses(false);
    }
  };

  // Load academic years for selected course
  const loadAcademicYears = async (courseId?: string) => {
    const courseToLoad = courseId || selectedCourse;

    if (!courseToLoad) {
      console.log('🔍 No course selected, skipping academic year load');
      return;
    }

    try {
      setLoadingAcademicYears(true);
      console.log('🔍 Frontend: Loading academic years for course:', courseToLoad);
      const response = await SubjectStaffAssignmentService.getAcademicYearsForCourse(courseToLoad);

      const responseData = response.data || response;
      console.log('🔍 Frontend: Academic years response:', responseData);

      if (responseData && responseData.academicYears) {
        console.log('🔍 Frontend: Setting academic years, count:', responseData.academicYears.length);
        setAcademicYears(responseData.academicYears);
        setDepartmentName(responseData.departmentName);

        // Auto-select first academic year
        if (responseData.academicYears.length > 0 && !selectedAcademicYear) {
          const firstAcademicYear = responseData.academicYears[0];
          setSelectedAcademicYear(firstAcademicYear.id);
          console.log('🔍 Frontend: Selected first academic year:', firstAcademicYear.yearName);

          // Auto-load semesters for the first academic year
          loadSemesters(courseToLoad, firstAcademicYear.id);
        }
      } else {
        console.error('🔍 Frontend: No academic years in response!', responseData);
      }
    } catch (err: any) {
      console.error('🔍 Frontend: Error loading academic years:', err);
      toast.error(err.response?.data?.message || 'Failed to load academic years');
    } finally {
      setLoadingAcademicYears(false);
    }
  };

  // Handle course change
  const handleCourseChange = (courseId: string) => {
    console.log('🔍 Course changed to:', courseId);
    setSelectedCourse(courseId);

    // Reset dependent states
    setAcademicYears([]);
    setSelectedAcademicYear('');
    setSemesters([]);
    setSelectedSemester(null);
    setSubjects([]);
    setAcademicYearId('');

    // Load academic years for new course
    if (courseId) {
      loadAcademicYears(courseId);
    }
  };

  // Handle academic year change
  const handleAcademicYearChange = (academicYearId: string) => {
    console.log('🔍 Academic year changed to:', academicYearId);
    setSelectedAcademicYear(academicYearId);

    // Reset dependent states
    setSemesters([]);
    setSelectedSemester(null);
    setSubjects([]);
    setAcademicYearId('');

    // Load semesters for new academic year
    if (academicYearId && selectedCourse) {
      loadSemesters(selectedCourse, academicYearId);
    }
  };

  // Load subjects when semester is selected
  useEffect(() => {
    if (selectedSemester && academicYearId) {
      console.log('🔍 useEffect triggered - Loading subjects for semester:', selectedSemester, 'academicYearId:', academicYearId);
      loadSubjects();
    } else {
      console.log('🔍 useEffect - Not loading subjects. selectedSemester:', selectedSemester, 'academicYearId:', academicYearId);
    }
  }, [selectedSemester, academicYearId]);

  const loadSemesters = async (courseId?: string, academicYearIdParam?: string) => {
    const courseToLoad = courseId || selectedCourse;
    const academicYearToLoad = academicYearIdParam || selectedAcademicYear;

    if (!courseToLoad) {
      console.log('🔍 No course selected, skipping semester load');
      return;
    }

    if (!academicYearToLoad) {
      console.log('🔍 No academic year selected, skipping semester load');
      return;
    }

    try {
      setLoadingSemesters(true);
      console.log('🔍 Frontend: Loading semesters for course:', courseToLoad, 'academic year:', academicYearToLoad);
      const response = await SubjectStaffAssignmentService.getHODSemesters(courseToLoad, academicYearToLoad);
      console.log('🔍 Frontend: Full Response:', JSON.stringify(response, null, 2));

      // Handle both response structures:
      // 1. {success: true, data: {semesters: [...]}} (wrapped)
      // 2. {departmentId: ..., semesters: [...]} (direct)
      const responseData = response.data || response; // Support both formats
      console.log('🔍 Frontend: Response Data:', responseData);
      console.log('🔍 Frontend: Semesters:', responseData.semesters);

      if (responseData && responseData.semesters) {
        console.log('🔍 Frontend: Setting semesters, count:', responseData.semesters.length);
        setSemesters(responseData.semesters);
        setDepartmentName(responseData.departmentName);

        if (responseData.semesters.length > 0 && !selectedSemester) {
          const firstSemester = responseData.semesters[0];
          setSelectedSemester(firstSemester.semesterNumber);
          setAcademicYearId(firstSemester.contentMapSemDetailsId);
          console.log('🔍 Frontend: Selected first semester:', firstSemester.semesterNumber);

          // Auto-load subjects for the first semester
          console.log('🔍 Frontend: Auto-loading subjects for first semester...');
          loadSubjects(firstSemester.semesterNumber, firstSemester.contentMapSemDetailsId);
        }
      } else {
        console.error('🔍 Frontend: No semesters in response!', responseData);
      }
    } catch (err: any) {
      console.error('🔍 Frontend: Error loading semesters:', err);
      toast.error(err.response?.data?.message || 'Failed to load semesters');
    } finally {
      setLoadingSemesters(false);
    }
  };

  const loadSubjects = async (semesterNum?: number, yearId?: string) => {
    const semester = semesterNum || selectedSemester;
    const yearIdToUse = yearId || academicYearId;

    console.log('🔍 loadSubjects called with:', { semesterNum, yearId, semester, yearIdToUse, selectedSemester, academicYearId });

    if (!semester) {
      console.warn('🔍 loadSubjects: No semester selected, skipping');
      return;
    }

    if (!yearIdToUse) {
      console.warn('🔍 loadSubjects: No yearId (contentMapSemDetailsId) available, skipping');
      return;
    }

    try {
      setLoadingSubjects(true);
      console.log('🔍 Frontend: Loading subjects - semester:', semester, 'yearId (contentMapSemDetailsId):', yearIdToUse);

      const response = await SubjectStaffAssignmentService.getSubjectsForAssignment(
        semester,
        yearIdToUse
      );

      console.log('🔍 Frontend: Subjects response:', JSON.stringify(response, null, 2));

      // Handle both wrapped and direct response formats
      const subjects = response.data?.subjects || (response as any).subjects || [];
      console.log('🔍 Frontend: Extracted subjects, count:', subjects.length);
      console.log('🔍 Frontend: Subjects data:', subjects);

      setSubjects(subjects);

      if (subjects.length === 0) {
        console.warn('🔍 Frontend: No subjects found for this semester');
      }
    } catch (err: any) {
      console.error('🔍 Frontend: Error loading subjects:', err);
      console.error('🔍 Frontend: Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      toast.error(err.response?.data?.message || 'Failed to load subjects');
    } finally {
      setLoadingSubjects(false);
    }
  };

  const loadAvailableStaff = async () => {
    try {
      console.log('🔍 Frontend: Loading available staff...', { selectedSemester, academicYearId });
      const response = await SubjectStaffAssignmentService.getAvailableStaff(
        selectedSemester || undefined,
        academicYearId || undefined
      );

      console.log('🔍 Frontend: Staff response:', response);

      // Handle both wrapped and direct response formats
      const staffData = response.data?.staff || (response as any).staff || [];
      console.log('🔍 Frontend: Setting available staff, count:', staffData.length);
      setAvailableStaff(staffData);
    } catch (err: any) {
      console.error('🔍 Frontend: Error loading staff:', err);
      toast.error(err.response?.data?.message || 'Failed to load staff');
    }
  };

  const handleOpenAssignDialog = async (subject: SubjectForAssignment) => {
    setSelectedSubject(subject);
    setSelectedStaff(subject.assignedStaffId || '');
    setAssignDialogOpen(true);

    if (availableStaff.length === 0) {
      await loadAvailableStaff();
    }
  };

  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false);
    setSelectedSubject(null);
    setSelectedStaff('');
  };

  const handleAssignStaff = async () => {
    if (!selectedSubject || !selectedStaff || !selectedSemester || !academicYearId) {
      toast.error('Please select a staff member');
      return;
    }

    try {
      setLoadingSubjects(true);
      const response = await SubjectStaffAssignmentService.assignStaffToSubject({
        contentMapSubDetailsId: selectedSubject.id,
        staffId: selectedStaff,
        semesterNumber: selectedSemester,
        academicYearId
      });

      if (response.success) {
        toast.success(response.message);
        handleCloseAssignDialog();
        // Reload subjects with current semester and academic year to show updated assignments
        await loadSubjects(selectedSemester, academicYearId);
        // Reload semesters to update subject counts
        await loadSemesters();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assign staff');
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!window.confirm('Are you sure you want to remove this staff assignment?')) {
      return;
    }

    try {
      setLoadingSubjects(true);
      const response = await SubjectStaffAssignmentService.removeStaffAssignment(assignmentId);

      if (response.success) {
        toast.success(response.message);
        // Reload subjects with current semester and academic year to show updated assignments
        if (selectedSemester && academicYearId) {
          await loadSubjects(selectedSemester, academicYearId);
        }
        // Reload semesters to update subject counts
        await loadSemesters();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove assignment');
    } finally {
      setLoadingSubjects(false);
    }
  };

  const getAssignmentProgress = (): number => {
    const selectedSem = semesters.find(s => s.semesterNumber === selectedSemester);
    if (!selectedSem || selectedSem.totalSubjects === 0) return 0;
    return Math.round((selectedSem.assignedSubjects / selectedSem.totalSubjects) * 100);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subject Staff Assignment</h1>
          <p className="text-gray-600 mt-1">
            {departmentName ? `Department: ${departmentName}` : 'Loading...'}
          </p>
        </div>
        <button
          onClick={() => {
            loadSemesters();
            if (selectedSemester && academicYearId) {
              loadSubjects();
            }
          }}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 dark:text-neutral-200"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8 bg-white dark:bg-neutral-800 rounded-lg shadow p-6 border border-gray-200 dark:border-neutral-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedCourse ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-neutral-700 text-gray-600 dark:text-neutral-300'}`}>
              {selectedCourse ? <CheckCircle className="w-6 h-6" /> : <span className="text-sm font-bold">1</span>}
            </div>
            <div>
              <p className={`text-sm font-semibold ${selectedCourse ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-neutral-400'}`}>Step 1</p>
              <p className="text-xs text-gray-600 dark:text-neutral-400">Select Course</p>
            </div>
          </div>
          <div className={`flex-1 h-1 mx-4 ${selectedCourse ? 'bg-green-500' : 'bg-gray-200'}`}></div>

          <div className="flex items-center space-x-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedAcademicYear ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
              {selectedAcademicYear ? <CheckCircle className="w-6 h-6" /> : <span className="text-sm font-bold">2</span>}
            </div>
            <div>
              <p className={`text-sm font-semibold ${selectedAcademicYear ? 'text-green-600' : 'text-gray-500'}`}>Step 2</p>
              <p className="text-xs text-gray-600">Academic Year</p>
            </div>
          </div>
          <div className={`flex-1 h-1 mx-4 ${selectedAcademicYear ? 'bg-green-500' : 'bg-gray-200'}`}></div>

          <div className="flex items-center space-x-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedSemester ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
              {selectedSemester ? <CheckCircle className="w-6 h-6" /> : <span className="text-sm font-bold">3</span>}
            </div>
            <div>
              <p className={`text-sm font-semibold ${selectedSemester ? 'text-green-600' : 'text-gray-500'}`}>Step 3</p>
              <p className="text-xs text-gray-600">Select Semester</p>
            </div>
          </div>
          <div className={`flex-1 h-1 mx-4 ${selectedSemester ? 'bg-green-500' : 'bg-gray-200'}`}></div>

          <div className="flex items-center space-x-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${subjects.length > 0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
              {subjects.length > 0 ? <CheckCircle className="w-6 h-6" /> : <span className="text-sm font-bold">4</span>}
            </div>
            <div>
              <p className={`text-sm font-semibold ${subjects.length > 0 ? 'text-green-600' : 'text-gray-500'}`}>Step 4</p>
              <p className="text-xs text-gray-600">Assign Staff</p>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Course Selection */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6 mb-6 border border-gray-200 dark:border-neutral-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100 mb-4">Step 1: Select Course</h2>
        
        {loadingCourses ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 mx-auto text-gray-400 dark:text-neutral-500 mb-3" />
            <p className="text-gray-600 dark:text-neutral-300">No courses found for your department</p>
          </div>
        ) : (
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Course *
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">-- Select a Course --</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.code})
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-2">
              Showing {courses.length} course{courses.length !== 1 ? 's' : ''} from your department
            </p>
          </div>
        )}
      </div>

      {/* Step 2: Academic Year Selection */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6 mb-6 border border-gray-200 dark:border-neutral-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100 mb-4">
          Step 2: Select Academic Year
          {!selectedCourse && <span className="text-sm text-gray-500 dark:text-neutral-400 ml-2">(Select a course first)</span>}
        </h2>

        {!selectedCourse ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-neutral-750 rounded-lg">
            <BookOpen className="w-16 h-16 mx-auto text-gray-400 dark:text-neutral-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-2">Select a Course</h3>
            <p className="text-gray-600 dark:text-neutral-300">
              Please select a course from the dropdown above to view academic years
            </p>
          </div>
        ) : loadingAcademicYears ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : academicYears.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600">No academic years found for this course</p>
          </div>
        ) : (
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Academic Year *
            </label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => handleAcademicYearChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">-- Select an Academic Year --</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.yearName} ({year.subjectCount} subject{year.subjectCount !== 1 ? 's' : ''})
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-2">
              Showing {academicYears.length} academic year{academicYears.length !== 1 ? 's' : ''} with content mapping
            </p>
          </div>
        )}
      </div>

      {/* Step 3: Semester Selection */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Step 3: Select Semester
          {!selectedAcademicYear && <span className="text-sm text-gray-500 ml-2">(Select an academic year first)</span>}
        </h2>

        {!selectedAcademicYear ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select an Academic Year</h3>
            <p className="text-gray-600">
              Please select an academic year from the dropdown above to view semesters
            </p>
          </div>
        ) : loadingSemesters ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-lg border-2 border-gray-200 bg-white">
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-3 w-3/4"></div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-8"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-8"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-8"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : semesters.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <AlertTriangle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Semesters Found</h3>
          <p className="text-gray-600 mb-4">
            No content mappings found for your department. Please complete the content mapping first.
          </p>
          <button
            onClick={() => window.location.href = '/lms-content-mapping'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Content Mapping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {semesters.map((semester) => (
          <div
            key={semester.semesterNumber}
            onClick={() => {
              console.log('🔍 Semester clicked:', {
                semesterNumber: semester.semesterNumber,
                semesterName: semester.semesterName,
                contentMapSemDetailsId: semester.contentMapSemDetailsId,
                totalSubjects: semester.totalSubjects
              });
              setSelectedSemester(semester.semesterNumber);
              setAcademicYearId(semester.contentMapSemDetailsId);
            }}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedSemester === semester.semesterNumber
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <h3 className="font-semibold text-lg mb-3">{semester.semesterName}</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Subjects:</span>
                <span className="font-bold">{semester.totalSubjects}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Assigned:</span>
                <span className="font-bold text-green-600">{semester.assignedSubjects}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-orange-600">Unassigned:</span>
                <span className="font-bold text-orange-600">{semester.unassignedSubjects}</span>
              </div>
            </div>
          </div>
          ))}
        </div>
        )}
      </div>

      {/* Step 4: Subjects Table */}
      {!loadingSemesters && selectedSemester && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Step 4: Subjects - Semester {selectedSemester}</h2>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
              getAssignmentProgress() === 100 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
            }`}>
              {getAssignmentProgress() === 100 ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">{getAssignmentProgress()}% Assigned</span>
            </div>
          </div>

          {loadingSubjects ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-neutral-750">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Subject Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Subject Name</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Credits</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Assigned Staff</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-neutral-700">
                  {[1, 2, 3].map((i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse w-20"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded animate-pulse w-48"></div></td>
                      <td className="px-6 py-4 text-center"><div className="h-4 bg-gray-200 rounded animate-pulse w-8 mx-auto"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div></td>
                      <td className="px-6 py-4 text-center"><div className="h-6 bg-gray-200 rounded-full animate-pulse w-20 mx-auto"></div></td>
                      <td className="px-6 py-4 text-center"><div className="h-8 bg-gray-200 rounded animate-pulse w-24 mx-auto"></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : subjects.length === 0 ? (
            <div className="p-12 text-center">
              <AlertTriangle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Subjects Found</h3>
              <p className="text-gray-600 mb-4">
                This semester doesn't have any subjects mapped yet. Please add subjects in the Content Mapping page.
              </p>
              <button
                onClick={() => window.location.href = '/lms-content-mapping'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go to Content Mapping
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject Name
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Staff
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-neutral-700">
                  {subjects.map((subject) => (
                    <tr key={subject.id} className="hover:bg-gray-50 dark:hover:bg-neutral-750">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-neutral-100">
                        {subject.subjectCode}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-neutral-100">{subject.subjectName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-neutral-100 text-center">
                        {subject.credits}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {subject.isAssigned ? (
                          <div>
                            <div className="font-medium text-gray-900">{subject.assignedStaffName}</div>
                            <div className="text-gray-500">{subject.assignedStaffEmail}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {subject.isAssigned ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Assigned
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenAssignDialog(subject)}
                            className="text-blue-600 hover:text-blue-900"
                            title={subject.isAssigned ? 'Change staff' : 'Assign staff'}
                          >
                            <UserPlus className="w-5 h-5" />
                          </button>
                          {subject.isAssigned && subject.assignmentId && (
                            <button
                              onClick={() => handleRemoveAssignment(subject.assignmentId!)}
                              className="text-red-600 hover:text-red-900"
                              title="Remove assignment"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Assign Staff Dialog */}
      {assignDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {selectedSubject?.isAssigned ? 'Change Staff Assignment' : 'Assign Staff'}
              </h3>
              <button
                onClick={handleCloseAssignDialog}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {selectedSubject && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Subject: {selectedSubject.subjectCode} - {selectedSubject.subjectName}
                  </p>
                  <p className="text-sm text-gray-500">Credits: {selectedSubject.credits}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Staff
                </label>
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Select a staff member --</option>
                  {availableStaff.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} | {staff.email} | {staff.designation || 'Staff'} | Load: {staff.assignedSubjectsCount} subjects
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
              <button
                onClick={handleCloseAssignDialog}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignStaff}
                disabled={!selectedStaff || loadingSubjects}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loadingSubjects ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HODSubjectStaffAssignmentPage;
