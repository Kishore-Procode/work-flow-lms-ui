import React, { useState, useEffect } from 'react';
import MobileBottomNav from './MobileBottomNav';
import MobileDashboard from './pages/MobileDashboard';
import MobileCourses from './pages/MobileCourses';
import MobileAssignments from './pages/MobileAssignments';
import MobileExams from './pages/MobileExams';
import MobileProfile from './pages/MobileProfile';
import { router } from '../../utils/router';

const MobileStudentApp: React.FC = () => {
    const [activeTab, setActiveTab] = useState('dashboard');

    // Sync with router
    useEffect(() => {
        const currentRoute = router.getCurrentRoute();
        setActiveTab(currentRoute);

        const unsubscribe = router.onRouteChange((route) => {
            setActiveTab(route);
        });

        return unsubscribe;
    }, []);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        router.navigateTo(tab);
    };

    const renderPage = () => {
        switch (activeTab) {
            case 'dashboard':
                return <MobileDashboard onNavigate={handleTabChange} />;
            case 'my-enrollments':
                return <MobileCourses />;
            case 'student-assignments':
                return <MobileAssignments />;
            case 'student-examinations':
                return <MobileExams />;
            case 'profile':
                return <MobileProfile />;
            default:
                // Handle course player and other routes
                if (activeTab.startsWith('course-player/') || activeTab.startsWith('play-session/')) {
                    const params = router.getRouteParams(activeTab);
                    if (params.subjectId) {
                        const CoursePlayerPage = React.lazy(() => import('../../pages/CoursePlayerPage'));
                        return (
                            <React.Suspense fallback={
                                <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading course...</p>
                                    </div>
                                </div>
                            }>
                                <CoursePlayerPage subjectId={params.subjectId} />
                            </React.Suspense>
                        );
                    }
                }
                return <MobileDashboard onNavigate={handleTabChange} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Page Content */}
            <main className="min-h-screen">
                {renderPage()}
            </main>

            {/* Bottom Navigation */}
            <MobileBottomNav
                activeTab={activeTab}
                onTabChange={handleTabChange}
            />
        </div>
    );
};

export default MobileStudentApp;
