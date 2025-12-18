import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  BookOpen, 
  Plus, 
  FileText, 
  HelpCircle, 
  Award,
  Loader,
  Filter,
  ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import ApiService from '../../services/api';
import { QuizBuilder } from '../../components/ContentCreation/QuizBuilder';
import { AssignmentBuilder } from '../../components/ContentCreation/AssignmentBuilder';
import { ExaminationBuilder } from '../../components/ContentCreation/ExaminationBuilder';
import type { Question } from '../../components/ContentCreation/QuestionBuilder';

type ContentType = 'quiz' | 'assignment' | 'examination' | null;

interface FilterState {
  courseId: string;
  academicYearId: string;
  semesterId: string;
  semester: number;
  subjectId: string;
}

export const ContentCreationPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<FilterState>({
    courseId: '',
    academicYearId: '',
    semesterId: '',
    semester: 0,
    subjectId: ''
  });

  const [selectedContentType, setSelectedContentType] = useState<ContentType>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Fetch courses for HOD's department
  const { data: courses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ['hod-courses', user?.departmentId],
    queryFn: async () => {
      if (!user?.departmentId) return [];
      const response = await ApiService.get(`/courses/department/${user.departmentId}`);
      return response.data || response;
    },
    enabled: !!user?.departmentId
  });

  // Fetch academic years for selected course (using HOD endpoint with content mapping)
  const { data: academicYearsData, isLoading: loadingAcademicYears } = useQuery({
    queryKey: ['academic-years', filters.courseId],
    queryFn: async () => {
      if (!filters.courseId) return null;
      const response = await ApiService.get(`/hod/subject-assignments/academic-years`, {
        courseId: filters.courseId
      });
      return response.data || response;
    },
    enabled: !!filters.courseId
  });

  const academicYears = academicYearsData?.academicYears || [];

  // Fetch semesters for selected academic year (using HOD endpoint)
  const { data: semestersData, isLoading: loadingSemesters } = useQuery({
    queryKey: ['semesters', filters.courseId, filters.academicYearId],
    queryFn: async () => {
      if (!filters.courseId || !filters.academicYearId) return null;
      const response = await ApiService.get('/hod/subject-assignments/semesters', {
        courseId: filters.courseId,
        academicYearId: filters.academicYearId
      });
      return response.data || response;
    },
    enabled: !!filters.courseId && !!filters.academicYearId
  });

  const semesters = semestersData?.semesters || [];

  // Fetch subjects for selected semester (using HOD subject-assignments endpoint - same as Subject Staff Assignment page)
  const { data: subjectsData, isLoading: loadingSubjects } = useQuery({
    queryKey: ['hod-subjects', filters.semesterId, filters.semester],
    queryFn: async () => {
      if (!filters.semesterId || !filters.semester) return null;

      console.log('🔍 Fetching subjects for semester:', filters.semester, 'semesterId:', filters.semesterId);
      // Use the same endpoint as Subject Staff Assignment page
      const response = await ApiService.get(`/hod/subject-assignments/subjects?semesterNumber=${filters.semester}&academicYearId=${filters.semesterId}`);
      console.log('🔍 Subjects API response:', response);
      return response.data || response;
    },
    enabled: !!filters.semesterId && !!filters.semester
  });

  // Extract subjects array - all subjects from content_map_sub_details
  const subjects = subjectsData?.subjects || [];
  console.log('🔍 Subjects from API:', subjects.length);
  console.log('🔍 Subject details:', subjects.map((s: any) => ({
    id: s.id,
    code: s.subjectCode,
    name: s.subjectName
  })));

  // Fetch or create session for selected subject (using content map subject details ID)
  const { data: session, isLoading: loadingSession } = useQuery({
    queryKey: ['subject-session', filters.subjectId],
    queryFn: async () => {
      if (!filters.subjectId) return null;
      try {
        // Use content-creation endpoint (no enrollment check - for HOD/Staff)
        const response = await ApiService.get(`/content-creation/subject/${filters.subjectId}/session`);
        console.log('🔍 Session API response:', response);
        return response.data?.session || response.session || null;
      } catch (error: any) {
        // If no session exists, we'll need to create one or show a message
        console.error('No session found for subject:', error);
        // For now, return null and show a message to the user
        return null;
      }
    },
    enabled: !!filters.subjectId
  });

  // Update sessionId when session is loaded
  useEffect(() => {
    if (session?.id) {
      setSessionId(session.id);
    } else {
      setSessionId(null);
    }
  }, [session]);

  // Fetch existing LMS assignments for selected subject
  const { data: existingAssignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['lms-assignments', filters.subjectId],
    queryFn: async () => {
      if (!filters.subjectId) return [];
      try {
        const response = await ApiService.get(`/lms-content/assignments/subject/${filters.subjectId}`);
        return response.data || [];
      } catch (error) {
        console.error('Error fetching assignments:', error);
        return [];
      }
    },
    enabled: !!filters.subjectId
  });

  // Fetch existing LMS examinations for selected subject
  const { data: existingExaminations = [], isLoading: loadingExaminations } = useQuery({
    queryKey: ['lms-examinations', filters.subjectId],
    queryFn: async () => {
      if (!filters.subjectId) return [];
      try {
        const response = await ApiService.get(`/lms-content/examinations/subject/${filters.subjectId}`);
        return response.data || [];
      } catch (error) {
        console.error('Error fetching examinations:', error);
        return [];
      }
    },
    enabled: !!filters.subjectId
  });

  // Fetch existing LMS quizzes for selected subject
  const { data: existingQuizzes = [], isLoading: loadingQuizzes } = useQuery({
    queryKey: ['lms-quizzes', filters.subjectId],
    queryFn: async () => {
      if (!filters.subjectId) return [];
      try {
        const response = await ApiService.get(`/lms-content/quizzes/subject/${filters.subjectId}`);
        return response.data || [];
      } catch (error) {
        console.error('Error fetching quizzes:', error);
        return [];
      }
    },
    enabled: !!filters.subjectId
  });

  // Create content block mutation
  const createContentBlockMutation = useMutation({
    mutationFn: async (data: any) => {
      return await ApiService.createContentBlock(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['session-content-blocks', sessionId]);
      toast.success('Content created successfully!');
      setSelectedContentType(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create content');
    }
  });

  // Create LMS quiz mutation
  const createLMSQuizMutation = useMutation({
    mutationFn: async (data: any) => {
      return await ApiService.post('/lms-content/quizzes', data);
    }
  });

  const handleSaveQuiz = async (quizData: any, questions: Question[]) => {
    if (!filters.subjectId) {
      toast.error('Please select a subject first');
      return;
    }

    try {
      // Create LMS quiz with questions
      await createLMSQuizMutation.mutateAsync({
        contentMapSubDetailsId: filters.subjectId,
        title: quizData.title,
        description: quizData.description || null,
        instructions: quizData.instructions || null,
        duration: quizData.timeLimit || null,
        totalPoints: questions.reduce((sum, q) => sum + (q.points || 1), 0),
        passingPercentage: quizData.passingScore || 50,
        maxAttempts: quizData.allowRetry ? 3 : 1,
        showResults: true,
        showCorrectAnswers: true,
        shuffleQuestions: false,
        shuffleOptions: false,
        allowReview: true,
        isRequired: quizData.isRequired || false,
        questions: questions.map((q, index) => ({
          questionText: q.questionText,
          questionType: q.questionType,
          points: q.points || 1,
          orderIndex: index,
          options: q.options || null,
          correctAnswer: q.correctAnswer || null,
          explanation: q.explanation || null,
          isRequired: true
        }))
      });

      toast.success('Quiz created successfully!');
      setSelectedContentType(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create quiz');
    }
  };

  const handleSaveAssignment = async (assignmentData: any) => {
    if (!filters.subjectId) {
      toast.error('Please select a subject first');
      return;
    }

    try {
      // Create LMS assignment (not workflow content block)
      const response = await ApiService.post('/lms-content/assignments', {
        contentMapSubDetailsId: filters.subjectId,
        title: assignmentData.title,
        description: assignmentData.description,
        instructions: assignmentData.instructions,
        submissionFormat: assignmentData.submissionFormat,
        maxPoints: assignmentData.maxPoints,
        dueDate: assignmentData.dueDate,
        allowLateSubmission: assignmentData.allowLateSubmission,
        rubric: assignmentData.rubric,
        estimatedTime: parseInt(assignmentData.estimatedTime) || null,
        isRequired: assignmentData.isRequired
      });

      toast.success('Assignment created successfully!');
      setSelectedContentType(null);

      // Invalidate queries to refresh the existing content list
      queryClient.invalidateQueries(['lms-assignments', filters.subjectId]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create assignment');
    }
  };

  const handleSaveExamination = async (examinationData: any, questions: Question[]) => {
    if (!filters.subjectId) {
      toast.error('Please select a subject first');
      return;
    }

    try {
      // Create LMS examination (not workflow content block)
      const response = await ApiService.post('/lms-content/examinations', {
        contentMapSubDetailsId: filters.subjectId,
        title: examinationData.title,
        instructions: examinationData.instructions,
        duration: examinationData.timeLimit,
        totalPoints: questions.reduce((sum, q) => sum + (q.points || 0), 0),
        passingPercentage: examinationData.passingScore,
        maxAttempts: 1,
        showResults: true,
        shuffleQuestions: false,
        shuffleOptions: false,
        allowReview: true,
        isProctored: false,
        isRequired: examinationData.isRequired,
        questions: questions.map((q, index) => ({
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options,
          correctAnswer: q.correctAnswer,
          points: q.points,
          explanation: q.explanation,
          orderIndex: index,
          isRequired: true
        }))
      });

      toast.success('Examination created successfully!');
      setSelectedContentType(null);

      // Invalidate queries to refresh the existing content list
      queryClient.invalidateQueries(['lms-examinations', filters.subjectId]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create examination');
    }
  };

  const canCreateContent = !!sessionId;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Content Creation</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create quizzes, assignments, and examinations for your department's subjects
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Select Subject</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Course */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Course <span className="text-red-500">*</span>
            </label>
            <select
              value={filters.courseId}
              onChange={(e) => setFilters({ courseId: e.target.value, academicYearId: '', semesterId: '', subjectId: '' })}
              disabled={loadingCourses}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
            >
              <option value="">Select Course</option>
              {courses.map((course: any) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          {/* Academic Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Academic Year <span className="text-red-500">*</span>
            </label>
            <select
              value={filters.academicYearId}
              onChange={(e) => setFilters({ ...filters, academicYearId: e.target.value, semesterId: '', subjectId: '' })}
              disabled={!filters.courseId || loadingAcademicYears}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
            >
              <option value="">Select Academic Year</option>
              {academicYears.map((year: any) => (
                <option key={year.id} value={year.id}>
                  {year.yearName} ({year.subjectCount} subject{year.subjectCount !== 1 ? 's' : ''})
                </option>
              ))}
            </select>
            {academicYears.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Showing {academicYears.length} academic year{academicYears.length !== 1 ? 's' : ''} with content mapping
              </p>
            )}
          </div>

          {/* Semester */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Semester <span className="text-red-500">*</span>
            </label>
            <select
              value={filters.semesterId}
              onChange={(e) => {
                const selectedSemester = semesters.find((s: any) => s.contentMapSemDetailsId === e.target.value);
                setFilters({
                  ...filters,
                  semesterId: e.target.value,
                  semester: selectedSemester?.semesterNumber || 0,
                  subjectId: ''
                });
              }}
              disabled={!filters.academicYearId || loadingSemesters}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
            >
              <option value="">Select Semester</option>
              {semesters.map((semester: any) => (
                <option key={semester.contentMapSemDetailsId} value={semester.contentMapSemDetailsId}>
                  {semester.semesterName} ({semester.totalSubjects} subject{semester.totalSubjects !== 1 ? 's' : ''})
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              value={filters.subjectId}
              onChange={(e) => setFilters({ ...filters, subjectId: e.target.value })}
              disabled={!filters.semesterId || loadingSubjects}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
            >
              <option value="">Select Subject</option>
              {subjects.length === 0 && !loadingSubjects && filters.semesterId && (
                <option disabled>No assigned subjects available</option>
              )}
              {subjects.map((subject: any) => (
                <option key={subject.id} value={subject.id}>
                  {subject.subjectCode} - {subject.subjectName}
                </option>
              ))}
            </select>
            {subjects.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {subjects.length} subject{subjects.length !== 1 ? 's' : ''} assigned to this semester
              </p>
            )}
          </div>
        </div>

        {loadingSession && (
          <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400">
            <Loader className="w-4 h-4 animate-spin mr-2" />
            <span className="text-sm">Loading session...</span>
          </div>
        )}

        {filters.subjectId && !loadingSession && !session && (
          <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              No session found for this subject. Please map the subject to a workflow session first.
            </p>
          </div>
        )}
      </div>

      {/* Existing Content Display */}
      {canCreateContent && !selectedContentType && (existingAssignments.length > 0 || existingExaminations.length > 0 || existingQuizzes.length > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Existing Content
          </h2>

          <div className="space-y-6">
            {/* Existing Assignments */}
            {existingAssignments.length > 0 && (
              <div>
                <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                  <FileText className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                  Assignments ({existingAssignments.length})
                </h3>
                <div className="space-y-2">
                  {existingAssignments.map((assignment: any) => (
                    <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{assignment.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Due: {new Date(assignment.dueDate).toLocaleDateString()} • {assignment.totalPoints} points
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        assignment.isActive
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {assignment.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing Examinations */}
            {existingExaminations.length > 0 && (
              <div>
                <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                  <Award className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
                  Examinations ({existingExaminations.length})
                </h3>
                <div className="space-y-2">
                  {existingExaminations.map((examination: any) => (
                    <div key={examination.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{examination.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Duration: {examination.duration} min • {examination.totalPoints} points • Pass: {examination.passingPercentage}%
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        examination.isActive
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {examination.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing Quizzes */}
            {existingQuizzes.length > 0 && (
              <div>
                <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                  <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                  Quizzes ({existingQuizzes.length})
                </h3>
                <div className="space-y-2">
                  {existingQuizzes.map((quiz: any) => (
                    <div key={quiz.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{quiz.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {quiz.questionCount || 0} questions
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        quiz.isActive
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {quiz.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content Type Selection */}
      {canCreateContent && !selectedContentType && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Create New Content
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setSelectedContentType('quiz')}
              className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
            >
              <HelpCircle className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Quiz</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create a quiz with multiple choice, true/false, or text-based questions
              </p>
            </button>

            <button
              onClick={() => setSelectedContentType('assignment')}
              className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group"
            >
              <FileText className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Assignment</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create an assignment for students to submit text or file uploads
              </p>
            </button>

            <button
              onClick={() => setSelectedContentType('examination')}
              className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
            >
              <Award className="w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Examination</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create a final examination with certificate generation on pass
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Content Builders */}
      {selectedContentType === 'quiz' && (
        <QuizBuilder
          onSave={handleSaveQuiz}
          onCancel={() => setSelectedContentType(null)}
          loading={createLMSQuizMutation.isLoading}
        />
      )}

      {selectedContentType === 'assignment' && (
        <AssignmentBuilder
          onSave={handleSaveAssignment}
          onCancel={() => setSelectedContentType(null)}
          loading={false}
        />
      )}

      {selectedContentType === 'examination' && (
        <ExaminationBuilder
          onSave={handleSaveExamination}
          onCancel={() => setSelectedContentType(null)}
          loading={false}
        />
      )}
    </div>
  );
};

