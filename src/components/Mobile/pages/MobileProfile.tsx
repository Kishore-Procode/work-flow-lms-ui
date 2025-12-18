import React, { useState, useEffect } from 'react';
import { BookOpen, Award, Settings, LogOut, ChevronRight, TrendingUp, Moon, Sun, ArrowUp, Bell, Shield, HelpCircle } from 'lucide-react';
import { useEnrolledSubjects } from '../../../hooks/api/useStudentEnrollment';
import { useAuth } from '../../../hooks/useAuth';

const MobileProfile: React.FC = () => {
    const { user, logout } = useAuth();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Check for dark mode on mount
    useEffect(() => {
        const isDark = document.documentElement.classList.contains('dark');
        setIsDarkMode(isDark);
    }, []);

    // Toggle dark mode
    const toggleDarkMode = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        if (newMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    // Scroll to top functionality
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 200);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Use same hook as desktop
    const { data: enrolledData } = useEnrolledSubjects();

    const enrollments = enrolledData?.enrollments || [];
    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter((e: any) => e.status === 'completed').length;
    const avgProgress = enrollments.length > 0
        ? enrollments.reduce((sum: number, e: any) => sum + (e.progressPercentage || 0), 0) / enrollments.length
        : 0;
    const inProgressCourses = enrollments.filter((e: any) => e.status === 'active').length;

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    if (showSettings) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
                {/* Settings Header */}
                <div className="bg-white dark:bg-gray-800 pt-12 px-5 pb-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10">
                    <div className="flex items-center">
                        <button
                            onClick={() => setShowSettings(false)}
                            className="mr-4 w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400 rotate-180" />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
                    </div>
                </div>

                {/* Settings Content */}
                <div className="p-5 space-y-4">
                    {/* Appearance */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="font-semibold text-gray-900 dark:text-white">Appearance</h2>
                        </div>
                        <button
                            onClick={toggleDarkMode}
                            className="w-full flex items-center px-5 py-4"
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${isDarkMode ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-yellow-100'
                                }`}>
                                {isDarkMode ? (
                                    <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                ) : (
                                    <Sun className="w-5 h-5 text-yellow-600" />
                                )}
                            </div>
                            <span className="flex-1 text-left font-medium text-gray-900 dark:text-white">
                                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                            </span>
                            <div className={`w-12 h-6 rounded-full relative transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-300'
                                }`}>
                                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0.5'
                                    }`} />
                            </div>
                        </button>
                    </div>

                    {/* Notifications */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="font-semibold text-gray-900 dark:text-white">Notifications</h2>
                        </div>
                        <button className="w-full flex items-center px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mr-4">
                                <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="flex-1 text-left font-medium text-gray-900 dark:text-white">Push Notifications</span>
                            <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                                <div className="absolute top-0.5 translate-x-6 w-5 h-5 bg-white rounded-full shadow" />
                            </div>
                        </button>
                        <button className="w-full flex items-center px-5 py-4">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mr-4">
                                <Bell className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="flex-1 text-left font-medium text-gray-900 dark:text-white">Email Notifications</span>
                            <div className="w-12 h-6 bg-green-600 rounded-full relative">
                                <div className="absolute top-0.5 translate-x-6 w-5 h-5 bg-white rounded-full shadow" />
                            </div>
                        </button>
                    </div>

                    {/* Privacy & Security */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="font-semibold text-gray-900 dark:text-white">Privacy & Security</h2>
                        </div>
                        <button className="w-full flex items-center px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mr-4">
                                <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="flex-1 text-left font-medium text-gray-900 dark:text-white">Change Password</span>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </button>
                        <button className="w-full flex items-center px-5 py-4">
                            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mr-4">
                                <HelpCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <span className="flex-1 text-left font-medium text-gray-900 dark:text-white">Help & Support</span>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* App Info */}
                    <div className="text-center py-4">
                        <p className="text-gray-400 dark:text-gray-500 text-sm">Student-ACT LMS v2.0</p>
                        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">© 2024 All rights reserved</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
            {/* Header with Avatar */}
            <div className="bg-gradient-to-b from-blue-600 to-blue-700 dark:from-gray-800 dark:to-gray-900 pt-12 px-5 pb-24">
                <h1 className="text-xl font-bold text-white mb-6">Profile</h1>

                <div className="flex flex-col items-center">
                    <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-4 ring-4 ring-white/30">
                        <span className="text-4xl font-bold text-white">{user?.name?.charAt(0) || 'S'}</span>
                    </div>
                    <h2 className="text-xl font-bold text-white">{user?.name || 'Student'}</h2>
                    <p className="text-blue-100 dark:text-gray-400 mt-1">{user?.email}</p>
                    {(user as any)?.department_name && (
                        <p className="text-blue-200 dark:text-gray-500 text-sm mt-1">{(user as any).department_name}</p>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="px-5 -mt-16">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700">
                    <div className="grid grid-cols-4 gap-2">
                        <div className="text-center">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{totalCourses}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">Total</p>
                        </div>
                        <div className="text-center">
                            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <TrendingUp className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{inProgressCourses}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">In Progress</p>
                        </div>
                        <div className="text-center">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{completedCourses}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">Complete</p>
                        </div>
                        <div className="text-center">
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{avgProgress.toFixed(0)}%</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">Progress</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Menu Items */}
            <div className="px-5 mt-6 space-y-3">
                {/* Quick Theme Toggle */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <button
                        onClick={toggleDarkMode}
                        className="w-full flex items-center px-5 py-4 border-b border-gray-100 dark:border-gray-700"
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${isDarkMode ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-yellow-100'
                            }`}>
                            {isDarkMode ? (
                                <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            ) : (
                                <Sun className="w-5 h-5 text-yellow-600" />
                            )}
                        </div>
                        <span className="flex-1 text-left font-medium text-gray-900 dark:text-white">
                            {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                        </span>
                        <div className={`w-12 h-6 rounded-full relative transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-300'
                            }`}>
                            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0.5'
                                }`} />
                        </div>
                    </button>

                    <button
                        onClick={() => setShowSettings(true)}
                        className="w-full flex items-center px-5 py-4"
                    >
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mr-4">
                            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <span className="flex-1 text-left font-medium text-gray-900 dark:text-white">Settings</span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-5 py-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 active:scale-[0.98] transition-transform"
                >
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mr-4">
                        <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <span className="flex-1 text-left font-medium text-red-600 dark:text-red-400">Log Out</span>
                </button>
            </div>

            {/* App Info */}
            <div className="px-5 py-8 text-center">
                <p className="text-gray-400 dark:text-gray-500 text-sm">Student-ACT LMS v2.0</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">© 2024 All rights reserved</p>
            </div>

            {/* Scroll to Top Button */}
            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-24 right-5 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-40"
                >
                    <ArrowUp className="w-6 h-6" />
                </button>
            )}
        </div>
    );
};

export default MobileProfile;
