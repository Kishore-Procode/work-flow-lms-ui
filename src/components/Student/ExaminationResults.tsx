```
import React from 'react';
import {
    Award,
    CheckCircle,
    XCircle,
    AlertCircle,
    Download,
    ArrowLeft
} from 'lucide-react';
import ApiService from '../../services/api';
import { toast } from 'react-hot-toast';

interface ExaminationResultsProps {
    attemptId: string;
    onBack: () => void;
}

export const ExaminationResults: React.FC<ExaminationResultsProps> = ({ attemptId, onBack }) => {
    const [results, setResults] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        loadResults();
    }, [attemptId]);

    const loadResults = async () => {
        try {
            setLoading(true);
            const data = await ApiService.getExaminationAttempt(attemptId);
            console.log('Examination results:', data);
            setResults(data);
        } catch (error: any) {
            console.error('Error loading examination results:', error);
            toast.error('Failed to load examination results');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadCertificate = () => {
        if (results?.certificateUrl) {
            window.open(results.certificateUrl, '_blank');
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
                <p className="text-gray-600 dark:text-gray-400">No results found</p>
            </div>
        );
    }

    const isPassed = results.isPassed;
    const percentage = results.percentage || 0;
    const totalScore = results.totalScore || 0;
    const maxScore = (results.autoGradedMaxScore || 0) + (results.manualGradedMaxScore || 0);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <button
                    onClick={onBack}
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Examinations
                </button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {results.examinationTitle}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {results.studentName}
                </p>
            </div>

            {/* Score Summary */}
            <div className={`rounded - lg p - 6 ${ isPassed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20' } `}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Your Score</p>
                        <p className={`text - 5xl font - bold mt - 2 ${ isPassed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' } `}>
                            {totalScore}/{maxScore}
                        </p>
                        <p className="text-lg font-semibold mt-1">
                            {percentage.toFixed(1)}% • {isPassed ? 'PASSED' : 'FAILED'}
                        </p>
                        {results.gradedAt && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                Graded on: {new Date(results.gradedAt).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                    <Award className={`w - 20 h - 20 opacity - 20 ${ isPassed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' } `} />
                </div>

                {/* Certificate Download */}
                {isPassed && results.certificateUrl && (
                    <div className="border-t border-green-200 dark:border-green-800 mt-6 pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Certificate Available
                                </p>
                                {results.certificateNumber && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        Certificate No: {results.certificateNumber}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={handleDownloadCertificate}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download Certificate
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Score Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Score Breakdown</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Auto-graded Score</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                            {results.autoGradedScore}/{results.autoGradedMaxScore}
                        </p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Manual Grading Score</p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                            {results.manualGradedScore || 0}/{results.manualGradedMaxScore || 0}
                        </p>
                    </div>
                </div>
            </div>

            {/* Questions and Answers */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Question-by-Question Review
                </h2>
                <div className="space-y-6">
                    {results.questions?.map((question: any, index: number) => {
                        const isCorrect = question.isCorrect || question.pointsAwarded > 0;
                        const isManuallyGraded = question.questionType === 'short_answer' || question.questionType === 'long_answer';

                        return (
                            <div
                                key={question.id}
                                className={`border - 2 rounded - lg p - 5 ${
    isCorrect
        ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
        : 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
} `}
                            >
                                {/* Question Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-2">
                                            <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm font-semibold mr-2">
                                                Q{index + 1}
                                            </span>
                                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded text-sm font-semibold">
                                                {question.points} pts
                                            </span>
                                        </div>
                                        <p className="text-gray-900 dark:text-white font-medium">
                                            {question.questionText}
                                        </p>
                                    </div>
                                    <div className="ml-4">
                                        {isCorrect ? (
                                            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                                        ) : (
                                            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                                        )}
                                    </div>
                                </div>

                                {/* Your Answer */}
                                <div className="mb-4">
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Your Answer:
                                    </p>
                                    <div className="bg-white dark:bg-gray-750 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                                        <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                                            {question.studentAnswer || '(No answer provided)'}
                                        </p>
                                    </div>
                                </div>

                                {/* Correct Answer (show if incorrect and not manually graded) */}
                                {!isCorrect && !isManuallyGraded && question.correctAnswer && (
                                    <div className="mb-4">
                                        <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">
                                            Correct Answer:
                                        </p>
                                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-700">
                                            <p className="text-green-900 dark:text-green-100 whitespace-pre-wrap">
                                                {Array.isArray(question.correctAnswer)
                                                    ? question.correctAnswer.join(', ')
                                                    : question.correctAnswer}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Feedback (for manually graded questions) */}
                                {isManuallyGraded && question.feedback && (
                                    <div className="mb-4">
                                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                                            Staff Feedback:
                                        </p>
                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                                            <p className="text-blue-900 dark:text-blue-100 whitespace-pre-wrap">
                                                {question.feedback}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Score */}
                                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Points Awarded:
                                    </span>
                                    <span className={`text - lg font - bold ${ isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' } `}>
                                        {question.pointsAwarded || 0} / {question.points}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Message for Failed */}
            {!isPassed && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                    <div className="flex items-start">
                        <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 mr-3 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                                Unfortunately, you did not pass this examination
                            </p>
                            <p className="text-sm text-red-700 dark:text-red-400">
                                Required: {results.passingScore || 50}% • Your Score: {percentage.toFixed(1)}%
                            </p>
                            <p className="text-sm text-red-700 dark:text-red-400 mt-2">
                                Note: Examinations typically allow only one attempt. Please contact your instructor for guidance.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
