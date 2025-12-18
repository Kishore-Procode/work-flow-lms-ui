import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  GraduationCap,
  Users,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Building,
  Calendar,
  User,
  Settings,
  Eye,
  UserCheck,
  ChevronsDown,
  ChevronsUp,
  Info
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ApiService } from '../../services/api';
import { useToast } from '../UI/Toast';

interface Course {
  id: string;
  name: string;
  code: string;
  type: string;
  durationYears?: number; // Made optional since we're removing it
  collegeId: string;
  departmentId?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AcademicYear {
  id: string;
  courseId: string;
  yearNumber: number;
  yearName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Section {
  id: string;
  name: string;
  courseId: string;
  departmentId: string;
  academicYearId: string;
  classInChargeId?: string;
  maxStudents: number;
  currentStudents: number;
  status: 'active' | 'inactive' | 'archived';
  academicSession?: string;
  createdAt: string;
  updatedAt: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
  collegeId: string;
  hodId?: string;
  hodName?: string;
}

interface AcademicStructureManagementProps {
  onNavigate?: (tab: string) => void;
  mode?: 'full' | 'hod-sections-only'; // New prop for HOD restricted access
}

const AcademicStructureManagement: React.FC<AcademicStructureManagementProps> = ({ 
  onNavigate,
  mode = 'full'
}) => {
  const { user } = useAuth();
  const isHODSectionsMode = mode === 'hod-sections-only' || user?.role === 'hod';
  const [courses, setCourses] = useState<Course[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // State for expanded nodes at each level
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
  const [expandedCourseTypes, setExpandedCourseTypes] = useState<Set<string>>(new Set());
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());

  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showAcademicYearForm, setShowAcademicYearForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const toast = useToast();

  useEffect(() => {
    loadAcademicStructure();
  }, []);

  const loadAcademicStructure = async () => {
    try {
      setLoading(true);

      console.log('🔍 Loading Academic Structure - User Info:', {
        role: user?.role,
        departmentId: user?.departmentId,
        collegeId: user?.collegeId,
        email: user?.email
      });

      const [coursesData, academicYearsData, sectionsData, departmentsData] = await Promise.all([
        ApiService.getCourses({ collegeId: user?.collegeId }),
        ApiService.getAcademicYears(),
        ApiService.getSections(),
        ApiService.getDepartments({ collegeId: user?.collegeId })
      ]);

      console.log('🔍 Raw API Data:', {
        coursesCount: coursesData?.length,
        academicYearsCount: academicYearsData?.length,
        sectionsCount: sectionsData?.length,
        departmentsCount: departmentsData?.data?.length,
        firstCourse: coursesData?.[0],
        firstDepartment: departmentsData?.data?.[0]
      });

      let filteredCourses = coursesData || [];
      let filteredSections = sectionsData || [];
      let filteredDepartments = departmentsData?.data || [];

      // Apply role-based filtering for HODs
      if (user?.role === 'hod' && user?.departmentId) {
        // HODs should only see courses from their department
        filteredCourses = filteredCourses.filter(
          (course: any) => course.departmentId === user.departmentId
        );

        // HODs should only see sections from their department
        filteredSections = filteredSections.filter(
          (section: any) => section.departmentId === user.departmentId
        );

        // HODs should only see their own department
        filteredDepartments = filteredDepartments.filter(
          (dept: any) => dept.id === user.departmentId
        );
      }

      // Apply role-based filtering for Students
      if (user?.role === 'student' && user?.departmentId) {
        console.log('🔍 Student Academic Structure - User:', {
          role: user.role,
          departmentId: user.departmentId,
          collegeId: user.collegeId
        });
        
        // Students should only see courses from their department
        filteredCourses = filteredCourses.filter(
          (course: any) => course.departmentId === user.departmentId || course.department_id === user.departmentId
        );

        console.log('🔍 Filtered Courses:', filteredCourses);

        // Students should only see sections from their department
        filteredSections = filteredSections.filter(
          (section: any) => section.departmentId === user.departmentId || section.department_id === user.departmentId
        );

        console.log('🔍 Filtered Sections:', filteredSections);

        // Students should only see their own department
        filteredDepartments = filteredDepartments.filter(
          (dept: any) => dept.id === user.departmentId
        );

        console.log('🔍 Filtered Departments:', filteredDepartments);
      }

      setCourses(filteredCourses as any);
      setAcademicYears(academicYearsData as any);
      setSections(filteredSections as any);
      setDepartments(filteredDepartments);
    } catch (error) {
      console.error('Failed to load academic structure:', error);
      toast.error('Failed to load academic structure');
    } finally {
      setLoading(false);
    }
  };

  // Toggle expansion functions for each level
  const toggleDepartmentExpansion = (departmentId: string) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(departmentId)) {
      newExpanded.delete(departmentId);
    } else {
      newExpanded.add(departmentId);
    }
    setExpandedDepartments(newExpanded);
  };

  const toggleCourseTypeExpansion = (key: string) => {
    const newExpanded = new Set(expandedCourseTypes);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedCourseTypes(newExpanded);
  };

  const toggleCourseExpansion = (courseId: string) => {
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId);
    } else {
      newExpanded.add(courseId);
    }
    setExpandedCourses(newExpanded);
  };

  const toggleYearExpansion = (yearId: string) => {
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(yearId)) {
      newExpanded.delete(yearId);
    } else {
      newExpanded.add(yearId);
    }
    setExpandedYears(newExpanded);
  };

  // Expand/Collapse All functionality
  const expandAll = () => {
    // Expand all departments
    const allDepartmentIds = new Set(departments.map(d => d.id));
    setExpandedDepartments(allDepartmentIds);

    // Expand all course types
    const allCourseTypeKeys = new Set<string>();
    departments.forEach(dept => {
      const types = getCourseTypesByDepartment(dept.id);
      types.forEach(type => {
        allCourseTypeKeys.add(`${dept.id}-${type}`);
      });
    });
    setExpandedCourseTypes(allCourseTypeKeys);

    // Expand all courses
    const allCourseIds = new Set(courses.map(c => c.id));
    setExpandedCourses(allCourseIds);

    // Expand all years
    const allYearIds = new Set(academicYears.map(y => y.id));
    setExpandedYears(allYearIds);
  };

  const collapseAll = () => {
    setExpandedDepartments(new Set());
    setExpandedCourseTypes(new Set());
    setExpandedCourses(new Set());
    setExpandedYears(new Set());
  };

  const handleCreateCourse = (department?: Department) => {
    setSelectedCourse(null);
    setSelectedDepartment(department || null);
    setShowCourseForm(true);
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setShowCourseForm(true);
  };

  const handleCreateAcademicYear = (course: Course) => {
    setSelectedCourse(course);
    setShowAcademicYearForm(true);
  };

  const handleCreateSection = (course: Course, year: AcademicYear) => {
    setSelectedCourse(course);
    setSelectedYear(year);
    setSelectedSection(null);
    setShowSectionForm(true);
  };

  const handleEditSection = (section: Section) => {
    setSelectedSection(section);
    setShowSectionForm(true);
  };

  // Helper functions for the new hierarchy
  const getCoursesByDepartment = (departmentId: string) => {
    return courses.filter(course => course.departmentId === departmentId);
  };

  const getCourseTypesByDepartment = (departmentId: string) => {
    const deptCourses = getCoursesByDepartment(departmentId);
    const types = new Set(deptCourses.map(course => course.type));
    return Array.from(types);
  };

  const getCoursesByDepartmentAndType = (departmentId: string, courseType: string) => {
    return courses.filter(course =>
      course.departmentId === departmentId && course.type === courseType
    );
  };

  const getYearsForCourse = (courseId: string) => {
    return academicYears.filter(year => year.courseId === courseId);
  };

  const getSectionsForYear = (yearId: string) => {
    return sections.filter(section => section.academicYearId === yearId);
  };

  const getDepartmentName = (departmentId: string) => {
    const dept = departments.find(d => d.id === departmentId);
    return dept ? dept.name : 'Unknown Department';
  };

  const getCourseTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'undergraduate': 'Undergraduate',
      'postgraduate': 'Postgraduate',
      'diploma': 'Diploma',
      'certificate': 'Certificate',
      'professional': 'Professional'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Structure Management</h1>
          <p className="text-gray-600">Manage departments, courses, years, and sections hierarchy</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={expandAll}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Expand all levels"
          >
            <ChevronsDown className="w-4 h-4" />
            <span>Expand All</span>
          </button>
          <button
            onClick={collapseAll}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Collapse all levels"
          >
            <ChevronsUp className="w-4 h-4" />
            <span>Collapse All</span>
          </button>
        </div>
      </div>

      {/* HOD Info Banner */}
      {isHODSectionsMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">HOD Section Management</h3>
              <p className="text-sm text-blue-700 mt-1">
                You can view the academic structure and manage sections for your department.
                To modify courses or academic years, please contact the Principal.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Academic Structure Tree - New Hierarchy */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="space-y-4">
            {departments.map((department) => {
              const isDeptExpanded = expandedDepartments.has(department.id);
              const deptCourseTypes = getCourseTypesByDepartment(department.id);
              const deptCourses = getCoursesByDepartment(department.id);

              return (
                <div key={department.id} className="border border-gray-200 rounded-lg">
                  {/* Department Header (Level 1) */}
                  <div className="p-4 bg-blue-50 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleDepartmentExpansion(department.id)}
                          className="p-1 hover:bg-blue-100 rounded"
                        >
                          {isDeptExpanded ? (
                            <ChevronDown className="w-5 h-5 text-blue-600" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-blue-600" />
                          )}
                        </button>
                        <Building className="w-6 h-6 text-blue-600" />
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">
                            {department.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {department.code} • {deptCourses.length} Courses
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!isHODSectionsMode && (user?.role === 'admin' || user?.role === 'principal') && (
                          <button
                            onClick={() => handleCreateCourse(department)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                            title="Add Course to this Department"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Course</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Department Content */}
                  {isDeptExpanded && (
                    <div className="p-4 space-y-3">
                      {deptCourseTypes.length > 0 ? (
                        deptCourseTypes.map((courseType) => {
                          const courseTypeKey = `${department.id}-${courseType}`;
                          const isCourseTypeExpanded = expandedCourseTypes.has(courseTypeKey);
                          const typeCourses = getCoursesByDepartmentAndType(department.id, courseType);

                          return (
                            <div key={courseTypeKey} className="ml-6 border-l-2 border-blue-200 pl-4">
                              {/* Course Type Header (Level 2) */}
                              <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <button
                                    onClick={() => toggleCourseTypeExpansion(courseTypeKey)}
                                    className="p-1 hover:bg-indigo-100 rounded"
                                  >
                                    {isCourseTypeExpanded ? (
                                      <ChevronDown className="w-4 h-4 text-indigo-600" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-indigo-600" />
                                    )}
                                  </button>
                                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                                  <span className="font-semibold text-indigo-900">
                                    {getCourseTypeLabel(courseType)}
                                  </span>
                                </div>
                                <span className="text-sm text-indigo-700">
                                  {typeCourses.length} {typeCourses.length === 1 ? 'Course' : 'Courses'}
                                </span>
                              </div>

                              {/* Course Type Content */}
                              {isCourseTypeExpanded && (
                                <div className="mt-3 ml-6 space-y-3">
                                  {typeCourses.map((course) => {
                                    const courseYears = getYearsForCourse(course.id);
                                    const isCourseExpanded = expandedCourses.has(course.id);

                                    return (
                                      <div key={course.id} className="border-l-2 border-indigo-200 pl-4">
                                        {/* Course Header (Level 3) */}
                                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                          <div className="flex items-center space-x-3">
                                            <button
                                              onClick={() => toggleCourseExpansion(course.id)}
                                              className="p-1 hover:bg-blue-100 rounded"
                                            >
                                              {isCourseExpanded ? (
                                                <ChevronDown className="w-4 h-4 text-blue-600" />
                                              ) : (
                                                <ChevronRight className="w-4 h-4 text-blue-600" />
                                              )}
                                            </button>
                                            <BookOpen className="w-4 h-4 text-blue-600" />
                                            <div>
                                              <span className="font-medium text-blue-900">
                                                {course.name} ({course.code})
                                              </span>
                                              {course.description && (
                                                <p className="text-xs text-blue-700">{course.description}</p>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <span className="text-sm text-blue-700">
                                              {courseYears.length} {courseYears.length === 1 ? 'Year' : 'Years'}
                                            </span>
                                            {!isHODSectionsMode && (user?.role === 'admin' || user?.role === 'principal') && (
                                              <>
                                                <button
                                                  onClick={() => handleCreateAcademicYear(course)}
                                                  className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-all"
                                                  title="Add Academic Year"
                                                >
                                                  <Calendar className="w-4 h-4" />
                                                </button>
                                                <button
                                                  onClick={() => handleEditCourse(course)}
                                                  className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-all"
                                                  title="Edit Course"
                                                >
                                                  <Edit className="w-4 h-4" />
                                                </button>
                                              </>
                                            )}
                                          </div>
                                        </div>

                                        {/* Course Content - Academic Years */}
                                        {isCourseExpanded && (
                                          <div className="mt-3 ml-6 space-y-2">
                                            {courseYears.map((year) => {
                                              const yearSections = getSectionsForYear(year.id);
                                              const isYearExpanded = expandedYears.has(year.id);

                                              return (
                                                <div key={year.id} className="border-l-2 border-blue-200 pl-4">
                                                  {/* Academic Year Header (Level 4) */}
                                                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                                    <div className="flex items-center space-x-3">
                                                      <button
                                                        onClick={() => toggleYearExpansion(year.id)}
                                                        className="p-1 hover:bg-green-100 rounded"
                                                      >
                                                        {isYearExpanded ? (
                                                          <ChevronDown className="w-4 h-4 text-green-600" />
                                                        ) : (
                                                          <ChevronRight className="w-4 h-4 text-green-600" />
                                                        )}
                                                      </button>
                                                      <Calendar className="w-4 h-4 text-green-600" />
                                                      <span className="font-medium text-green-900">
                                                        {year.yearName}
                                                      </span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                      <span className="text-sm text-green-700">
                                                        {yearSections.length} {yearSections.length === 1 ? 'Section' : 'Sections'}
                                                      </span>
                                                      {(user?.role === 'admin' || user?.role === 'principal' || user?.role === 'hod') && (
                                                        <button
                                                          onClick={() => handleCreateSection(course, year)}
                                                          className="p-1 text-green-600 hover:bg-green-100 rounded transition-all"
                                                          title="Add Section"
                                                        >
                                                          <Plus className="w-4 h-4" />
                                                        </button>
                                                      )}
                                                    </div>
                                                  </div>

                                                  {/* Sections (Level 5 - Leaf Nodes) */}
                                                  {isYearExpanded && (
                                                    <div className="mt-2 ml-6 space-y-2">
                                                      {yearSections.map((section) => (
                                                        <div key={section.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                          <div className="flex items-center space-x-3">
                                                            <Users className="w-4 h-4 text-gray-600" />
                                                            <div>
                                                              <span className="font-medium text-gray-900">
                                                                Section {section.name}
                                                              </span>
                                                              <p className="text-sm text-gray-600">
                                                                {section.currentStudents}/{section.maxStudents} Students
                                                                {section.academicSession && ` • ${section.academicSession}`}
                                                              </p>
                                                            </div>
                                                          </div>
                                                          <div className="flex items-center space-x-2">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                              section.status === 'active'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                              {section.status}
                                                            </span>
                                                            {(user?.role === 'admin' || user?.role === 'principal' || user?.role === 'hod') && (
                                                              <button
                                                                onClick={() => handleEditSection(section)}
                                                                className="p-1 text-gray-600 hover:bg-gray-200 rounded transition-all"
                                                              >
                                                                <Edit className="w-3 h-3" />
                                                              </button>
                                                            )}
                                                          </div>
                                                        </div>
                                                      ))}
                                                      {yearSections.length === 0 && (
                                                        <div className="text-center py-4 text-gray-500">
                                                          <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                          <p className="text-sm">No sections created yet</p>
                                                        </div>
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })}
                                            {courseYears.length === 0 && (
                                              <div className="text-center py-4 text-gray-500">
                                                <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                <p className="text-sm">No academic years configured</p>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Courses in this Department</h3>
                          <p className="text-gray-600 mb-4">Start by adding a course to this department</p>
                          {(user?.role === 'admin' || user?.role === 'principal') && (
                            <button
                              onClick={() => handleCreateCourse(department)}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Add Course
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {departments.length === 0 && (
              <div className="text-center py-12">
                <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Departments Found</h3>
                <p className="text-gray-600 mb-4">Please create departments first to manage academic structure</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course Form Modal */}
      {showCourseForm && (
        <CourseFormModal
          course={selectedCourse}
          department={selectedDepartment}
          onClose={() => setShowCourseForm(false)}
          onSave={loadAcademicStructure}
        />
      )}

      {/* Section Form Modal */}
      {showSectionForm && (
        <SectionFormModal
          section={selectedSection}
          course={selectedCourse}
          year={selectedYear}
          departments={departments}
          onClose={() => setShowSectionForm(false)}
          onSave={loadAcademicStructure}
        />
      )}

      {/* Academic Year Form Modal */}
      {showAcademicYearForm && (
        <AcademicYearFormModal
          course={selectedCourse}
          onClose={() => setShowAcademicYearForm(false)}
          onSave={loadAcademicStructure}
        />
      )}
    </div>
  );
};

// Course Form Modal Component
interface CourseFormModalProps {
  course: Course | null;
  department?: Department | null;
  onClose: () => void;
  onSave: () => void;
}

const CourseFormModal: React.FC<CourseFormModalProps> = ({ course, department, onClose, onSave }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: course?.name || '',
    code: course?.code || '',
    type: course?.type || 'Undergraduate',
    description: course?.description || '',
    departmentId: course?.departmentId || department?.id || ''
  });
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const toast = useToast();

  // Load departments when component mounts
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoadingDepartments(true);
        // Use the specific method for getting departments by college
        const departmentsData = await ApiService.getDepartmentsByCollege(user?.collegeId || '');
        setDepartments(departmentsData || []);
      } catch (error) {
        console.error('Failed to load departments:', error);
        toast.error('Failed to load departments');
        setDepartments([]); // Set empty array on error
      } finally {
        setLoadingDepartments(false);
      }
    };

    if (user?.collegeId) {
      loadDepartments();
    }
  }, [user?.collegeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name || !formData.code || !formData.type || !user?.collegeId || !formData.departmentId) {
      toast.error('Please fill in all required fields including department selection');
      return;
    }

    setLoading(true);

    try {
      const courseData = {
        ...formData,
        collegeId: user?.collegeId,
        department_id: formData.departmentId
      };

      if (course) {
        await ApiService.updateCourse(course.id, courseData);
        toast.success('Course updated successfully');
      } else {
        await ApiService.createCourse(courseData);
        toast.success('Course created successfully');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save course:', error);
      toast.error('Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {course ? 'Edit Course' : 'Create Course'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Bachelor of Computer Applications"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Code *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="BCA"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="Undergraduate">Undergraduate</option>
                <option value="Postgraduate">Postgraduate</option>
                <option value="Diploma">Diploma</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department *
              </label>
              {loadingDepartments ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                  Loading departments...
                </div>
              ) : department && !course ? (
                // When creating from a department, show department name (disabled)
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                  {department.name} ({department.code})
                  <input type="hidden" value={formData.departmentId} />
                </div>
              ) : (
                <select
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              )}
            </div>



            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Course description..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : (course ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Section Form Modal Component
interface SectionFormModalProps {
  section: Section | null;
  course: Course | null;
  year: AcademicYear | null;
  departments: Department[];
  onClose: () => void;
  onSave: () => void;
}

const SectionFormModal: React.FC<SectionFormModalProps> = ({
  section,
  course,
  year,
  departments,
  onClose,
  onSave
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: section?.name || '',
    departmentId: section?.departmentId || course?.departmentId || '',
    maxStudents: section?.maxStudents || 60,
    academicSession: section?.academicSession || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1).toString().slice(-2)
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Update form data when course changes (for new sections)
  useEffect(() => {
    if (course && !section && course.departmentId) {
      setFormData(prev => ({
        ...prev,
        departmentId: course.departmentId || ''
      }));
    }
  }, [course, section]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const sectionData = {
        ...formData,
        courseId: course?.id,
        academicYearId: year?.id,
        max_students: formData.maxStudents,
        academic_session: formData.academicSession,
        department_id: formData.departmentId
      };

      if (section) {
        await ApiService.updateSection(section.id, sectionData);
        toast.success('Section updated successfully');
      } else {
        await ApiService.createSection(sectionData);
        toast.success('Section created successfully');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save section:', error);
      toast.error('Failed to save section');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {section ? 'Edit Section' : 'Create Section'}
          </h2>

          {course && year && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Course:</strong> {course.name} ({course.code})
              </p>
              <p className="text-sm text-blue-800">
                <strong>Year:</strong> {year.yearName}
              </p>
              {course.departmentId && (
                <p className="text-sm text-blue-800">
                  <strong>Department:</strong> {departments.find(dept => dept.id === course.departmentId)?.name || 'Loading...'}
                  {departments.find(dept => dept.id === course.departmentId)?.code &&
                    ` (${departments.find(dept => dept.id === course.departmentId)?.code})`
                  }
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="A, B, C, etc."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department *
              </label>
              {course && !section ? (
                // When creating a new section, show department from course (disabled)
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                  {departments.find(dept => dept.id === course.departmentId)?.name || 'Department from Course'}
                  {departments.find(dept => dept.id === course.departmentId)?.code &&
                    ` (${departments.find(dept => dept.id === course.departmentId)?.code})`
                  }
                  <input type="hidden" value={formData.departmentId} />
                </div>
              ) : (
                // When editing a section, allow department selection
                <select
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Students *
              </label>
              <input
                type="number"
                value={formData.maxStudents}
                onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                max="100"
                required
              />
            </div>

            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Session *
              </label>
              <input
                type="text"
                value={formData.academicSession}
                onChange={(e) => setFormData({ ...formData, academicSession: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="2024-25"
                required
              />
            </div> */}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : (section ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Academic Year Form Modal Component
interface AcademicYearFormModalProps {
  course: Course | null;
  onClose: () => void;
  onSave: () => void;
}

const AcademicYearFormModal: React.FC<AcademicYearFormModalProps> = ({ course, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    fromYear: new Date().getFullYear().toString(),
    toYear: (new Date().getFullYear() + 4).toString()
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ fromYear: '', toYear: '' });
  const toast = useToast();

  const validateYear = (year: string): string => {
    if (!year) return 'Year is required';
    if (!/^\d{4}$/.test(year)) return 'Year must be exactly 4 digits';

    const yearNum = parseInt(year);
    const currentYear = new Date().getFullYear();

    if (yearNum < 1900 || yearNum > currentYear + 20) {
      return `Year must be between 1900 and ${currentYear + 20}`;
    }

    if (yearNum < currentYear - 5) {
      return 'Cannot create academic years older than 5 years';
    }

    return '';
  };

  const handleYearChange = (field: 'fromYear' | 'toYear', value: string) => {
    // Allow only digits and limit to 4 characters
    const numericValue = value.replace(/\D/g, '').slice(0, 4);

    setFormData(prev => ({ ...prev, [field]: numericValue }));

    // Validate the field
    const error = validateYear(numericValue);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;

    // Validate both fields
    const fromYearError = validateYear(formData.fromYear);
    const toYearError = validateYear(formData.toYear);

    setErrors({ fromYear: fromYearError, toYear: toYearError });

    if (fromYearError || toYearError) {
      toast.error('Please fix the validation errors');
      return;
    }

    const fromYearNum = parseInt(formData.fromYear);
    const toYearNum = parseInt(formData.toYear);

    // Additional validation for year relationship
    if (fromYearNum >= toYearNum) {
      toast.error('From year must be less than to year');
      return;
    }

    setLoading(true);

    try {
      await ApiService.createAcademicYears(course.id, {
        fromYear: formData.fromYear,
        toYear: formData.toYear
      });

      toast.success('Academic year created successfully');
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Failed to create academic year:', error);
      toast.error(error?.response?.data?.message || 'Failed to create academic year');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Add Academic Year for {course?.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Year *
            </label>
            <input
              type="text"
              value={formData.fromYear}
              onChange={(e) => handleYearChange('fromYear', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.fromYear ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., 2024"
              maxLength={4}
              required
            />
            {errors.fromYear && (
              <p className="mt-1 text-sm text-red-600">{errors.fromYear}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Year *
            </label>
            <input
              type="text"
              value={formData.toYear}
              onChange={(e) => handleYearChange('toYear', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.toYear ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., 2028"
              maxLength={4}
              required
            />
            {errors.toYear && (
              <p className="mt-1 text-sm text-red-600">{errors.toYear}</p>
            )}
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700 mb-2">
              <strong>Preview:</strong> Academic year will be created as: <strong>{formData.fromYear} - {formData.toYear}</strong>
            </p>
            <p className="text-xs text-blue-600">
              • Enter 4-digit years only<br/>
              • From year must be less than to year<br/>
              • Cannot create years older than 5 years from current year
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Academic Year'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AcademicStructureManagement;
