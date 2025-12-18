 import React, { useState, useEffect } from 'react';
import {
  EyeIcon,
  EyeSlashIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import CollegeRegistration from './CollegeRegistration';
import ForgotPassword from './ForgotPassword';
import PasswordResetOTP from './PasswordResetOTP';
import ResetPassword from './ResetPassword';
import { ApiService } from '../../services/api';
// import useZoomLevel from './ZoomLevel';

interface LoginProps {
  onLoginSuccess?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDemoPopup, setShowDemoPopup] = useState(false);
  const [showCollegeRegistration, setShowCollegeRegistration] = useState(false);
  const [showAboutPopup, setShowAboutPopup] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<'student' | 'faculty'>('student');

  // Forgot password flow state
  const [forgotPasswordFlow, setForgotPasswordFlow] = useState<'none' | 'email' | 'otp' | 'reset'>(
    'none'
  );
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordOTP, setForgotPasswordOTP] = useState('');
  const [otpVerifiedAt, setOtpVerifiedAt] = useState<number | null>(null);

  // Signup state
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [signupStep, setSignupStep] = useState(1);
  const [signupData, setSignupData] = useState({
    // Basic Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'student', // Add role field

    // Student-specific fields
    registrationNumber: '',
    collegeId: '',
    departmentId: '',
    courseId: '',
    yearOfStudy: '',
    sectionId: '',

    // Faculty-specific fields
    employeeId: '',
    qualification: '',
    experience: '',
  });

  // Faculty role options - Based on database user_role enum
  const facultyRoleOptions = [
    { value: 'staff', label: 'Staff / Faculty Member' },
    { value: 'hod', label: 'Head of Department (HOD)' },
    { value: 'principal', label: 'Principal' },
  ];

  // Search states for dropdowns
  const [searchTerms, setSearchTerms] = useState({
    college: '',
    department: '',
    course: '',
    section: '',
  });

  // Dropdown data for signup
  const [colleges, setColleges] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [filteredSections, setFilteredSections] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  const { login } = useAuth();

  // Load initial data for signup dropdowns
  useEffect(() => {
    if (isSignupMode) {
      loadSignupData();
    }
  }, [isSignupMode]);

 

  // Load departments when college changes (for login screen filtering)
  useEffect(() => {
    const loadDepartmentsByCollege = async () => {
      if (signupData.collegeId) {
        try {
          console.log('Loading departments for college:', signupData.collegeId);
          const collegeDepartments = await ApiService.getDepartmentsByCollegeForLogin(
            signupData.collegeId
          );
          console.log('Departments loaded for college:', collegeDepartments);
          setFilteredDepartments(collegeDepartments || []);

          // Reset dependent fields
          setSignupData(prev => ({
            ...prev,
            departmentId: '',
            courseId: '',
            yearOfStudy: '',
            sectionId: '',
          }));
          setFilteredCourses([]);
          setFilteredSections([]);
        } catch (error) {
          console.error('Failed to load departments for college:', error);
          setFilteredDepartments([]);
        }
      } else {
        setFilteredDepartments([]);
      }
    };

    loadDepartmentsByCollege();
  }, [signupData.collegeId]);

  // Load courses when department changes (for login screen filtering)
  useEffect(() => {
    const loadCoursesByCollegeAndDepartment = async () => {
      if (signupData.collegeId && signupData.departmentId) {
        try {
          console.log(
            'Loading courses for college and department:',
            signupData.collegeId,
            signupData.departmentId
          );
          setLoadingDepartments(true);

          const departmentCourses = await ApiService.getCoursesByCollegeAndDepartment(
            signupData.collegeId,
            signupData.departmentId
          );
          console.log('Courses loaded for college and department:', departmentCourses);

          if (Array.isArray(departmentCourses)) {
            setFilteredCourses(departmentCourses);

            // Reset dependent fields
            setSignupData(prev => ({ ...prev, courseId: '', yearOfStudy: '', sectionId: '' }));
          } else {
            console.warn('Invalid courses response:', departmentCourses);
            setFilteredCourses([]);
          }

          // Reset sections
          setFilteredSections([]);
        } catch (error) {
          console.error('Failed to load courses for college and department:', error);
          setFilteredCourses([]);
          toast.error('Failed to load courses. Please try again.');
        } finally {
          setLoadingDepartments(false);
        }
      } else {
        setFilteredCourses([]);
        setLoadingDepartments(false);
      }
    };

    loadCoursesByCollegeAndDepartment();
  }, [signupData.collegeId, signupData.departmentId]);

  // Load academic years when course changes
  useEffect(() => {
    const loadAcademicYearsByCourse = async () => {
      if (signupData.courseId) {
        try {
          console.log('Loading academic years for course:', signupData.courseId);
          const courseAcademicYears = await ApiService.getAcademicYearsByCourse(
            signupData.courseId
          );
          console.log('Academic years loaded for course:', courseAcademicYears);
          setAcademicYears(courseAcademicYears || []);

          // Reset dependent fields
          setSignupData(prev => ({ ...prev, yearOfStudy: '', sectionId: '' }));
          setFilteredSections([]);
        } catch (error) {
          console.error('Failed to load academic years for course:', error);
          setAcademicYears([]);
        }
      } else {
        setAcademicYears([]);
      }
    };

    loadAcademicYearsByCourse();
  }, [signupData.courseId]);

  // Load sections when course, department and year are selected
  useEffect(() => {
    const loadSectionsByCourseDepYear = async () => {
      if (signupData.courseId && signupData.departmentId && signupData.yearOfStudy) {
        try {
          // Find the academic year ID from the yearOfStudy name
          const selectedAcademicYear = academicYears.find(
            year => year.yearName === signupData.yearOfStudy
          );
          if (!selectedAcademicYear) {
            console.warn('Academic year not found for:', signupData.yearOfStudy);
            setFilteredSections([]);
            return;
          }

          console.log(
            'Loading sections for course, department and year:',
            signupData.courseId,
            signupData.departmentId,
            selectedAcademicYear.id
          );
          const courseSections = await ApiService.getSectionsByCourseDepYear(
            signupData.courseId,
            signupData.departmentId,
            selectedAcademicYear.id
          );
          console.log('Sections loaded for course, department and year:', courseSections);
          setFilteredSections(courseSections || []);

          // Reset section field
          setSignupData(prev => ({ ...prev, sectionId: '' }));
        } catch (error) {
          console.error('Failed to load sections for course, department and year:', error);
          setFilteredSections([]);
        }
      } else {
        setFilteredSections([]);
      }
    };

    loadSectionsByCourseDepYear();
  }, [signupData.courseId, signupData.departmentId, signupData.yearOfStudy, academicYears]);

  // Remember me functionality - load saved credentials on mount
  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = () => {
    try {
      // Check localStorage first (remember me enabled)
      const savedData = localStorage.getItem('osot_remember_me');
      if (savedData) {
        const { email, rememberMe: savedRememberMe, savedAt } = JSON.parse(savedData);

        // Check if saved data is not too old (30 days)
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        if (email && savedRememberMe && savedAt > thirtyDaysAgo) {
          setEmail(email);
          setRememberMe(true);
          return;
        } else if (savedAt <= thirtyDaysAgo) {
          // Clear old data
          localStorage.removeItem('osot_remember_me');
        }
      }

      // Check sessionStorage (remember me disabled)
      const sessionData = sessionStorage.getItem('osot_session_email');
      if (sessionData) {
        setEmail(sessionData);
        setRememberMe(false);
      }
    } catch (error) {
      console.error('Error loading saved credentials:', error);
      // Clear corrupted data
      localStorage.removeItem('osot_remember_me');
      sessionStorage.removeItem('osot_session_email');
    }
  };

  const saveCredentials = (email: string, remember: boolean) => {
    try {
      if (remember) {
        // Save to localStorage for persistent storage
        localStorage.setItem(
          'osot_remember_me',
          JSON.stringify({
            email,
            rememberMe: true,
            savedAt: Date.now(),
          })
        );
        // Clear session storage
        sessionStorage.removeItem('osot_session_email');
      } else {
        // Save to sessionStorage (clears on browser close)
        sessionStorage.setItem('osot_session_email', email);
        // Clear localStorage
        localStorage.removeItem('osot_remember_me');
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
    }
  };

  const clearSavedCredentials = () => {
    try {
      localStorage.removeItem('osot_remember_me');
      sessionStorage.removeItem('osot_session_email');
    } catch (error) {
      console.error('Error clearing credentials:', error);
    }
  };

  const clearSavedCredentialsOnly = () => {
    try {
      localStorage.removeItem('osot_remember_me');
      sessionStorage.removeItem('osot_session_email');
      // Don't clear form fields - only clear localStorage
    } catch (error) {
      console.error('Error clearing credentials:', error);
    }
  };

  const loadSignupData = async () => {
    try {
      setLoadingData(true);
      console.log('Loading signup data...');

      // Load colleges first
      const collegesData = await ApiService.getCollegesPublic();
      console.log('Colleges loaded:', collegesData);
      setColleges(collegesData || []);

      // Load all departments (we'll filter them by course later)
      const departmentsData = await ApiService.getDepartmentsPublic();
      console.log('Departments loaded:', departmentsData);
      setDepartments(departmentsData || []);

      // Load courses (sections and academic years will be loaded dynamically)
      const coursesData = await ApiService.getCourses();
      console.log('Courses loaded:', coursesData);

      // Transform and set courses data with enhanced structure
      const transformedCourses = Array.isArray(coursesData)
        ? coursesData.map((course: any) => ({
            id: course.id,
            name: course.name,
            code: course.code,
            type: course.type,
            departmentId: course.departmentId || course.department_id,
            collegeId: course.collegeId || course.college_id,
            departmentName: course.departmentName || course.department_name,
          }))
        : [];
      setCourses(transformedCourses);

      console.log('Data loading completed successfully');
      console.log('Transformed courses:', transformedCourses.length);
    } catch (error) {
      console.error('Failed to load signup data:', error);
      toast.error('Failed to load form data. Please check your connection and try again.');

      // Set empty arrays to prevent undefined errors
      setColleges([]);
      setDepartments([]);
      setCourses([]);
      setAcademicYears([]);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSignupInputChange = (field: string, value: string) => {
    setSignupData(prev => ({ ...prev, [field]: value }));
  };

  const handleSearchChange = (field: string, value: string) => {
    setSearchTerms(prev => ({ ...prev, [field]: value }));
  };

  // Filter functions for searchable dropdowns
  const getFilteredColleges = () => {
    if (!searchTerms.college) return colleges;
    return colleges.filter(college =>
      college.name.toLowerCase().includes(searchTerms.college.toLowerCase())
    );
  };

  const getFilteredDepartments = () => {
    let filtered = filteredDepartments;
    if (searchTerms.department) {
      filtered = filtered.filter(dept =>
        dept.name.toLowerCase().includes(searchTerms.department.toLowerCase())
      );
    }
    return filtered;
  };

  const getFilteredCourses = () => {
    let filtered = filteredCourses;
    if (searchTerms.course) {
      filtered = filtered.filter(course =>
        course.name.toLowerCase().includes(searchTerms.course.toLowerCase())
      );
    }
    return filtered;
  };

  const getFilteredSections = () => {
    let filtered = filteredSections;
    if (searchTerms.section) {
      filtered = filtered.filter(section =>
        section.name.toLowerCase().includes(searchTerms.section.toLowerCase())
      );
    }
    return filtered;
  };

  // SearchableSelect component
  const SearchableSelect = ({
    options,
    value,
    onChange,
    placeholder,
    searchTerm,
    onSearchChange,
    disabled = false,
    required = false,
  }: {
    options: any[];
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    searchTerm: string;
    onSearchChange: (value: string) => void;
    disabled?: boolean;
    required?: boolean;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState(options);

    useEffect(() => {
      if (searchTerm) {
        const filtered = options.filter(option =>
          option.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredOptions(filtered);
      } else {
        setFilteredOptions(options);
      }
    }, [options, searchTerm]);

    const selectedOption = options.find(option => option.id === value);

    return (
      <div className='relative'>
        <div
          className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer ${
            disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
          }`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <div className='flex justify-between items-center'>
            <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
              {disabled && !selectedOption
                ? `Please select ${placeholder.toLowerCase().replace('select ', '')} first`
                : selectedOption
                  ? selectedOption.name
                  : placeholder}
            </span>
            <svg
              className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''} ${disabled ? 'text-gray-300' : 'text-gray-400'}`}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 9l-7 7-7-7'
              />
            </svg>
          </div>
        </div>

        {isOpen && !disabled && (
          <div className='absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden'>
            <div className='p-2'>
              <input
                type='text'
                value={searchTerm}
                onChange={e => onSearchChange(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder={`Search ${placeholder.toLowerCase()}...`}
                autoFocus
              />
            </div>
            <div className='max-h-48 overflow-y-auto'>
              {filteredOptions.length > 0 ? (
                filteredOptions.map(option => (
                  <div
                    key={option.id}
                    className='px-4 py-2 hover:bg-gray-100 cursor-pointer'
                    onClick={() => {
                      onChange(option.id);
                      setIsOpen(false);
                      onSearchChange('');
                    }}
                  >
                    {option.name}
                  </div>
                ))
              ) : (
                <div className='px-4 py-2 text-gray-500'>No options found</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const validateSignupStep1 = () => {
    const { firstName, lastName, email, phone, password, confirmPassword, role } = signupData;

    // Basic field validation with specific error messages
    if (!firstName) {
      toast.error('First name is required');
      return false;
    }
    if (!lastName) {
      toast.error('Last name is required');
      return false;
    }
    if (!email) {
      toast.error('Email address is required');
      return false;
    }
    if (!phone) {
      toast.error('Phone number is required');
      return false;
    }
    if (!password) {
      toast.error('Password is required');
      return false;
    }
    if (!confirmPassword) {
      toast.error('Please confirm your password');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    // Phone validation
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      toast.error('Please enter a valid 10-digit phone number');
      return false;
    }

    // Password validation
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return false;
    }

    // Role validation - must have a valid role
    if (!role) {
      toast.error('Please select a role');
      return false;
    }

    // Faculty role validation - for non-student roles, ensure it's a valid faculty role
    if (role !== 'student' && !['staff', 'hod', 'principal'].includes(role)) {
      toast.error('Please select a valid faculty role from the dropdown');
      return false;
    }

    return true;
  };

  const validateSignupStep2 = () => {
    if (signupData.role === 'student') {
      const { registrationNumber, collegeId, departmentId, courseId, yearOfStudy, sectionId } =
        signupData;
      return (
        registrationNumber && collegeId && departmentId && courseId && yearOfStudy && sectionId
      );
    } else if (signupData.role === 'principal') {
      const { employeeId, collegeId } = signupData;
      return employeeId && collegeId;
    } else {
      const { employeeId, collegeId, departmentId } = signupData;
      return employeeId && collegeId && departmentId;
    }
  };

  const handleSignupSubmit = async () => {
    if (!validateSignupStep2()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const registrationData = {
        name: `${signupData.firstName} ${signupData.lastName}`,
        email: signupData.email,
        phone: signupData.phone,
        password: signupData.password,
        role: signupData.role,
        collegeId: signupData.collegeId,
        ...(signupData.role === 'principal' ? {} : { departmentId: signupData.departmentId }),
        ...(signupData.role === 'student'
          ? {
              courseId: signupData.courseId,
              sectionId: signupData.sectionId,
              rollNumber: signupData.registrationNumber,
              yearOfStudy: signupData.yearOfStudy,
            }
          : {
              employeeId: signupData.employeeId,
              qualification: signupData.qualification,
              experience: signupData.experience,
            }),
      };

      await ApiService.createRegistrationRequest(registrationData);
      toast.success('Registration submitted successfully! You will be notified once approved.');

      // Reset form and switch back to login
      setIsSignupMode(false);
      setSignupStep(1);
      setSignupData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'student',
        registrationNumber: '',
        collegeId: '',
        departmentId: '',
        courseId: '',
        yearOfStudy: '',
        sectionId: '',
        employeeId: '',
        qualification: '',
        experience: '',
      });
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      const user = await login(email, password, selectedRole);

      // Only proceed if we actually got a user back
      if (user && user.id) {
        // Login successful - save credentials based on remember me setting
        saveCredentials(email, rememberMe);

        // Call success callback only after everything is confirmed successful
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        // This shouldn't happen now since login throws on error, but keep as fallback
        setError('Invalid email or password');
        clearSavedCredentialsOnly();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Invalid email or password');
      // Extract error message from API response
      // const errorMessage = err?.response?.data?.message || err?.message || 'Login failed. Please try again.';
      // setError(errorMessage);

      // Clear saved credentials on failed login (but keep form fields)
      clearSavedCredentialsOnly();
    } finally {
      setLoading(false);
    }
  };

  const demoUsers = [
    { email: 'admin@demo.com', role: 'System Admin', password: 'admin123', userRole: 'admin' },
    { email: 'principal@demo.com', role: 'Principal', password: 'admin123', userRole: 'principal' },
    { email: 'hod.ece@demo.com', role: 'HOD - Computer Science', password: 'admin123', userRole: 'hod' },
    { email: 'smuthuviknesh2.com', role: 'Staff Member', password: 'admin123', userRole: 'staff' },
    { email: 'student1@demo.com', role: 'Student', password: 'admin123', userRole: 'student' },
    { email: 'student2@demo.com', role: 'Student', password: 'admin123', userRole: 'student' },
  ];

  const fillDemoCredentials = async (email: string, password: string, userRole: string) => {
    setEmail(email);
    setPassword(password);

    // Set the appropriate role selection based on user role
    if (userRole === 'student') {
      setSelectedRole('student');
    } else {
      setSelectedRole('faculty');
    }

    // Auto-login after filling credentials
    setLoading(true);
    setError('');

    try {
      // Map user role to the expected selectedRole format
      const selectedRoleForLogin = userRole === 'student' ? 'student' : 'faculty';
      const user = await login(email, password, selectedRoleForLogin);
      if (user) {
        // Login successful
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        // This shouldn't happen now since login throws on error, but keep as fallback
        setError('Invalid email or password');
      }
    } catch (err: any) {
      console.error('Demo login error:', err);
      // Extract error message from API response
      const errorMessage =
        err?.response?.data?.message || err?.message || 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Forgot password flow handlers
  const handleForgotPasswordSuccess = (email: string) => {
    setForgotPasswordEmail(email);
    setForgotPasswordFlow('otp');
  };

  const handleOTPSuccess = (email: string, otp: string) => {
    setForgotPasswordEmail(email);
    setForgotPasswordOTP(otp);
    setOtpVerifiedAt(Date.now());
    setForgotPasswordFlow('reset');
  };

  const handleResetPasswordSuccess = () => {
    // Clear all sensitive data
    setForgotPasswordFlow('none');
    setForgotPasswordEmail('');
    setForgotPasswordOTP('');
    setOtpVerifiedAt(null);
    toast.success('Password Reset Complete! You can now login with your new password.');
  };

  const handleBackToLogin = () => {
    setForgotPasswordFlow('none');
    setForgotPasswordEmail('');
    setForgotPasswordOTP('');
    setOtpVerifiedAt(null);
  };

  // Render forgot password flow components
  if (forgotPasswordFlow === 'email') {
    return <ForgotPassword onBack={handleBackToLogin} onSuccess={handleForgotPasswordSuccess} />;
  }

  if (forgotPasswordFlow === 'otp') {
    // Security check: if OTP was already verified recently, go directly to reset screen
    if (otpVerifiedAt && Date.now() - otpVerifiedAt < 10 * 60 * 1000) {
      // 10 minutes
      setForgotPasswordFlow('reset');
      return null; // Will re-render with reset screen
    }

    return (
      <PasswordResetOTP
        email={forgotPasswordEmail}
        onBack={() => setForgotPasswordFlow('email')}
        onSuccess={handleOTPSuccess}
      />
    );
  }

  if (forgotPasswordFlow === 'reset') {
    return (
      <ResetPassword
        email={forgotPasswordEmail}
        otp={forgotPasswordOTP}
        onBack={handleBackToLogin} // Go back to login instead of OTP screen
        onSuccess={handleResetPasswordSuccess}
      />
    );
  }

  // Responsive login design - two-panel on medium screens and up, single column on mobile
  return (
    <div className='items-center justify-center flex-auto flex flex-col min-h-screen'>
      <div className='flex-1 w-full items-center justify-center'>
        <div className='min-h-screen bg-white flex flex-col md:flex-row'>
          {/* Main Content Panel - Left side on medium screens and up */}
          <div className='w-full md:w-1/2 flex flex-col justify-center px-4 sm:px-6 md:px-6 lg:px-8 xl:px-12 md:py-4 pb-12 md:pb-8'>
            <div className='mx-auto w-full max-w-md'>
              {/* Mobile Header: Logo (left) + Register section (right) */}
              <div className='md:hidden mb-4 flex items-start justify-between gap-2'>
                {/* College Logo - Left side, bigger for mobile */}
                <div className='flex items-center flex-shrink-0'>
                  <img
                    src='/logo.png'
                    alt='College Logo'
                    className='w-16 h-16 object-contain'
                    onError={e => {
                      console.error('Logo failed to load:', e);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>

                {/* Register section - Right side with more space */}
                <div className='flex-1 text-right'>
                  <p className='text-xs text-gray-600 mb-3 leading-tight'>
                    College not registered? Submit your details.
                  </p>
                  <button
                    onClick={() => setShowCollegeRegistration(true)}
                    className='bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm'
                  >
                    Register with us
                  </button>
                </div>
              </div>
              {/* Mobile Image - Compact version for mobile */}
              <div className='md:hidden mb-4 flex justify-center'>
                <div className='relative w-full max-w-xm h-48 rounded-xl overflow-hidden shadow-md bg-gradient-to-r to-blue-100'>
                  <img
                    src='/loginpage.png'
                    alt='Student-ACT Learning Management System'
                    className='w-full h-full object-cover'
                    onLoad={e => {
                      console.log('Image loaded successfully');
                      // Hide fallback content when image loads
                      const fallback = e.currentTarget.nextElementSibling
                        ?.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'none';
                    }}
                    onError={e => {
                      console.error('LMS background image failed to load:', e);
                      console.error('Image src:', e.currentTarget.src);
                      // Hide the image and show fallback content
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling
                        ?.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className='absolute inset-0 bg-gradient-to-r from-blue-600/20 to-blue-600/20 pointer-events-none'></div>
                  {/* Fallback content when image fails to load - Initially hidden */}
                  <div className='absolute inset-0 hidden items-center justify-center bg-gradient-to-r from-blue-200 to-blue-200'>
                    <div className='text-center text-blue-800'>
                      <div className='text-xl mb-1'>🌱</div>
                      <div className='text-xs font-semibold'>Learning Management System</div>
                      <div className='text-xs opacity-75'>Educational Excellence</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* College Logo - Desktop/Tablet only */}
              <div className='hidden md:flex mb-4 sm:mb-6 flex-col sm:flex-row items-center sm:space-x-4 space-y-2 sm:space-y-0'>
                <img
                  src='/logo.png'
                  alt='College Logo'
                  className='w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 object-contain shadow-lg rounded-lg flex-shrink-0'
                  onError={e => {
                    console.error('Logo failed to load:', e);
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className='text-center sm:text-left flex-grow'>
                  <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-blue-800 drop-shadow-lg leading-tight'>
                    Student-ACT LMS
                  </h1>
                </div>
              </div>

              {/* Role Selection Buttons - Compact */}
              <div className='flex flex-col sm:flex-row gap-2 sm:gap-14 mb-4 sm:mb-6 w-full'>
                <button
                  onClick={() => {
                    if (isSignupMode) {
                      handleSignupInputChange('role', 'student');
                    } else {
                      setSelectedRole('student');
                    }
                  }}
                  className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-medium transition-all text-sm sm:text-base min-h-[44px] w-full sm:w-auto ${
                    (isSignupMode ? signupData.role === 'student' : selectedRole === 'student')
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                  }`}
                >
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 14l9-5-9-5-9 5 9 5z'
                    />
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z'
                    />
                  </svg>
                  {isSignupMode ? 'Signup as Student' : 'Login as Student'}
                </button>
                <button
                  onClick={() => {
                    if (isSignupMode) {
                      // For signup, set to staff initially, user can change it in the dropdown
                      handleSignupInputChange('role', 'staff');
                    } else {
                      setSelectedRole('faculty');
                    }
                  }}
                  className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-medium transition-all text-sm sm:text-base min-h-[44px] w-full sm:w-auto ${
                    (
                      isSignupMode
                        ? ['staff', 'hod', 'principal'].includes(signupData.role)
                        : selectedRole === 'faculty'
                    )
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                  }`}
                >
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                    />
                  </svg>
                  {isSignupMode ? 'Signup as Faculty' : 'Login as Faculty'}
                </button>
              </div>

              {/* Form - Role-based title and description */}
              <div className='mb-4 sm:mb-6'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-1 sm:space-y-0'>
                  <h2 className='text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight'>
                    {isSignupMode
                      ? signupData.role === 'student'
                        ? 'Student Registration'
                        : 'Faculty Registration'
                      : selectedRole === 'student'
                        ? 'Student Login'
                        : 'Faculty Login'}
                  </h2>
                  {isSignupMode && (
                    <button
                      onClick={() => {
                        setIsSignupMode(false);
                        setSignupStep(1);
                      }}
                      className='text-gray-500 hover:text-gray-700 text-sm font-medium whitespace-nowrap min-h-[44px] flex items-center'
                    >
                      ← Back to Login
                    </button>
                  )}
                </div>
                <p className='text-gray-600 text-sm mb-4 leading-relaxed'>
                  {isSignupMode
                    ? signupData.role === 'student'
                      ? 'Create your student account to access the Student-ACT Learning Management System.'
                      : 'Create your faculty account to manage and guide students.'
                    : selectedRole === 'student'
                      ? 'Welcome back! Access your student portal.'
                      : 'Welcome back! Access your faculty dashboard.'}
                </p>

                {!isSignupMode ? (
                  // LOGIN FORM
                  <form onSubmit={handleSubmit} className='space-y-4'>
                    {error && (
                      <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm'>
                        {error}
                      </div>
                    )}

                    {/* Role-based field display */}
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        {selectedRole === 'student' ? 'Registration Number' : 'Email Address'}
                      </label>
                      <input
                        type={selectedRole === 'student' ? 'text' : 'email'}
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200'
                        placeholder={
                          selectedRole === 'student'
                            ? 'Enter your registration number'
                            : 'Enter your email address'
                        }
                        required
                        autoComplete={selectedRole === 'student' ? 'username' : 'email'}
                      />
                      {selectedRole === 'student' && (
                        <p className='text-xs text-gray-500 mt-1'>
                          Use your college registration number (e.g., 2021CSE001)
                        </p>
                      )}
                      {selectedRole === 'faculty' && (
                        <p className='text-xs text-gray-500 mt-1'>
                          Use your official college email address
                        </p>
                      )}
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Password
                      </label>
                      <div className='relative'>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className='w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200'
                          placeholder='••••••••••••••••••••••'
                          required
                          autoComplete='current-password'
                        />
                        <button
                          type='button'
                          onClick={() => setShowPassword(!showPassword)}
                          className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1'
                        >
                          {showPassword ? (
                            <EyeSlashIcon className='w-5 h-5' />
                          ) : (
                            <EyeIcon className='w-5 h-5' />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0'>
                      <label className='flex items-center cursor-pointer'>
                        <input
                          type='checkbox'
                          checked={rememberMe}
                          onChange={e => setRememberMe(e.target.checked)}
                          className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-offset-2'
                          aria-label='Remember me for future logins'
                        />
                        <span className='ml-2 text-sm text-gray-700 select-none'>Remember me</span>
                      </label>
                      <button
                        type='button'
                        onClick={() => setForgotPasswordFlow('email')}
                        className='text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200 text-left sm:text-right min-h-[44px] flex items-center'
                      >
                        Forgot Password?
                      </button>
                    </div>

                    <button
                      type='submit'
                      disabled={loading}
                      className='w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-base min-h-[44px]'
                    >
                      {loading ? (
                        <div className='flex items-center justify-center space-x-2'>
                          <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
                          <span>Login</span>
                        </div>
                      ) : (
                        'Login'
                      )}
                    </button>

                    <div className='text-center space-y-4 mt-6'>
                      <button
                        type="button"
                        onClick={() => setShowDemoPopup(true)}
                        className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium text-sm flex items-center justify-center space-x-2 mx-auto px-4 py-2 rounded-lg border border-blue-200 transition-all duration-200"
                      >
                        <QuestionMarkCircleIcon className="w-4 h-4" />
                        <span>View Demo Accounts</span>
                      </button>
                      <p className='text-sm text-gray-600'>
                        New here?{' '}
                        <button
                          onClick={() => setIsSignupMode(true)}
                          className='text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200'
                        >
                          Sign up
                        </button>
                      </p>
                    </div>
                  </form>
                ) : (
                  // SIGNUP FORM
                  <div className='space-y-4'>
                    {loadingData ? (
                      <div className='flex items-center justify-center py-8'>
                        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
                        <span className='ml-3 text-gray-700'>Loading form data...</span>
                      </div>
                    ) : null}

                    {!loadingData && (
                      <>
                        {/* Step Indicator */}
                        <div className='flex items-center justify-center mb-8'>
                          <div className='flex items-center space-x-4'>
                            <div
                              className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                                signupStep >= 1
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : 'border-gray-300 text-gray-400'
                              }`}
                            >
                              1
                            </div>
                            <div
                              className={`w-12 h-0.5 ${signupStep > 1 ? 'bg-blue-600' : 'bg-gray-300'}`}
                            ></div>
                            <div
                              className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                                signupStep >= 2
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : 'border-gray-300 text-gray-400'
                              }`}
                            >
                              2
                            </div>
                          </div>
                        </div>

                        {signupStep === 1 ? (
                          // STEP 1: Basic Information
                          <div className='space-y-4'>
                            <h3 className='text-lg font-semibold text-gray-800 mb-4'>
                              Basic Information
                            </h3>

                            {/* First Name and Last Name */}
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                              <div>
                                <input
                                  type='text'
                                  value={signupData.firstName}
                                  onChange={e =>
                                    handleSignupInputChange('firstName', e.target.value)
                                  }
                                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                  placeholder='First Name'
                                  required
                                />
                              </div>
                              <div>
                                <input
                                  type='text'
                                  value={signupData.lastName}
                                  onChange={e =>
                                    handleSignupInputChange('lastName', e.target.value)
                                  }
                                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                  placeholder='Last Name'
                                  required
                                />
                              </div>
                            </div>

                            {/* Email and Phone */}
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                              <div>
                                <input
                                  type='email'
                                  value={signupData.email}
                                  onChange={e => handleSignupInputChange('email', e.target.value)}
                                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                  placeholder='Email Address'
                                  required
                                />
                              </div>
                              <div>
                                <input
                                  type='tel'
                                  value={signupData.phone}
                                  onChange={e => handleSignupInputChange('phone', e.target.value)}
                                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                  placeholder='Phone Number'
                                  required
                                />
                              </div>
                            </div>

                            {/* Password and Confirm Password */}
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                              <div className='relative'>
                                <input
                                  type={showPassword ? 'text' : 'password'}
                                  value={signupData.password}
                                  onChange={e =>
                                    handleSignupInputChange('password', e.target.value)
                                  }
                                  className='w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                  placeholder='Password'
                                  required
                                />
                                <button
                                  type='button'
                                  onClick={() => setShowPassword(!showPassword)}
                                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                                >
                                  {showPassword ? (
                                    <EyeSlashIcon className='w-5 h-5' />
                                  ) : (
                                    <EyeIcon className='w-5 h-5' />
                                  )}
                                </button>
                              </div>
                              <div className='relative'>
                                <input
                                  type={showConfirmPassword ? 'text' : 'password'}
                                  value={signupData.confirmPassword}
                                  onChange={e =>
                                    handleSignupInputChange('confirmPassword', e.target.value)
                                  }
                                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    signupData.confirmPassword &&
                                    signupData.password !== signupData.confirmPassword
                                      ? 'border-red-300 bg-red-50'
                                      : 'border-gray-300'
                                  }`}
                                  placeholder='Confirm Password'
                                  required
                                />
                                <button
                                  type='button'
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                                >
                                  {showConfirmPassword ? (
                                    <EyeSlashIcon className='w-5 h-5' />
                                  ) : (
                                    <EyeIcon className='w-5 h-5' />
                                  )}
                                </button>
                              </div>
                            </div>

                            {signupData.confirmPassword &&
                              signupData.password !== signupData.confirmPassword && (
                                <p className='text-xs text-red-500'>Passwords do not match</p>
                              )}

                            {/* Faculty Role Selection - Only show for faculty */}
                            {signupData.role !== 'student' && (
                              <div>
                                <label className='block text-sm font-medium text-gray-700 mb-2'>
                                  Faculty Role *
                                </label>
                                <select
                                  value={signupData.role || 'staff'}
                                  onChange={e => handleSignupInputChange('role', e.target.value)}
                                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white'
                                  required
                                >
                                  {facultyRoleOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                                <p className='text-xs text-gray-500 mt-1'>
                                  Select your academic position at the institution
                                </p>
                              </div>
                            )}

                            <button
                              type='button'
                              onClick={() => {
                                if (validateSignupStep1()) {
                                  setSignupStep(2);
                                }
                              }}
                              className='w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors'
                            >
                              Go to Next
                            </button>
                          </div>
                        ) : (
                          // STEP 2: Role-specific Information
                          <div className='space-y-4'>
                            <h3 className='text-lg font-semibold text-gray-800 mb-4'>
                              {signupData.role === 'student'
                                ? 'Academic Information'
                                : 'Professional Information'}
                            </h3>

                            {signupData.role === 'student' ? (
                              // Student-specific fields - New flow: College → Department → Course → Year → Section
                              <>
                                <div>
                                  <input
                                    type='text'
                                    value={signupData.registrationNumber}
                                    onChange={e =>
                                      handleSignupInputChange('registrationNumber', e.target.value)
                                    }
                                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                    placeholder='Registration Number'
                                    required
                                  />
                                </div>

                                <div>
                                  <SearchableSelect
                                    options={colleges}
                                    value={signupData.collegeId}
                                    onChange={value => handleSignupInputChange('collegeId', value)}
                                    placeholder='Select College'
                                    searchTerm={searchTerms.college}
                                    onSearchChange={value => handleSearchChange('college', value)}
                                    required
                                  />
                                </div>

                                <div>
                                  <SearchableSelect
                                    options={filteredDepartments}
                                    value={signupData.departmentId}
                                    onChange={value =>
                                      handleSignupInputChange('departmentId', value)
                                    }
                                    placeholder='Select Department'
                                    searchTerm={searchTerms.department}
                                    onSearchChange={value =>
                                      handleSearchChange('department', value)
                                    }
                                    disabled={!signupData.collegeId}
                                    required
                                  />
                                </div>

                                <div>
                                  <SearchableSelect
                                    options={filteredCourses}
                                    value={signupData.courseId}
                                    onChange={value => handleSignupInputChange('courseId', value)}
                                    placeholder='Select Course'
                                    searchTerm={searchTerms.course}
                                    onSearchChange={value => handleSearchChange('course', value)}
                                    disabled={!signupData.departmentId}
                                    required
                                  />
                                </div>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                  <div>
                                    <select
                                      value={signupData.yearOfStudy}
                                      onChange={e =>
                                        handleSignupInputChange('yearOfStudy', e.target.value)
                                      }
                                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white'
                                      required
                                      disabled={!signupData.courseId}
                                    >
                                      <option value=''>Year of Study</option>
                                      {academicYears.map(year => (
                                        <option key={year.id} value={year.yearName}>
                                          {year.yearName}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <SearchableSelect
                                      options={filteredSections}
                                      value={signupData.sectionId}
                                      onChange={value =>
                                        handleSignupInputChange('sectionId', value)
                                      }
                                      placeholder='Select Section'
                                      searchTerm={searchTerms.section}
                                      onSearchChange={value => handleSearchChange('section', value)}
                                      disabled={!signupData.yearOfStudy}
                                      required
                                    />
                                  </div>
                                </div>
                              </>
                            ) : (
                              // Faculty-specific fields - Same flow: College → Department
                              <>
                                <div>
                                  <input
                                    type='text'
                                    value={signupData.employeeId}
                                    onChange={e =>
                                      handleSignupInputChange('employeeId', e.target.value)
                                    }
                                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                    placeholder='Employee ID'
                                    required
                                  />
                                </div>

                                <div>
                                  <SearchableSelect
                                    options={colleges}
                                    value={signupData.collegeId}
                                    onChange={value => handleSignupInputChange('collegeId', value)}
                                    placeholder='Select College'
                                    searchTerm={searchTerms.college}
                                    onSearchChange={value => handleSearchChange('college', value)}
                                    required
                                  />
                                </div>
                                {signupData.role !== 'principal' && (
                                  <>
                                    {' '}
                                    <div>
                                      <SearchableSelect
                                        options={filteredDepartments}
                                        value={signupData.departmentId}
                                        onChange={value =>
                                          handleSignupInputChange('departmentId', value)
                                        }
                                        placeholder='Select Department'
                                        searchTerm={searchTerms.department}
                                        onSearchChange={value =>
                                          handleSearchChange('department', value)
                                        }
                                        disabled={!signupData.collegeId}
                                        required
                                      />
                                    </div>
                                    <div>
                                      <SearchableSelect
                                        options={filteredCourses}
                                        value={signupData.courseId}
                                        onChange={value =>
                                          handleSignupInputChange('courseId', value)
                                        }
                                        placeholder='Select Course'
                                        searchTerm={searchTerms.course}
                                        onSearchChange={value =>
                                          handleSearchChange('course', value)
                                        }
                                        disabled={!signupData.departmentId}
                                        required
                                      />
                                    </div>{' '}
                                  </>
                                )}

                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                  <div>
                                    <input
                                      type='text'
                                      value={signupData.qualification}
                                      onChange={e =>
                                        handleSignupInputChange('qualification', e.target.value)
                                      }
                                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                      placeholder='Qualification (e.g., M.Tech, Ph.D)'
                                    />
                                  </div>
                                  <div>
                                    <input
                                      type='number'
                                      value={signupData.experience}
                                      onChange={e =>
                                        handleSignupInputChange('experience', e.target.value)
                                      }
                                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                      placeholder='Experience (e.g., 5 years)'
                                    />
                                  </div>
                                </div>
                              </>
                            )}

                            {/* Navigation Buttons */}
                            <div className='flex gap-4'>
                              <button
                                type='button'
                                onClick={() => setSignupStep(1)}
                                className='flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors'
                              >
                                Go back
                              </button>
                              <button
                                type='button'
                                onClick={handleSignupSubmit}
                                disabled={loading}
                                className='flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                              >
                                {loading ? 'Creating Account...' : 'Create Account'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Login Link and College Registration */}
                        <div className='text-center mt-6 space-y-3'>
                          <p className='text-sm text-gray-600'>
                            Already have an account?{' '}
                            <button
                              onClick={() => {
                                setIsSignupMode(false);
                                setSignupStep(1);
                              }}
                              className='text-blue-600 hover:text-blue-700 font-medium'
                            >
                              Login
                            </button>
                          </p>
                          <p className='text-sm text-gray-600'>
                            Is your college not registered yet?{' '}
                            <button
                              onClick={() => setShowCollegeRegistration(true)}
                              className='text-blue-600 hover:text-blue-700 font-medium'
                            >
                              Register your institution
                            </button>
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Card Container - Hidden on mobile, visible on medium screens and up */}
          <div className='hidden md:flex md:w-1/2 items-center justify-center p-4 md:p-6 xl:p-8'>
            {/* Card with Background Image */}
            <div className='relative w-full max-w-3xl h-[300px] sm:h-[400px] lg:h-[600px] xl:h-[580px] rounded-3xl overflow-hidden'>
              {/* Background Image */}
              <img
                src='/loginpage.png'
                alt='Student-ACT Learning Management System'
                className='absolute inset-0 w-full h-full object-cover'
              />

              {/* Content Overlay */}
              <div className='relative z-10 h-full flex flex-col justify-between p-4 sm:p-6 lg:p-10 xl:p-12'>
                {/* Main Content - Top */}
                <div className='text-center lg:text-left'>
                  <h2 className='text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 sm:mb-6 drop-shadow-lg leading-tight'>
                    Student-ACT
                    <br />
                    LMS
                  </h2>
                  <p className='text-white text-sm sm:text-base lg:text-xl xl:text-2xl drop-shadow-md leading-relaxed max-w-md mx-auto lg:mx-0'>
                    Empowering students with comprehensive learning resources and progress tracking.
                  </p>
                </div>

                {/* Call to Action - Bottom */}
                <div className='text-center lg:text-left'>
                  <p className='text-white mb-5 sm:mb-6 drop-shadow-md text-xs sm:text-sm lg:text-base xl:text-lg leading-relaxed max-w-lg mx-auto lg:mx-0'>
                    Is your college not registered yet? Click here to submit your institution
                    details.
                  </p>
                  <button
                    onClick={() => setShowCollegeRegistration(true)}
                    className='bg-blue-500 text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-lg text-sm sm:text-base lg:text-lg min-h-[44px]'
                  >
                    Register with us
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Only show on medium screens and up, hidden on mobile to save space */}
          {/* <div className="login-footer hidden md:block fixed bottom-2 left-1/2 transform -translate-x-1/2 z-10"> */}

          {/* Demo Accounts Popup */}
          {showDemoPopup && (
            <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50'>
              <div className='bg-white rounded-2xl max-w-md w-full p-8 max-h-[80vh] overflow-y-auto shadow-2xl'>
                <div className='flex justify-between items-center mb-6'>
                  <div>
                    <h3 className='text-2xl font-bold text-gray-900'>Demo Accounts</h3>
                    <p className='text-gray-600 text-sm mt-1'>Test different user roles</p>
                  </div>
                  <button
                    onClick={() => setShowDemoPopup(false)}
                    className='p-2 hover:bg-gray-100 rounded-xl transition-colors'
                  >
                    <XMarkIcon className='w-6 h-6 text-gray-500' />
                  </button>
                </div>

                <p className='text-sm text-gray-600 mb-6 bg-blue-50 p-3 rounded-lg border border-blue-200'>
                  💡 Click on any account below to instantly login and explore the system
                </p>

                <div className='space-y-3'>
                  {demoUsers.map((user, index) => {
                    const roleIcons = {
                      'System Admin': '👑',
                      'Principal': '🏛️',
                      'HOD - Computer Science': '👨‍💼',
                      'HOD - Electronics': '👨‍💼',
                      'Staff Member': '👩‍🏫',
                      'Student': '🎓',
                    };

                    return (
                      <button
                        key={index}
                        onClick={() => {
                          fillDemoCredentials(user.email, user.password, user.userRole);
                          setShowDemoPopup(false);
                        }}
                        className='w-full text-left p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-emerald-50 hover:to-teal-50 transition-all duration-200 border border-gray-200 hover:border-emerald-200 group'
                      >
                        <div className='flex justify-between items-center'>
                          <div className='flex items-center space-x-3'>
                            <span className='text-2xl'>
                              {roleIcons[user.role as keyof typeof roleIcons]}
                            </span>
                            <div>
                              <p className='font-semibold text-gray-900 group-hover:text-emerald-700'>
                                {user.role}
                              </p>
                              <p className='text-sm text-gray-500 truncate'>{user.email}</p>
                            </div>
                          </div>
                          <div className='text-xs text-emerald-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity'>
                            Click to auto-login →
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className='mt-6 pt-4 border-t border-gray-200'>
                  <p className='text-xs text-gray-500 text-center bg-yellow-50 p-2 rounded-lg border border-yellow-200'>
                    🔒 These are demo accounts for testing purposes only
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* College Registration Popup */}
          {showCollegeRegistration && (
            <CollegeRegistration
              onClose={() => setShowCollegeRegistration(false)}
              onSuccess={() => {
                toast.success('College registration submitted successfully!');
                setShowCollegeRegistration(false);
              }}
            />
          )}

          {/* About the Initiative Popup */}
          {showAboutPopup && (
            <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50'>
              <div className='bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto shadow-2xl'>
                <div className='flex justify-between items-start mb-6'>
                  <div className='flex items-center space-x-3'>
                    <div className='text-2xl'>🌱</div>
                    <h3 className='text-2xl font-bold text-gray-900'>
                      About "Student-ACT LMS"
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowAboutPopup(false)}
                    className='p-2 hover:bg-gray-100 rounded-xl transition-colors'
                  >
                    <XMarkIcon className='w-6 h-6 text-gray-500' />
                  </button>
                </div>

                <div className='space-y-6 text-gray-700'>
                  <p className='text-base leading-relaxed'>
                    Student-ACT LMS is a comprehensive Learning Management System designed to enhance
                    the educational experience for students, faculty, and administrators at your institution.
                  </p>

                  <div>
                    <h4 className='font-semibold text-gray-900 mb-3'>
                      Key features include:
                    </h4>
                    <ul className='space-y-2 ml-4'>
                      <li className='flex items-start space-x-2'>
                        <span className='text-blue-600 mt-1'>•</span>
                        <span>Access to comprehensive learning resources and course materials</span>
                      </li>
                      <li className='flex items-start space-x-2'>
                        <span className='text-blue-600 mt-1'>•</span>
                        <span>Track academic progress and performance metrics</span>
                      </li>
                      <li className='flex items-start space-x-2'>
                        <span className='text-blue-600 mt-1'>•</span>
                        <span>Collaborate with faculty and peers through integrated tools</span>
                      </li>
                    </ul>
                  </div>

                  <p className='text-base leading-relaxed'>
                    Our platform empowers students to take control of their learning journey while
                    providing educators with powerful tools to enhance teaching effectiveness.
                  </p>

                  <p className='text-base leading-relaxed'>
                    📊 Since launch, over 1200 students have successfully utilized our platform
                    across multiple departments and programs.
                  </p>
                  <p className='text-base leading-relaxed'>
                    📍This system is managed by the IT department and supported by
                    faculty heads of each department.
                  </p>

                  <div className='text-center'>
                    <p className='text-base leading-relaxed'>
                      <span>Let's build educational excellence — one student at a time.</span>
                      <span className='text-2xl'>📚</span>
                    </p>
                  </div>
                </div>

                <div className='mt-8 pt-6 border-t border-gray-200'>
                  <button
                    onClick={() => setShowAboutPopup(false)}
                    className='w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium'
                  >
                    Got it!
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className='flex py-4 space-x-4 text-xs text-gray-500 px-4 xl:mt-[-45px]'>
        <span>©2025 Student-ACT LMS</span>
        <span>•</span>
        <a href='#' className='hover:text-blue-600 transition-colors'>
          Help Desk / Contact us
        </a>
        <span>•</span>
        <button
          onClick={() => setShowAboutPopup(true)}
          className='hover:text-blue-600 transition-colors'
        >
          About the Initiative
        </button>
      </div>
    </div>
  );
};

export default Login;
