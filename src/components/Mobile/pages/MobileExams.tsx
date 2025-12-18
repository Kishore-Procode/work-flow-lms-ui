import React, { useState, useMemo } from 'react';
import { Play, CheckCircle, XCircle, Award, RefreshCw, ChevronRight, Clock, Eye, ArrowLeft, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import ApiService from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { router } from '../../../utils/router';
import toast from 'react-hot-toast';

interface FlatExam {
    id: string;
    title: string;
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    instructions: string;
    passingScore: number;
    duration: number;
    status: 'available' | 'locked' | 'in_progress' | 'completed';
    completionPercentage: number;
    attemptId?: string;
    totalScore?: number;
    maxScore?: number;
    percentage?: number;
    isPassed?: boolean;
}

const MobileExams: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
    const [selectedExam, setSelectedExam] = useState<FlatExam | null>(null);
    const [viewingDetailedResults, setViewingDetailedResults] = useState(false);
    const [detailedResults, setDetailedResults] = useState<any>(null);
    const [loadingResults, setLoadingResults] = useState(false);

    // Fetch student examinations
    const { data: examinationsData = [], isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['lms-student-examinations', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const response = await ApiService.get('/lms-content/student/examinations');
            return response.data || response;
        },
        enabled: !!user?.id
    });

    // Fetch course completion for subjects
    const { data: completionData = {} } = useQuery({
        queryKey: ['course-completion', user?.id, examinationsData],
        queryFn: async () => {
            if (!user?.id || !Array.isArray(examinationsData) || examinationsData.length === 0) return {};

            const completions: Record<string, any> = {};

            for (const subjectData of examinationsData) {
                try {
                    const response = await ApiService.get(`/lms-content/course-completion/${subjectData.subjectId}`);
                    let completionInfo;
                    if (response.data?.data) {
                        completionInfo = response.data.data;
                    } else if (response.data?.completionPercentage !== undefined) {
                        completionInfo = response.data;
                    } else if (response.completionPercentage !== undefined) {
                        completionInfo = response;
                    }
                    if (completionInfo) {
                        completions[subjectData.subjectId] = completionInfo;
                    }
                } catch (error) {
                    console.error(`Error fetching completion for subject ${subjectData.subjectId}:`, error);
                }
            }

            return completions;
        },
        enabled: !!user?.id && Array.isArray(examinationsData) && examinationsData.length > 0,
        staleTime: 0,
    });

    // Fetch examination attempts
    const { data: attemptsData = {} } = useQuery({
        queryKey: ['lms-examination-attempts', user?.id, examinationsData],
        queryFn: async () => {
            if (!user?.id || !Array.isArray(examinationsData) || examinationsData.length === 0) return {};

            const attempts: Record<string, any> = {};

            for (const subjectData of examinationsData) {
                if (subjectData.examinations) {
                    for (const exam of subjectData.examinations) {
                        try {
                            const response = await ApiService.get(`/lms-content/examinations/${exam.id}/attempt-status`);
                            const data = response.data || response;

                            let attemptInfo = null;
                            if (data.data) {
                                attemptInfo = data.data;
                            } else if (data.hasAttempt !== undefined) {
                                attemptInfo = data;
                            }

                            if (attemptInfo) {
                                attempts[exam.id] = attemptInfo;
                            }
                        } catch (error) {
                            console.error(`Error fetching attempt for exam ${exam.id}:`, error);
                        }
                    }
                }
            }

            return attempts;
        },
        enabled: !!user?.id && Array.isArray(examinationsData) && examinationsData.length > 0,
        staleTime: 0,
    });

    // Load detailed examination results
    const handleViewDetailedResults = async (examinationId: string) => {
        try {
            setLoadingResults(true);
            const response = await ApiService.get(`/lms-content/examinations/${examinationId}/results`);

            // API returns: { success: true, data: { ... } } - axios wraps this in response.data
            // So we need response.data (axios) -> then .data (our API structure)
            const resultsData = response.data?.data || response.data || response;

            if (resultsData) {
                setDetailedResults(resultsData);
                setViewingDetailedResults(true);
            } else {
                toast.error('No results found for this examination');
            }
        } catch (error: any) {
            console.error('Error loading detailed results:', error);
            toast.error('Failed to load detailed results');
        } finally {
            setLoadingResults(false);
        }
    };

    // Flatten and transform the nested data structure
    const allExams: FlatExam[] = useMemo(() => {
        const result: FlatExam[] = [];

        if (!Array.isArray(examinationsData)) return result;

        for (const subjectData of examinationsData) {
            const { subjectId, subjectCode, subjectName, examinations: subjectExams } = subjectData;
            const completion = completionData[subjectId];
            const completionPercentage = completion?.completionPercentage || 0;

            if (subjectExams && Array.isArray(subjectExams)) {
                for (const exam of subjectExams) {
                    const attempt = attemptsData[exam.id];

                    let status: FlatExam['status'] = 'available';
                    if (attempt?.hasAttempt && attempt?.attempt?.status === 'completed') {
                        status = 'completed';
                    } else if (attempt?.hasAttempt && attempt?.attempt?.status === 'in_progress') {
                        status = 'in_progress';
                    } else if (completionPercentage < 100) {
                        status = 'locked';
                    }

                    result.push({
                        id: exam.id,
                        title: exam.title,
                        subjectId: subjectId,
                        subjectName: subjectName || 'Unknown Subject',
                        subjectCode: subjectCode || '',
                        instructions: exam.instructions || '',
                        passingScore: exam.passingScore || 60,
                        duration: exam.timeLimit || exam.duration || 60,
                        status,
                        completionPercentage,
                        attemptId: attempt?.attempt?.id,
                        totalScore: attempt?.attempt?.totalScore,
                        maxScore: attempt?.attempt?.maxScore || exam.maxPoints || 100,
                        percentage: attempt?.attempt?.percentage,
                        isPassed: attempt?.attempt?.isPassed,
                    });
                }
            }
        }

        return result;
    }, [examinationsData, completionData, attemptsData]);

    const upcomingExams = allExams.filter(e => e.status !== 'completed');
    const completedExams = allExams.filter(e => e.status === 'completed');

    const displayExams = activeTab === 'upcoming' ? upcomingExams : completedExams;

    const handleExamClick = (exam: FlatExam) => {
        if (exam.status === 'locked') {
            return;
        }

        if (exam.status === 'completed') {
            setSelectedExam(exam);
            return;
        }

        router.navigateTo(`exam-player/${exam.id}`);
    };

    // Detailed Results View (Questions & Answers)
    if (viewingDetailedResults && detailedResults) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 px-5 py-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10 flex items-center gap-4">
                    <button
                        onClick={() => { setViewingDetailedResults(false); setDetailedResults(null); }}
                        className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                        Detailed Results
                    </h1>
                </div>

                <div className="p-5 space-y-6">
                    {/* Summary Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h2 className="font-bold text-gray-900 dark:text-white mb-2">{detailedResults.examinationTitle}</h2>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Total Score:</span>
                            <span className={`font-bold ${Number(detailedResults.percentage) >= 50 // Assuming 50 is passing for now, or use isPassed if available in data
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                                }`}>
                                {detailedResults.totalScore}/{detailedResults.maxScore} ({Number(detailedResults.percentage || 0).toFixed(1)}%)
                            </span>
                        </div>
                    </div>

                    {/* Questions List */}
                    <div className="space-y-6">
                        {detailedResults.answers?.map((answer: any, index: number) => {
                            const isCorrect = answer.isCorrect === true || (answer.pointsAwarded > 0 && answer.pointsAwarded >= answer.maxPoints);
                            const isPartiallyCorrect = answer.pointsAwarded > 0 && answer.pointsAwarded < answer.maxPoints;
                            const isSubjective = answer.questionType === 'short_answer' || answer.questionType === 'long_answer' || answer.questionType === 'essay';

                            return (
                                <div
                                    key={answer.questionId}
                                    className={`bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border-l-4 ${isCorrect
                                        ? 'border-l-green-500'
                                        : isPartiallyCorrect
                                            ? 'border-l-yellow-500'
                                            : 'border-l-red-500'
                                        }`}
                                >
                                    {/* Question Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="font-semibold text-gray-900 dark:text-white pr-2">
                                            <span className="text-gray-500 mr-2">Q{index + 1}.</span>
                                            {answer.questionText}
                                        </h3>
                                        {isCorrect ? (
                                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        ) : isPartiallyCorrect ? (
                                            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                        )}
                                    </div>

                                    {/* Badge info */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300 rounded-md">
                                            {answer.maxPoints} pts
                                        </span>
                                        <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-xs font-medium text-blue-600 dark:text-blue-300 rounded-md">
                                            {answer.questionType.replace('_', ' ')}
                                        </span>
                                    </div>

                                    {/* Student Answer */}
                                    <div className="mb-4">
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                            Your Answer
                                        </p>
                                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-sm text-gray-900 dark:text-white">
                                            {answer.studentAnswer || <span className="text-gray-400 italic">No answer provided</span>}
                                        </div>
                                    </div>

                                    {/* Correct Answer (if incorrect and not subjective) */}
                                    {!isCorrect && !isSubjective && answer.correctAnswer && (
                                        <div className="mb-4">
                                            <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">
                                                Correct Answer
                                            </p>
                                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-sm text-green-800 dark:text-green-200">
                                                {answer.correctAnswer}
                                            </div>
                                        </div>
                                    )}

                                    {/* Feedback */}
                                    {answer.feedback && (
                                        <div className="mb-4">
                                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
                                                Feedback
                                            </p>
                                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-200">
                                                {answer.feedback}
                                            </div>
                                        </div>
                                    )}

                                    {/* Points Awarded */}
                                    <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-700">
                                        <span className={`text-sm font-bold ${isCorrect ? 'text-green-600 dark:text-green-400'
                                            : isPartiallyCorrect ? 'text-yellow-600 dark:text-yellow-400'
                                                : 'text-red-600 dark:text-red-400'
                                            }`}>
                                            +{answer.pointsAwarded ?? 0} Points
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // If viewing a selected exam result properly (The Summary View)
    if (selectedExam) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
                {/* Detail Header */}
                <div className="bg-white dark:bg-gray-800 px-5 py-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10 flex items-center gap-4">
                    <button
                        onClick={() => setSelectedExam(null)}
                        className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                    >
                        <ChevronRight className="w-6 h-6 rotate-180" /> {/* Reusing ChevronRight as Back */}
                    </button>
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                        Exam Results
                    </h1>
                </div>

                <div className="p-5 space-y-6">
                    {/* Header Info */}
                    <div className="text-center">
                        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${selectedExam.isPassed
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            }`}>
                            {selectedExam.isPassed ? (
                                <Award className="w-10 h-10" />
                            ) : (
                                <XCircle className="w-10 h-10" />
                            )}
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{selectedExam.title}</h2>
                        <p className="text-gray-500 dark:text-gray-400">{selectedExam.subjectName}</p>
                    </div>

                    {/* Score Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="text-center mb-6">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Total Score</p>
                            <div className="flex items-end justify-center gap-1">
                                <span className={`text-5xl font-bold ${selectedExam.isPassed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                    }`}>
                                    {Number(selectedExam.percentage || 0).toFixed(0)}%
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                {selectedExam.totalScore}/{selectedExam.maxScore} points
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-700 pt-6">
                            <div className="text-center">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-semibold ${selectedExam.isPassed
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                    {selectedExam.isPassed ? 'Passed' : 'Failed'}
                                </span>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Passing Score</p>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {selectedExam.passingScore}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* View Detailed Results Button */}
                    <button
                        onClick={() => handleViewDetailedResults(selectedExam.id)}
                        disabled={loadingResults}
                        className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
                    >
                        {loadingResults ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                            <Eye className="w-5 h-5" />
                        )}
                        {loadingResults ? 'Loading Results...' : 'View Detailed Results'}
                    </button>

                    {/* Instructions / Details */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            Duration
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            You had {selectedExam.duration} minutes to complete this exam.
                        </p>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 pt-12 px-5 pb-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Examinations</h1>
                    <button
                        onClick={() => refetch()}
                        className={`w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center ${isRefetching ? 'animate-spin' : ''}`}
                    >
                        <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-3 text-white">
                        <p className="text-2xl font-bold">{upcomingExams.length}</p>
                        <p className="text-sm text-orange-100">Upcoming</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-3 text-white">
                        <p className="text-2xl font-bold">{completedExams.length}</p>
                        <p className="text-sm text-green-100">Completed</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                    {(['upcoming', 'completed'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab
                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Exams List */}
            <div className="p-5 space-y-3 pb-24">
                {isLoading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 animate-pulse">
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                        </div>
                    ))
                ) : displayExams.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
                        <Award className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No {activeTab} exams
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {activeTab === 'upcoming'
                                ? 'No exams scheduled at the moment.'
                                : 'Complete exams to see your results here.'}
                        </p>
                    </div>
                ) : (
                    displayExams.map((exam) => {
                        const isLocked = exam.status === 'locked';
                        const isCompleted = exam.status === 'completed';
                        const isPassed = exam.isPassed;

                        return (
                            <div
                                key={exam.id}
                                onClick={() => handleExamClick(exam)}
                                className={`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 ${isLocked ? 'opacity-60' : 'active:scale-[0.98] cursor-pointer'
                                    } transition-transform`}
                            >
                                <div className="flex items-start">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 ${isCompleted
                                        ? isPassed
                                            ? 'bg-green-100 dark:bg-green-900/30'
                                            : 'bg-red-100 dark:bg-red-900/30'
                                        : isLocked
                                            ? 'bg-gray-100 dark:bg-gray-700'
                                            : 'bg-purple-100 dark:bg-purple-900/30'
                                        }`}>
                                        {isCompleted ? (
                                            isPassed ? (
                                                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                                            ) : (
                                                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                                            )
                                        ) : (
                                            <Award className={`w-6 h-6 ${isLocked ? 'text-gray-400' : 'text-purple-600 dark:text-purple-400'}`} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 mb-1">
                                            {exam.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-1">
                                            {exam.subjectName}
                                        </p>
                                        {isCompleted ? (
                                            <div className={`inline-flex items-center px-2.5 py-1 rounded-lg ${isPassed
                                                ? 'bg-green-100 dark:bg-green-900/30'
                                                : 'bg-red-100 dark:bg-red-900/30'
                                                }`}>
                                                <span className={`text-sm font-semibold ${isPassed
                                                    ? 'text-green-700 dark:text-green-400'
                                                    : 'text-red-700 dark:text-red-400'
                                                    }`}>
                                                    {isPassed ? 'Passed' : 'Failed'}: {Number(exam.percentage || 0).toFixed(0)}%
                                                </span>
                                            </div>
                                        ) : isLocked ? (
                                            <div className="flex items-center text-sm text-gray-500">
                                                <span>Complete {exam.completionPercentage.toFixed(0)}% of course to unlock</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                <Clock className="w-4 h-4 mr-1" />
                                                <span>{exam.duration} min</span>
                                                <span className="mx-2">•</span>
                                                <span>{exam.maxScore} marks</span>
                                            </div>
                                        )}
                                    </div>
                                    {!isLocked && !isCompleted && (
                                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center ml-2">
                                            <Play className="w-5 h-5 text-purple-600 dark:text-purple-400 ml-0.5" />
                                        </div>
                                    )}
                                    {isCompleted && (
                                        <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default MobileExams;
