import React, { useState, useMemo } from 'react';
import { FileText, CheckCircle, AlertCircle, Calendar, RefreshCw, ChevronRight, ArrowLeft, Upload, Award, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ApiService from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { toast } from 'react-hot-toast';

interface FlatAssignment {
    id: string;
    title: string;
    subjectName: string;
    subjectCode: string;
    description: string;
    maxPoints: number;
    dueDate?: string;
    status: 'pending' | 'submitted' | 'graded';
    submittedAt?: string;
    gradedAt?: string;
    score?: number;
    feedback?: string;
}

const MobileAssignments: React.FC = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'pending' | 'submitted' | 'graded'>('pending');
    const [selectedAssignment, setSelectedAssignment] = useState<FlatAssignment | null>(null);
    const [submissionText, setSubmissionText] = useState<string>('');
    const [submissionFiles, setSubmissionFiles] = useState<any[]>([]);

    // Fetch student assignments - same API as desktop
    const { data: assignmentsData = [], isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['lms-student-assignments', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const response = await ApiService.get('/lms-content/student/assignments');
            return response.data || response;
        },
        enabled: !!user?.id
    });

    // Fetch submission status for assignments
    const { data: submissionsData = {} } = useQuery({
        queryKey: ['lms-assignment-submissions', user?.id, assignmentsData],
        queryFn: async () => {
            if (!user?.id || !Array.isArray(assignmentsData) || assignmentsData.length === 0) return {};

            const submissions: Record<string, any> = {};

            for (const subjectData of assignmentsData) {
                if (subjectData.assignments) {
                    for (const assignment of subjectData.assignments) {
                        try {
                            const response = await ApiService.get(`/lms-content/assignments/${assignment.id}/status`);
                            const data = response.data || response;

                            let hasSubmitted = false;
                            let submission = null;

                            if (data.data?.hasSubmitted !== undefined) {
                                hasSubmitted = data.data.hasSubmitted;
                                submission = data.data.submission;
                            } else if (data.hasSubmitted !== undefined) {
                                hasSubmitted = data.hasSubmitted;
                                submission = data.submission;
                            }

                            if (hasSubmitted && submission) {
                                submissions[assignment.id] = submission;
                            }
                        } catch (error) {
                            console.error(`Error fetching submission for assignment ${assignment.id}:`, error);
                        }
                    }
                }
            }

            return submissions;
        },
        enabled: !!user?.id && Array.isArray(assignmentsData) && assignmentsData.length > 0,
        staleTime: 0,
    });

    // Assignment submission mutation
    const submitAssignmentMutation = useMutation({
        mutationFn: async (data: { assignmentId: string; submissionText: string; submissionFiles: any[] }) => {
            return await ApiService.post('/lms-content/assignments/submit', data);
        },
        onSuccess: () => {
            toast.success('Assignment submitted successfully!');
            // Invalidate queries to refresh the data
            queryClient.invalidateQueries({ queryKey: ['lms-student-assignments', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['lms-assignment-submissions', user?.id] });
            setSelectedAssignment(null);
            setSubmissionText('');
            setSubmissionFiles([]);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || error.message || 'Failed to submit assignment');
        }
    });

    // Handle assignment submission
    const handleSubmitAssignment = async () => {
        if (!selectedAssignment) return;

        if (!submissionText && submissionFiles.length === 0) {
            toast.error('Please provide either text submission or upload files');
            return;
        }

        submitAssignmentMutation.mutate({
            assignmentId: selectedAssignment.id,
            submissionText,
            submissionFiles
        });
    };

    // Flatten and transform the nested data structure
    const allAssignments: FlatAssignment[] = useMemo(() => {
        const result: FlatAssignment[] = [];

        if (!Array.isArray(assignmentsData)) return result;

        for (const subjectData of assignmentsData) {
            const { subjectCode, subjectName, assignments: subjectAssignments } = subjectData;

            if (subjectAssignments && Array.isArray(subjectAssignments)) {
                for (const assignment of subjectAssignments) {
                    const submission = submissionsData[assignment.id];

                    let status: 'pending' | 'submitted' | 'graded' = 'pending';
                    let feedback = undefined;

                    if (submission) {
                        if (submission.gradedAt) {
                            status = 'graded';
                            feedback = submission.feedback;
                        } else if (submission.submittedAt) {
                            status = 'submitted';
                        }
                    }

                    result.push({
                        id: assignment.id,
                        title: assignment.title,
                        subjectName: subjectName || 'Unknown Subject',
                        subjectCode: subjectCode || '',
                        description: assignment.description || '',
                        maxPoints: assignment.maxPoints || 100,
                        dueDate: assignment.dueDate,
                        status,
                        submittedAt: submission?.submittedAt,
                        gradedAt: submission?.gradedAt,
                        score: submission?.score,
                        feedback
                    });
                }
            }
        }

        return result;
    }, [assignmentsData, submissionsData]);

    const filteredAssignments = allAssignments.filter((a) => a.status === activeTab);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'No deadline';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getDaysUntil = (dateStr?: string) => {
        if (!dateStr) return null;
        const now = new Date();
        const deadline = new Date(dateStr);
        const diff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const pendingCount = allAssignments.filter(a => a.status === 'pending').length;
    const submittedCount = allAssignments.filter(a => a.status === 'submitted').length;
    const gradedCount = allAssignments.filter(a => a.status === 'graded').length;

    // Detail View
    if (selectedAssignment) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
                {/* Detail Header */}
                <div className="bg-white dark:bg-gray-800 px-5 py-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10 flex items-center gap-4">
                    <button
                        onClick={() => setSelectedAssignment(null)}
                        className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                        Assignment Details
                    </h1>
                </div>

                <div className="p-5 space-y-6">
                    {/* Title & Subject */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{selectedAssignment.title}</h2>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-medium text-gray-900 dark:text-gray-300 mr-2">{selectedAssignment.subjectCode}</span>
                            <span>{selectedAssignment.subjectName}</span>
                        </div>
                    </div>

                    {/* Status & Points Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Status</p>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold
                                ${selectedAssignment.status === 'graded' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                    selectedAssignment.status === 'submitted' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                {selectedAssignment.status === 'graded' ? (
                                    <><CheckCircle className="w-3 h-3 mr-1" /> Graded</>
                                ) : selectedAssignment.status === 'submitted' ? (
                                    <><Clock className="w-3 h-3 mr-1" /> Submitted</>
                                ) : (
                                    <><FileText className="w-3 h-3 mr-1" /> Pending</>
                                )}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Points</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                                {selectedAssignment.score !== undefined ? `${selectedAssignment.score}/` : ''}{selectedAssignment.maxPoints} pts
                            </p>
                        </div>
                        <div className="col-span-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Due Date</p>
                            <div className="flex items-center text-gray-900 dark:text-white font-medium">
                                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                {formatDate(selectedAssignment.dueDate)}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Description</h3>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                            {selectedAssignment.description}
                        </div>
                    </div>

                    {/* Grading Results */}
                    {selectedAssignment.status === 'graded' && (
                        <div className="bg-green-50 dark:bg-green-900/10 rounded-2xl p-5 border border-green-100 dark:border-green-900/30">
                            <h3 className="font-semibold text-green-900 dark:text-green-300 mb-4 flex items-center">
                                <Award className="w-5 h-5 mr-2" />
                                Grading Results
                            </h3>

                            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Your Score</p>
                                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                    {selectedAssignment.score}<span className="text-lg text-gray-400 font-normal">/{selectedAssignment.maxPoints}</span>
                                </div>
                            </div>

                            {selectedAssignment.feedback && (
                                <div>
                                    <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">Instructor Feedback:</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-black/20 p-3 rounded-lg">
                                        {selectedAssignment.feedback}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Submission Form */}
                    {selectedAssignment.status === 'pending' && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Submit Assignment</h3>

                            <div className="mb-4">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                                    Your Answer
                                </label>
                                <textarea
                                    value={submissionText}
                                    onChange={(e) => setSubmissionText(e.target.value)}
                                    rows={6}
                                    placeholder="Type your answer here..."
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-gray-900 dark:text-white"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                                    Attachments
                                </label>
                                <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-xs text-gray-500">
                                        Tap to upload files
                                    </p>
                                    <input
                                        type="file"
                                        multiple
                                        className="hidden"
                                        id="mobile-file-upload"
                                        onChange={(e) => {
                                            // TODO: Implement file upload logic
                                            console.log('Files:', e.target.files);
                                            toast.success('Files selected');
                                        }}
                                    />
                                    <label htmlFor="mobile-file-upload" className="absolute inset-0 cursor-pointer"></label>
                                </div>
                            </div>

                            <button
                                onClick={handleSubmitAssignment}
                                disabled={submitAssignmentMutation.isPending}
                                className="w-full bg-blue-600 active:bg-blue-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
                            >
                                {submitAssignmentMutation.isPending ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>Submit Assignment</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 pt-12 px-5 pb-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assignments</h1>
                    <button
                        onClick={() => refetch()}
                        className={`w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center ${isRefetching ? 'animate-spin' : ''}`}
                    >
                        <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                {/* Tabs with counts */}
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                    {([
                        { key: 'pending', label: 'Pending', count: pendingCount },
                        { key: 'submitted', label: 'Submitted', count: submittedCount },
                        { key: 'graded', label: 'Graded', count: gradedCount },
                    ] as const).map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 ${activeTab === tab.key
                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                    : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Assignments List */}
            <div className="p-5 space-y-3 pb-24">
                {isLoading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 animate-pulse">
                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                        </div>
                    ))
                ) : filteredAssignments.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
                        <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No {activeTab} assignments
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {activeTab === 'pending'
                                ? 'Great! You\'re all caught up.'
                                : `No assignments in ${activeTab} status.`}
                        </p>
                    </div>
                ) : (
                    filteredAssignments.map((assignment) => {
                        const daysUntil = getDaysUntil(assignment.dueDate);
                        const isOverdue = daysUntil !== null && daysUntil < 0;
                        const isUrgent = daysUntil !== null && daysUntil >= 0 && daysUntil <= 2;

                        return (
                            <div
                                key={assignment.id}
                                onClick={() => setSelectedAssignment(assignment)}
                                className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 active:scale-[0.98] transition-transform cursor-pointer"
                            >
                                <div className="flex items-start">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 ${activeTab === 'graded'
                                        ? 'bg-green-100 dark:bg-green-900/30'
                                        : isOverdue
                                            ? 'bg-red-100 dark:bg-red-900/30'
                                            : 'bg-orange-100 dark:bg-orange-900/30'
                                        }`}>
                                        {activeTab === 'graded' ? (
                                            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                                        ) : isOverdue ? (
                                            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                                        ) : (
                                            <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 mb-1">
                                            {assignment.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-1">
                                            {assignment.subjectName}
                                        </p>
                                        <div className="flex items-center text-sm">
                                            <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                                            <span className={`${isOverdue
                                                ? 'text-red-600 dark:text-red-400 font-medium'
                                                : isUrgent
                                                    ? 'text-orange-600 dark:text-orange-400 font-medium'
                                                    : 'text-gray-500 dark:text-gray-400'
                                                }`}>
                                                {isOverdue
                                                    ? `Overdue by ${Math.abs(daysUntil!)} days`
                                                    : daysUntil === 0
                                                        ? 'Due today'
                                                        : daysUntil === 1
                                                            ? 'Due tomorrow'
                                                            : formatDate(assignment.dueDate)}
                                            </span>
                                        </div>
                                        {activeTab === 'graded' && assignment.score !== undefined && (
                                            <div className="mt-2 inline-flex items-center px-2.5 py-1 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                                                    Score: {assignment.score}/{assignment.maxPoints}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default MobileAssignments;
