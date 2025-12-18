import React from 'react';
import {
    Award,
    CheckCircle,
    FileText,
    Download,
    ArrowLeft
} from 'lucide-react';
import ApiService from '../../services/api';
import { toast } from 'react-hot-toast';

interface AssignmentResultsProps {
    assignmentId: string;
    submissionId: string;
    onBack: () => void;
}

export const AssignmentResults: React.FC<AssignmentResultsProps> = ({ assignmentId, submissionId, onBack }) => {
    const [results, setResults] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        loadResults();
    }, [submissionId]);

    const loadResults = async () => {
        try {
            setLoading(true);
            // Fetch submission details
            const response = await ApiService.get(`/lms-content/assignments/${assignmentId}/status`);
            const data = response.data?.submission || response.submission || null;
            console.log('Assignment submission results:', data);
            setResults(data);
        } catch (error: any) {
            console.error('Error loading assignment results:', error);
            toast.error('Failed to load assignment results');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!results) {
        return (
            <div className="p-6">
                <p className="text-gray-600 dark:text-gray-400">No submission found</p>
            </div>
        );
    }

    const percentage = results.maxScore > 0 ? Math.round((results.score / results.maxScore) * 100) : 0;
    const isPassed = percentage >= 50;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <button
                    onClick={onBack}
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Assignments
                </button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Assignment Results
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Graded on: {new Date(results.gradedAt).toLocaleDateString()}
                </p>
            </div>

            {/* Score Summary */}
            <div className={`rounded-lg p-6 ${isPassed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Your Score</p>
                        <p className={`text-5xl font-bold mt-2 ${isPassed ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                            {results.score}/{results.maxScore}
                        </p>
                        <p className="text-lg font-semibold mt-1">
                            {percentage}%
                        </p>
                        {results.isLate && (
                            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                                ⚠️ Late Submission
                            </p>
                        )}
                    </div>
                    <Award className={`w-20 h-20 opacity-20 ${isPassed ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`} />
                </div>
            </div>

            {/* Your Submission */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Submission</h2>

                {results.submissionText && (
                    <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Text Response:</p>
                        <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                            <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                                {results.submissionText}
                            </p>
                        </div>
                    </div>
                )}

                {results.submissionFiles && results.submissionFiles.length > 0 && (
                    <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Submitted Files:</p>
                        <div className="space-y-2">
                            {results.submissionFiles.map((file: any, index: number) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-600"
                                >
                                    <div className="flex items-center">
                                        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                                        <span className="text-sm text-gray-900 dark:text-white">{file.fileName}</span>
                                    </div>
                                    <a
                                        href={file.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center"
                                    >
                                        <Download className="w-4 h-4 mr-1" />
                                        Download
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Submitted: {new Date(results.submittedAt).toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Instructor Feedback */}
            {results.feedback && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
                    <div className="flex items-start">
                        <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                Instructor Feedback
                            </p>
                            <p className="text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                                {results.feedback}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Rubric Scores */}
            {results.rubricScores && results.rubricScores.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rubric-Based Grading</h2>
                    <div className="space-y-4">
                        {results.rubricScores.map((rubric: any, index: number) => {
                            const rubricPercentage = (rubric.score / rubric.maxScore) * 100;
                            return (
                                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-medium text-gray-900 dark:text-white">{rubric.criteria}</p>
                                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                            {rubric.score}/{rubric.maxScore}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 my-2">
                                        <div
                                            className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all"
                                            style={{ width: `${rubricPercentage}%` }}
                                        />
                                    </div>
                                    {rubric.comments && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                            {rubric.comments}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Submission Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Submission Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-750 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                            {results.status === 'graded' ? 'Graded' : 'Pending Review'}
                        </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-750 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Graded By</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                            {results.gradedByName || 'Staff Member'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
