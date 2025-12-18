/**
 * Enrollment Stats Cards Component
 * 
 * Displays enrollment statistics in card format.
 * 
 * @author Student-ACT LMS Team
 * @version 1.0.0
 */

import React from 'react';
import { BookOpen, CheckCircle, Activity, Award, TrendingUp, Target } from 'lucide-react';
import type { EnrollmentStats } from '../../types/studentEnrollment';

interface EnrollmentStatsCardsProps {
  stats: EnrollmentStats;
  isLoading?: boolean;
}

const EnrollmentStatsCards: React.FC<EnrollmentStatsCardsProps> = ({ stats, isLoading }) => {
  const statCards = [
    {
      title: 'Total Subjects',
      value: stats.totalSubjects,
      icon: BookOpen,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Active Subjects',
      value: stats.activeSubjects,
      icon: Activity,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Completed',
      value: stats.completedSubjects,
      icon: CheckCircle,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200',
    },
    {
      title: 'Average Progress',
      value: `${stats.averageProgress}%`,
      icon: TrendingUp,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200',
    },
    {
      title: 'Total Credits',
      value: stats.totalCredits,
      icon: Target,
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      borderColor: 'border-indigo-200',
    },
    {
      title: 'Earned Credits',
      value: stats.earnedCredits,
      icon: Award,
      color: 'pink',
      bgColor: 'bg-pink-50',
      iconColor: 'text-pink-600',
      borderColor: 'border-pink-200',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse"
          >
            <div className="h-10 w-10 bg-gray-200 rounded-lg mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`bg-white rounded-lg shadow-sm border ${card.borderColor} p-4 hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`${card.bgColor} p-2 rounded-lg`}>
                <Icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-1">{card.title}</div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
          </div>
        );
      })}
    </div>
  );
};

export default EnrollmentStatsCards;

