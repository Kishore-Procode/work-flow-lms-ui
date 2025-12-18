/**
 * Semester Info Card Component
 * 
 * Displays current semester information for the student.
 * 
 * @author Student-ACT LMS Team
 * @version 1.0.0
 */

import React from 'react';
import { Calendar, GraduationCap, Building2, BookOpen } from 'lucide-react';
import type { CurrentSemesterResponse } from '../../types/studentEnrollment';
import { StudentEnrollmentService } from '../../services/studentEnrollmentService';

interface SemesterInfoCardProps {
  semesterInfo: CurrentSemesterResponse;
}

const SemesterInfoCard: React.FC<SemesterInfoCardProps> = ({ semesterInfo }) => {
  const {
    studentName,
    courseType,
    courseName,
    departmentName,
    batchYear,
    currentSemester,
    academicYearName,
    semesterStartDate,
    semesterEndDate,
  } = semesterInfo;

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">Welcome, {studentName}!</h2>
          <p className="text-blue-100">
            You are currently in {StudentEnrollmentService.getSemesterOrdinal(currentSemester)} Semester
          </p>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
          <div className="text-3xl font-bold">{currentSemester}</div>
          <div className="text-xs text-blue-100">Semester</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Course Info */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="w-5 h-5 text-blue-100" />
            <span className="text-sm text-blue-100">Course</span>
          </div>
          <div className="font-semibold">{courseName}</div>
          <div className="text-sm text-blue-100">{courseType}</div>
        </div>

        {/* Department Info */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-blue-100" />
            <span className="text-sm text-blue-100">Department</span>
          </div>
          <div className="font-semibold">{departmentName}</div>
        </div>

        {/* Academic Year */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-100" />
            <span className="text-sm text-blue-100">Academic Year</span>
          </div>
          <div className="font-semibold">{academicYearName}</div>
          <div className="text-sm text-blue-100">Batch {batchYear}</div>
        </div>

        {/* Semester Duration */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-blue-100" />
            <span className="text-sm text-blue-100">Semester Period</span>
          </div>
          <div className="text-sm font-medium">
            {StudentEnrollmentService.formatDate(semesterStartDate)}
          </div>
          <div className="text-sm text-blue-100">
            to {StudentEnrollmentService.formatDate(semesterEndDate)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SemesterInfoCard;

