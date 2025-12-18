import React, { useState } from 'react';
import { Search, BookOpen, Play } from 'lucide-react';
import { useEnrolledSubjects } from '../../../hooks/api/useStudentEnrollment';
import { useAuth } from '../../../hooks/useAuth';
import { router } from '../../../utils/router';

const MobileCourses: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all');

    // Use same hook as desktop
    const { data: enrolledData, isLoading } = useEnrolledSubjects();

    const allEnrollments = enrolledData?.enrollments || [];

    // Apply filters
    let filteredCourses = allEnrollments;
    if (searchTerm) {
        filteredCourses = filteredCourses.filter((c: any) =>
            (c.actSubjectName || c.subjectName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.actSubjectCode || c.subjectCode || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    if (filter === 'in-progress') {
        filteredCourses = filteredCourses.filter((c: any) => c.status === 'active' || c.status === 'in-progress');
    } else if (filter === 'completed') {
        filteredCourses = filteredCourses.filter((c: any) => c.status === 'completed');
    }

    const handleCourseClick = (subjectId: string) => {
        // Navigate to course player page
        router.navigateTo(`course-player/${subjectId}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 pt-12 px-5 pb-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">My Courses</h1>

                {/* Search */}
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>

                {/* Filter Pills */}
                <div className="flex space-x-2 overflow-x-auto pb-1">
                    {(['all', 'in-progress', 'completed'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${filter === f
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                }`}
                        >
                            {f === 'all' ? 'All' : f === 'in-progress' ? 'In Progress' : 'Completed'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Course List */}
            <div className="p-5 space-y-3 pb-24">
                {isLoading ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 animate-pulse">
                            <div className="flex items-center">
                                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl mr-4" />
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
                                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : filteredCourses.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
                        <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No courses found</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {searchTerm ? 'Try a different search term' : 'Enroll in courses to get started'}
                        </p>
                    </div>
                ) : (
                    filteredCourses.map((course: any) => {
                        const progress = course.progressPercentage || 0;
                        const isCompleted = course.status === 'completed';
                        return (
                            <div
                                key={course.subjectId || course.enrollmentId}
                                onClick={() => handleCourseClick(course.subjectId)}
                                className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 active:scale-[0.98] transition-transform cursor-pointer"
                            >
                                <div className="flex items-center">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                                        <BookOpen className="w-8 h-8 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 mb-1">
                                            {course.actSubjectName || course.subjectName}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                            {(course.actSubjectCode || course.subjectCode) && <span className="mr-2">{course.actSubjectCode || course.subjectCode}</span>}
                                            {isCompleted
                                                ? '✓ Completed'
                                                : progress > 0
                                                    ? 'In Progress'
                                                    : 'Not Started'}
                                        </p>
                                        <div className="flex items-center">
                                            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mr-2">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${isCompleted
                                                        ? 'bg-green-500'
                                                        : 'bg-blue-500'
                                                        }`}
                                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                {progress.toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="ml-3">
                                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                            <Play className="w-5 h-5 text-blue-600 dark:text-blue-400 ml-0.5" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default MobileCourses;
