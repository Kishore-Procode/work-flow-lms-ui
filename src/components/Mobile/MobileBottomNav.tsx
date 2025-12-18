import React from 'react';
import { Home, BookOpen, FileText, Award, User } from 'lucide-react';

interface MobileBottomNavProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    assignmentsBadge?: number;
    examsBadge?: number;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
    activeTab,
    onTabChange,
    assignmentsBadge = 0,
    examsBadge = 0
}) => {
    const navItems = [
        { id: 'dashboard', label: 'Home', icon: Home },
        { id: 'my-enrollments', label: 'Courses', icon: BookOpen },
        { id: 'student-assignments', label: 'Tasks', icon: FileText, badge: assignmentsBadge },
        { id: 'student-examinations', label: 'Exams', icon: Award, badge: examsBadge },
        { id: 'profile', label: 'Profile', icon: User }
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="flex items-center justify-around h-16 px-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id ||
                        (item.id === 'dashboard' && activeTab === 'dashboard') ||
                        (item.id === 'my-enrollments' && activeTab.startsWith('course-player'));

                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`
                flex flex-col items-center justify-center flex-1 h-full relative py-2
                transition-all duration-200 active:scale-90
                ${isActive
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-500 dark:text-gray-400'
                                }
              `}
                        >
                            <div className="relative">
                                <div className={`
                  p-2 rounded-xl transition-all duration-200
                  ${isActive ? 'bg-blue-100 dark:bg-blue-900/30' : ''}
                `}>
                                    <Icon
                                        className={`w-5 h-5 transition-all ${isActive ? 'scale-110' : ''}`}
                                        strokeWidth={isActive ? 2.5 : 2}
                                    />
                                </div>
                                {item.badge && item.badge > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                                        {item.badge > 9 ? '9+' : item.badge}
                                    </span>
                                )}
                            </div>
                            <span className={`text-[10px] mt-0.5 font-medium transition-all ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default MobileBottomNav;
