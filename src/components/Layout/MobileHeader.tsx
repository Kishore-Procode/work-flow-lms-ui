import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import ProfileDropdown from './ProfileDropdown';

interface MobileHeaderProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
  currentPage: string;
  onNavigate?: (route: string) => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuToggle, isMenuOpen, currentPage, onNavigate }) => {
  const { user } = useAuth();

  const getPageTitle = (page: string) => {
    const titles: Record<string, string> = {
      'dashboard': 'Dashboard',
      'colleges': 'Colleges',
      'users': 'Users',
      'content-management': 'Content',
      'invitations': 'Invitations',
      'my-enrollments': 'My Courses',
      'settings': 'Settings'
    };
    return titles[page] || 'Student-ACT LMS';
  };



  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 responsive-container flex items-center justify-between sticky top-0 z-50">
        {/* Left side - Menu button and title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onMenuToggle}
            className="mobile-header-button text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <h1 className="responsive-text-sm md:responsive-text-md font-semibold text-gray-900 dark:text-white truncate">
            {getPageTitle(currentPage)}
          </h1>
        </div>

        {/* Right side - User menu */}
        <div className="flex items-center space-x-2">
          <ProfileDropdown onNavigate={onNavigate} />
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={onMenuToggle}
        />
      )}
    </>
  );
};

export default MobileHeader;
