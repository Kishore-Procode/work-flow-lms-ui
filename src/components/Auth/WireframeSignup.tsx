import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { ApiService } from '../../services/api';
import { useToast } from '../UI/Toast';

interface WireframeSignupProps {
  onClose: () => void;
  onSuccess: () => void;
  onCollegeRegistration?: () => void;
}

interface SimpleCollege {
  id: string;
  name: string;
}

interface SimpleDepartment {
  id: string;
  name: string;
  collegeId: string;
}

interface SimpleCourse {
  id: string;
  name: string;
  departmentId: string;
}

interface SimpleSection {
  id: string;
  name: string;
  courseId: string;
}

const WireframeSignup: React.FC<WireframeSignupProps> = ({ onClose, onSuccess, onCollegeRegistration }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<'student' | 'faculty'>('student');
  const [showPassword, setShowPassword] = useState(false);
  // Mutation for creating registration request
  const createRegistrationMutation = useMutation({
    mutationFn: (data: any) => ApiService.createRegistrationRequest(data),
    onSuccess: () => {
      toast.success('Registration submitted successfully! You will be notified once approved.');
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Registration failed:', error);
      toast.error('Registration failed. Please try again.');
    },
  });

  const loading = createRegistrationMutation.isPending;
  const [loadingData, setLoadingData] = useState(true);
  const toast = useToast();

  // Form data state
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    firstName: '',
    lastName: '',
    registrationNumber: '',
    phoneNumber: '',
    emailAddress: '',
    password: '',
    
    // Step 2: Academic Information
    collegeId: '',
    departmentId: '',
    courseId: '',
    yearOfStudy: '',
    sectionId: '',
  });

  // Dropdown data
  const [colleges, setColleges] = useState<SimpleCollege[]>([]);
  const [departments, setDepartments] = useState<SimpleDepartment[]>([]);
  const [courses, setCourses] = useState<SimpleCourse[]>([]);
  const [sections, setSections] = useState<SimpleSection[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<SimpleDepartment[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<SimpleCourse[]>([]);
  const [filteredSections, setFilteredSections] = useState<SimpleSection[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // Filter departments when college changes
    if (formData.collegeId) {
      const collegeDepts = departments.filter(dept => dept.collegeId === formData.collegeId);
      setFilteredDepartments(collegeDepts);
      // Reset dependent fields
      setFormData(prev => ({ ...prev, departmentId: '', courseId: '', sectionId: '' }));
    }
  }, [formData.collegeId, departments]);

  useEffect(() => {
    // Filter courses when department changes
    if (formData.departmentId) {
      const deptCourses = courses.filter(course => course.departmentId === formData.departmentId);
      setFilteredCourses(deptCourses);
      // Reset dependent fields
      setFormData(prev => ({ ...prev, courseId: '', sectionId: '' }));
    }
  }, [formData.departmentId, courses]);

  useEffect(() => {
    // Filter sections when course changes
    if (formData.courseId) {
      const courseSections = sections.filter(section => section.courseId === formData.courseId);
      setFilteredSections(courseSections);
      // Reset section
      setFormData(prev => ({ ...prev, sectionId: '' }));
    }
  }, [formData.courseId, sections]);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      const [collegesData, departmentsData, coursesData, sectionsData] = await Promise.all([
        ApiService.getCollegesPublic(),
        ApiService.getDepartmentsByCollegePublic('all'),
        ApiService.getCourses(),
        ApiService.getSections(),
      ]);

      setColleges(collegesData || []);
      setDepartments(departmentsData || []);
      setCourses(coursesData || []);
      setSections((sectionsData || []).map((section: any) => ({
        id: section.id,
        name: section.name,
        courseId: section.course_id
      })));
    } catch (error) {
      console.error('Failed to load initial data:', error);
      toast.error('Failed to load form data. Please refresh the page.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    const { firstName, lastName, registrationNumber, phoneNumber, emailAddress, password } = formData;
    return firstName && lastName && registrationNumber && phoneNumber && emailAddress && password;
  };

  const validateStep2 = () => {
    const { collegeId, departmentId, courseId, yearOfStudy, sectionId } = formData;
    return collegeId && departmentId && courseId && yearOfStudy && sectionId;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 1) {
      toast.error('Please fill in all required fields');
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep2()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const registrationData = {
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.emailAddress,
      phone: formData.phoneNumber,
      password: formData.password,
      role: selectedRole,
      collegeId: formData.collegeId,
      departmentId: formData.departmentId,
      courseId: formData.courseId,
      sectionId: formData.sectionId,
      rollNumber: formData.registrationNumber,
      yearOfStudy: formData.yearOfStudy,
    };

    createRegistrationMutation.mutate(registrationData);
  };

  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-700">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex h-full">
          {/* Left Side - Form */}
          <div className="flex-1 p-8 overflow-y-auto">
            {/* College Logo/Crest */}
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🌳</span>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Student-ACT LMS</h1>
                <p className="text-gray-600 text-sm">Join the learning platform</p>
              </div>
            </div>

            {/* Role Selection Tabs */}
            <div className="flex mb-8">
              <button
                type="button"
                onClick={() => setSelectedRole('student')}
                className={`px-6 py-3 rounded-l-lg font-medium transition-colors ${
                  selectedRole === 'student'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Signup as Student
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('faculty')}
                className={`px-6 py-3 rounded-r-lg font-medium transition-colors ${
                  selectedRole === 'faculty'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Signup as Faculty
              </button>
            </div>

            {/* Form Title */}
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Sign up</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  {/* First Name and Last Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="First Name"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Last Name"
                        required
                      />
                    </div>
                  </div>

                  {/* Registration Number and Phone Number */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        value={formData.registrationNumber}
                        onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Registration Number"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Phone Number"
                        required
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div>
                    <input
                      type="email"
                      value={formData.emailAddress}
                      onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Email Address"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Go to Next Button */}
                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Go to Next
                  </button>
                </div>
              )}

              {/* Step 2: Academic Information */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  {/* College */}
                  <div>
                    <select
                      value={formData.collegeId}
                      onChange={(e) => handleInputChange('collegeId', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                      required
                    >
                      <option value="">College</option>
                      {colleges.map((college) => (
                        <option key={college.id} value={college.id}>
                          {college.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Department */}
                  <div>
                    <select
                      value={formData.departmentId}
                      onChange={(e) => handleInputChange('departmentId', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                      required
                      disabled={!formData.collegeId}
                    >
                      <option value="">Department</option>
                      {filteredDepartments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Course */}
                  <div>
                    <select
                      value={formData.courseId}
                      onChange={(e) => handleInputChange('courseId', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                      required
                      disabled={!formData.departmentId}
                    >
                      <option value="">Course</option>
                      {filteredCourses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Year of Study and Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <select
                        value={formData.yearOfStudy}
                        onChange={(e) => handleInputChange('yearOfStudy', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                        required
                      >
                        <option value="">Year of Study</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>
                    <div>
                      <select
                        value={formData.sectionId}
                        onChange={(e) => handleInputChange('sectionId', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                        required
                        disabled={!formData.courseId}
                      >
                        <option value="">Section</option>
                        {filteredSections.map((section) => (
                          <option key={section.id} value={section.id}>
                            {section.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      Go back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                  </div>
                </div>
              )}

              {/* Login Link */}
              <div className="text-center">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Login
                  </button>
                </p>
              </div>
            </form>
          </div>

          {/* Right Side - Promotional Content */}
          <div className="flex-1 bg-gradient-to-br from-blue-50 to-blue-50 p-8 flex flex-col justify-center items-center relative overflow-hidden">
            {/* Background Illustration Elements */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-20 h-20 bg-blue-400 rounded-full"></div>
              <div className="absolute top-32 right-16 w-16 h-16 bg-blue-400 rounded-full"></div>
              <div className="absolute bottom-20 left-20 w-12 h-12 bg-yellow-400 rounded-full"></div>
            </div>

            <div className="text-center z-10">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                One Student<br />One Tree
              </h2>
              <p className="text-gray-700 mb-8 text-lg">
                An initiative for each student to<br />plant a tree and nurture its growth.
              </p>

              {/* Illustration */}
              <div className="mb-8 relative">
                <div className="w-64 h-48 mx-auto bg-gradient-to-b from-blue-200 to-blue-400 rounded-3xl flex items-end justify-center p-8 relative overflow-hidden">
                  {/* Person illustration */}
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                    <div className="w-16 h-16 bg-orange-400 rounded-full mb-2"></div>
                    <div className="w-20 h-24 bg-red-400 rounded-t-full"></div>
                  </div>
                  
                  {/* Trees */}
                  <div className="absolute bottom-4 left-8 w-4 h-16 bg-blue-600 rounded-t-full"></div>
                  <div className="absolute bottom-4 right-8 w-4 h-20 bg-blue-700 rounded-t-full"></div>
                  <div className="absolute bottom-4 left-20 w-3 h-12 bg-blue-500 rounded-t-full"></div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6">
                <p className="text-gray-700 mb-4">
                  Is your college not registered yet? Click here to submit your institution details.
                </p>
                <button
                  onClick={() => {
                    onCollegeRegistration?.();
                    onClose();
                  }}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Register with us
                </button>
              </div>
            </div>

            {/* Footer Links */}
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <div className="flex justify-center space-x-4 text-sm text-gray-500">
                <span>© 2024 Student - ACT</span>
                <span>•</span>
                <span>Need Help? Contact us</span>
                <span>•</span>
                <span>About the Initiative</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WireframeSignup;
