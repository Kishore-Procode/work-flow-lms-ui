import React from 'react';
import { Play, FileText, Award, ChevronRight, TrendingUp, BookOpen, RefreshCw } from 'lucide-react';
import { useEnrolledSubjects } from '../../../hooks/api/useStudentEnrollment';
import { useAuth } from '../../../hooks/useAuth';
import { router } from '../../../utils/router';

interface MobileDashboardProps {
    onNavigate: (tab: string) => void;
}

const MobileDashboard: React.FC<MobileDashboardProps> = ({ onNavigate }) => {
    const { user } = useAuth();

    // Use same hook as desktop
    const { data: enrolledData, isLoading, refetch, isRefetching } = useEnrolledSubjects();

    const enrollments = enrolledData?.enrollments || [];
    const totalCourses = enrollments.length;
    const avgProgress = enrollments.length > 0
        ? enrollments.reduce((sum: number, e: any) => sum + (e.progressPercentage || 0), 0) / enrollments.length
        : 0;

    // Find last accessed course
    const lastCourse = enrollments[0];

    // Get time of day greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const handleCourseClick = (subjectId: string) => {
        // Navigate to course player using proper route
        router.navigateTo(`course-player/${subjectId}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-700 dark:from-gray-900 dark:to-gray-800">
            {/* Header */}
            <div className="pt-12 px-5 pb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-blue-100 dark:text-gray-400 text-sm">{getGreeting()}</p>
                        <h1 className="text-white text-2xl font-bold mt-1">{user?.name?.split(' ')[0] || 'Student'}</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => refetch()}
                            className={`w-10 h-10 bg-white/20 rounded-full flex items-center justify-center ${isRefetching ? 'animate-spin' : ''}`}
                        >
                            <RefreshCw className="w-5 h-5 text-white" />
                        </button>
                        <div
                            onClick={() => onNavigate('profile')}
                            className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                        >
                            <span className="text-white text-lg font-bold">{user?.name?.charAt(0) || 'S'}</span>
                        </div>
                    </div>
                </div>

                {/* Progress Ring */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 flex items-center">
                    <div className="relative w-20 h-20 mr-5">
                        <svg className="w-20 h-20 transform -rotate-90">
                            <circle
                                cx="40"
                                cy="40"
                                r="35"
                                stroke="rgba(255,255,255,0.2)"
                                strokeWidth="8"
                                fill="none"
                            />
                            <circle
                                cx="40"
                                cy="40"
                                r="35"
                                stroke="white"
                                strokeWidth="8"
                                fill="none"
                                strokeDasharray={`${avgProgress * 2.2} 220`}
                                strokeLinecap="round"
                                className="transition-all duration-1000"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white text-lg font-bold">{avgProgress.toFixed(0)}%</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-white font-semibold text-lg">Overall Progress</p>
                        <p className="text-blue-100 dark:text-gray-400 text-sm mt-1">
                            {totalCourses} course{totalCourses !== 1 ? 's' : ''} enrolled
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-t-3xl min-h-[60vh] p-5 -mt-2">
                {/* Continue Learning */}
                {lastCourse && (
                    <div className="mb-6">
                        <h2 className="text-gray-900 dark:text-white font-semibold text-lg mb-3">Continue Learning</h2>
                        <div
                            onClick={() => handleCourseClick(lastCourse.subjectId)}
                            className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 active:scale-[0.98] transition-transform cursor-pointer"
                        >
                            <div className="flex items-center">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
                                    <BookOpen className="w-7 h-7 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                                        {lastCourse.subjectName}
                                    </h3>
                                    <div className="flex items-center mt-1">
                                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mr-3">
                                            <div
                                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                                style={{ width: `${lastCourse.progressPercentage || 0}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-gray-500">{(lastCourse.progressPercentage || 0).toFixed(0)}%</span>
                                    </div>
                                </div>
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center ml-3">
                                    <Play className="w-5 h-5 text-blue-600 dark:text-blue-400 ml-0.5" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="mb-6">
                    <h2 className="text-gray-900 dark:text-white font-semibold text-lg mb-3">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <div
                            onClick={() => onNavigate('my-enrollments')}
                            className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 active:scale-[0.98] transition-transform cursor-pointer"
                        >
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-3">
                                <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <p className="font-medium text-gray-900 dark:text-white">My Courses</p>
                            <p className="text-xs text-gray-500 mt-0.5">{totalCourses} enrolled</p>
                        </div>

                        <div
                            onClick={() => onNavigate('student-assignments')}
                            className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 active:scale-[0.98] transition-transform cursor-pointer"
                        >
                            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-3">
                                <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <p className="font-medium text-gray-900 dark:text-white">Assignments</p>
                            <p className="text-xs text-gray-500 mt-0.5">View pending</p>
                        </div>

                        <div
                            onClick={() => onNavigate('student-examinations')}
                            className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 active:scale-[0.98] transition-transform cursor-pointer"
                        >
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-3">
                                <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <p className="font-medium text-gray-900 dark:text-white">Examinations</p>
                            <p className="text-xs text-gray-500 mt-0.5">View all exams</p>
                        </div>

                        <div
                            onClick={() => onNavigate('profile')}
                            className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 active:scale-[0.98] transition-transform cursor-pointer"
                        >
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-3">
                                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="font-medium text-gray-900 dark:text-white">My Progress</p>
                            <p className="text-xs text-gray-500 mt-0.5">View stats</p>
                        </div>
                    </div>
                </div>

                {/* Recent Courses */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-gray-900 dark:text-white font-semibold text-lg">Recent Courses</h2>
                        <button
                            onClick={() => onNavigate('my-enrollments')}
                            className="text-blue-600 dark:text-blue-400 text-sm font-medium"
                        >
                            See All
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 animate-pulse">
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl mr-4" />
                                        <div className="flex-1">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : enrollments.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center">
                            <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">No courses enrolled yet</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Contact your institution to get enrolled</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {enrollments.slice(0, 3).map((course: any) => (
                                <div
                                    key={course.subjectId || course.enrollmentId}
                                    onClick={() => handleCourseClick(course.subjectId)}
                                    className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 active:scale-[0.98] transition-transform cursor-pointer"
                                >
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
                                            <BookOpen className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">
                                                {course.subjectName}
                                            </h3>
                                            <div className="flex items-center mt-1">
                                                <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mr-2">
                                                    <div
                                                        className="h-full bg-blue-500 rounded-full"
                                                        style={{ width: `${course.progressPercentage || 0}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-500">{(course.progressPercentage || 0).toFixed(0)}%</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-400 ml-2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MobileDashboard;
