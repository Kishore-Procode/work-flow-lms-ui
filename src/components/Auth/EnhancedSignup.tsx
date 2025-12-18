/**
 * Enhanced Signup Component with OTP Verification
 * 
 * Multi-step signup process following client workflow requirements:
 * - Role-based form fields
 * - OTP verification for email/phone
 * - Complete profile information
 * - Address synchronization
 * - Department count validation
 * 
 * @author Student-ACT LMS Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Building, GraduationCap, UserCheck, MapPin, Calendar, CreditCard, Lock } from 'lucide-react';
import { ApiService } from '../../services/api';
import { College, Department } from '../../types';
import { useToast } from '../UI/Toast';
import OptimizedDropdown from '../UI/OptimizedDropdown';
import CascadingDropdown from '../UI/CascadingDropdown';
import OTPVerification from './OTPVerification';

interface EnhancedSignupProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  // Basic Information
  name: string;
  email: string;
  phone: string;
  role: string;

  // Password Information (NEW)
  password: string;
  confirmPassword: string;

  // Organization
  collegeId: string;
  departmentId: string;

  // Academic Structure (NEW)
  courseId: string;
  academicYearId: string;
  sectionId: string;
  yearOfStudy: string; // "1st Year", "2nd Year", etc.
  semester: string;

  // Student specific
  rollNumber: string;
  batchYear: string;

  // Address Information
  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
  state: string;
  pincode: string;

  // Additional Information
  aadharNumber: string;
  dateOfBirth: string;
  websiteUrl: string;

  // Principal/College specific
  spocName: string;
  spocEmail: string;
  spocPhone: string;
  departmentCount: number;
  selectedDepartments: string[];
}

const EnhancedSignup: React.FC<EnhancedSignupProps> = ({ onClose, onSuccess }) => {
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [otpPurpose, setOtpPurpose] = useState<'email' | 'phone'>('email');
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    role: '',
    // Password Information (NEW)
    password: '',
    confirmPassword: '',
    collegeId: '',
    departmentId: '',
    // Academic Structure (NEW)
    courseId: '',
    academicYearId: '',
    sectionId: '',
    yearOfStudy: '',
    semester: '',
    rollNumber: '',
    batchYear: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    aadharNumber: '',
    dateOfBirth: '',
    websiteUrl: '',
    spocName: '',
    spocEmail: '',
    spocPhone: '',
    departmentCount: 1,
    selectedDepartments: [],
  });

  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  // Academic Structure State (NEW)
  const [courses, setCourses] = useState<{id: string, name: string, code: string, type: string}[]>([]);
  const [academicYears, setAcademicYears] = useState<{id: string, year_name: string, year_number: number}[]>([]);
  const [sections, setSections] = useState<{id: string, name: string}[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<{id: string, name: string, code: string, type: string}[]>([]);
  const [filteredAcademicYears, setFilteredAcademicYears] = useState<{id: string, year_name: string, year_number: number}[]>([]);
  const [filteredSections, setFilteredSections] = useState<{id: string, name: string}[]>([]);
  const [states, setStates] = useState<{id: string, name: string}[]>([]);
  const [districts, setDistricts] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (formData.collegeId) {
      filterDepartmentsByCollege();
      loadCollegeAddress();
    }
  }, [formData.collegeId]);

  useEffect(() => {
    if (formData.state) {
      loadDistricts();
    }
  }, [formData.state]);

  // Academic Structure Cascading Effects (NEW)
  useEffect(() => {
    if (formData.collegeId) {
      filterCoursesByCollege();
    }
  }, [formData.collegeId]);

  useEffect(() => {
    if (formData.courseId) {
      filterAcademicYearsByCourse();
      // Reset dependent fields
      setFormData(prev => ({ ...prev, academicYearId: '', sectionId: '', yearOfStudy: '' }));
    }
  }, [formData.courseId]);

  useEffect(() => {
    if (formData.academicYearId) {
      filterSectionsByAcademicYear();
      // Auto-set year of study based on academic year
      const selectedYear = academicYears.find(y => y.id === formData.academicYearId);
      if (selectedYear) {
        setFormData(prev => ({ ...prev, yearOfStudy: selectedYear.year_name, sectionId: '' }));
      }
    }
  }, [formData.academicYearId]);

  const loadInitialData = async () => {
    try {
      const [collegesData, departmentsData, coursesData, academicYearsData, sectionsData, statesData] = await Promise.all([
        ApiService.getColleges(),
        ApiService.getDepartments(),
        ApiService.getCourses(), // NEW: Load courses
        ApiService.getAcademicYears(), // NEW: Load academic years
        ApiService.getSections(), // NEW: Load sections
        ApiService.getStates(), // Assuming this API exists
      ]);

      setColleges(collegesData);
      setDepartments(departmentsData);
      setCourses(coursesData); // NEW
      setAcademicYears(academicYearsData); // NEW
      setSections(sectionsData); // NEW
      setStates(statesData);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      toast.error('Loading Error', 'Failed to load form data. Please refresh and try again.');
    } finally {
      setLoadingData(false);
    }
  };

  const filterDepartmentsByCollege = () => {
    const filtered = departments.filter(dept => dept.collegeId === formData.collegeId);
    setFilteredDepartments(filtered);
    
    // Reset department selection if current selection is not valid for new college
    if (formData.departmentId && !filtered.find(d => d.id === formData.departmentId)) {
      setFormData(prev => ({ ...prev, departmentId: '' }));
    }
  };

  const loadCollegeAddress = async () => {
    try {
      const college = colleges.find(c => c.id === formData.collegeId);
      if (college && college.district && college.state) {
        // Auto-fill address from college
        setFormData(prev => ({
          ...prev,
          district: college.district,
          state: college.state,
          city: college.city || '',
        }));
      }
    } catch (error) {
      console.error('Failed to load college address:', error);
    }
  };

  const loadDistricts = async () => {
    try {
      const districtsData = await ApiService.getDistrictsByState(formData.state);
      setDistricts(districtsData);
    } catch (error) {
      console.error('Failed to load districts:', error);
    }
  };

  // Academic Structure Filter Functions (NEW)
  const filterCoursesByCollege = () => {
    const filtered = courses.filter(course => course.college_id === formData.collegeId);
    setFilteredCourses(filtered);

    // Reset course selection if current selection is not valid for new college
    if (formData.courseId && !filtered.find(c => c.id === formData.courseId)) {
      setFormData(prev => ({ ...prev, courseId: '', academicYearId: '', sectionId: '', yearOfStudy: '' }));
    }
  };

  const filterAcademicYearsByCourse = () => {
    const filtered = academicYears.filter(year => year.course_id === formData.courseId);
    setFilteredAcademicYears(filtered);

    // Reset academic year selection if current selection is not valid for new course
    if (formData.academicYearId && !filtered.find(y => y.id === formData.academicYearId)) {
      setFormData(prev => ({ ...prev, academicYearId: '', sectionId: '', yearOfStudy: '' }));
    }
  };

  const filterSectionsByAcademicYear = () => {
    const filtered = sections.filter(section =>
      section.course_id === formData.courseId &&
      section.department_id === formData.departmentId &&
      section.academic_year_id === formData.academicYearId
    );
    setFilteredSections(filtered);

    // Reset section selection if current selection is not valid
    if (formData.sectionId && !filtered.find(s => s.id === formData.sectionId)) {
      setFormData(prev => ({ ...prev, sectionId: '' }));
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEmailVerification = () => {
    setOtpPurpose('email');
    setShowOTPVerification(true);
  };

  const handlePhoneVerification = () => {
    setOtpPurpose('phone');
    setShowOTPVerification(true);
  };

  const handleOTPSuccess = () => {
    if (otpPurpose === 'email') {
      setEmailVerified(true);
      toast.success('Email Verified', 'Your email has been verified successfully!');
    } else {
      setPhoneVerified(true);
      toast.success('Phone Verified', 'Your phone number has been verified successfully!');
    }
    setShowOTPVerification(false);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // Basic info + Password validation
        const basicValid = !!(formData.name && formData.email && formData.phone && formData.role && formData.password && formData.confirmPassword);
        const passwordValid = formData.password === formData.confirmPassword && formData.password.length >= 8;
        return basicValid && passwordValid;
      case 2:
        if (formData.role === 'principal') {
          return !!(formData.collegeId && formData.departmentCount > 0);
        }
        // For students, require Course, Department, Academic Year, and Section
        if (formData.role === 'student') {
          return !!(formData.collegeId && formData.departmentId && formData.courseId && formData.academicYearId && formData.sectionId);
        }
        return !!(formData.collegeId && formData.departmentId);
      case 3:
        return !!(formData.addressLine1 && formData.city && formData.district && formData.state && formData.pincode);
      case 4:
        if (formData.role === 'student') {
          return !!(formData.rollNumber && formData.batchYear && formData.aadharNumber && formData.dateOfBirth && formData.semester);
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    } else {
      toast.error('Validation Error', 'Please fill in all required fields before proceeding.');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!emailVerified) {
      toast.error('Verification Required', 'Please verify your email address before submitting.');
      return;
    }

    if (!phoneVerified) {
      toast.error('Verification Required', 'Please verify your phone number before submitting.');
      return;
    }

    // Password validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Password Mismatch', 'Passwords do not match. Please check and try again.');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Weak Password', 'Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      // Create registration request with password
      const registrationData = {
        ...formData,
        // Include new academic structure fields
        courseId: formData.courseId,
        academicYearId: formData.academicYearId,
        sectionId: formData.sectionId,
        yearOfStudy: formData.yearOfStudy,
        semester: formData.semester,
        // Include password for account creation
        password: formData.password,
        // Remove confirmPassword from submission
        confirmPassword: undefined
      };

      await ApiService.createRegistrationRequest(registrationData);

      toast.success('Registration Submitted', 'Your registration has been submitted successfully. You will be notified once approved.');
      onSuccess();
    } catch (error) {
      console.error('Failed to submit registration request:', error);
      toast.error('Registration Failed', 'Failed to submit registration request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'student', label: 'Student', icon: GraduationCap },
    { value: 'staff', label: 'Staff Member', icon: UserCheck },
    { value: 'hod', label: 'Head of Department', icon: User },
    { value: 'principal', label: 'Principal', icon: Building }
  ];

  const getCurrentYearBatches = () => {
    const currentYear = new Date().getFullYear();
    const batches = [];
    for (let i = 0; i < 6; i++) {
      const year = currentYear + i;
      batches.push({ value: year.toString(), label: `Batch ${year}` });
    }
    return batches;
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {step}
          </div>
          {step < 4 && (
            <div className={`w-12 h-1 mx-2 ${
              step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
      
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Name *
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your full name"
            required
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address *
        </label>
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email address"
              required
            />
          </div>
          <button
            type="button"
            onClick={handleEmailVerification}
            disabled={!formData.email || emailVerified}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              emailVerified 
                ? 'bg-blue-100 text-blue-800 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {emailVerified ? 'Verified ✓' : 'Verify'}
          </button>
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number *
        </label>
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your phone number"
              required
            />
          </div>
          <button
            type="button"
            onClick={handlePhoneVerification}
            disabled={!formData.phone || phoneVerified}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              phoneVerified 
                ? 'bg-blue-100 text-blue-800 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {phoneVerified ? 'Verified ✓' : 'Verify'}
          </button>
        </div>
      </div>

      {/* Role */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Role *
        </label>
        <OptimizedDropdown
          options={roleOptions.map(role => ({
            value: role.value,
            label: role.label
          }))}
          value={formData.role}
          onChange={(value) => handleInputChange('role', value)}
          placeholder="👤 Select your role"
          required
          className="w-full"
        />
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password *
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Create a strong password"
            required
            minLength={8}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Password must be at least 8 characters long
        </p>
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password *
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              formData.confirmPassword && formData.password !== formData.confirmPassword
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300'
            }`}
            placeholder="Confirm your password"
            required
          />
        </div>
        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
          <p className="text-xs text-red-500 mt-1">
            Passwords do not match
          </p>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Organization Information</h3>

      {/* College Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          College *
        </label>
        <OptimizedDropdown
          options={colleges.map(college => ({
            value: college.id,
            label: college.name
          }))}
          value={formData.collegeId}
          onChange={(value) => handleInputChange('collegeId', value)}
          placeholder="🏫 Select your college"
          required
          className="w-full"
        />
      </div>

      {/* Course Selection (for students) */}
      {formData.role === 'student' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Course *
          </label>
          <OptimizedDropdown
            options={filteredCourses.map(course => ({
              value: course.id,
              label: `${course.name} (${course.code})`
            }))}
            value={formData.courseId}
            onChange={(value) => handleInputChange('courseId', value)}
            placeholder="🎓 Select your course"
            required
            disabled={!formData.collegeId}
            className="w-full"
          />
        </div>
      )}

      {/* Department Selection (for non-principal roles) */}
      {formData.role !== 'principal' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Department *
          </label>
          <OptimizedDropdown
            options={filteredDepartments.map(dept => ({
              value: dept.id,
              label: dept.name
            }))}
            value={formData.departmentId}
            onChange={(value) => handleInputChange('departmentId', value)}
            placeholder="📚 Select your department"
            required
            disabled={!formData.collegeId}
            className="w-full"
          />
        </div>
      )}

      {/* Academic Year Selection (for students) */}
      {formData.role === 'student' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Year of Study *
          </label>
          <OptimizedDropdown
            options={filteredAcademicYears.map(year => ({
              value: year.id,
              label: year.year_name
            }))}
            value={formData.academicYearId}
            onChange={(value) => handleInputChange('academicYearId', value)}
            placeholder="📅 Select your year of study"
            required
            disabled={!formData.courseId}
            className="w-full"
          />
        </div>
      )}

      {/* Section Selection (for students) */}
      {formData.role === 'student' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Section *
          </label>
          <OptimizedDropdown
            options={filteredSections.map(section => ({
              value: section.id,
              label: `Section ${section.name}`
            }))}
            value={formData.sectionId}
            onChange={(value) => handleInputChange('sectionId', value)}
            placeholder="🏫 Select your section"
            required
            disabled={!formData.academicYearId}
            className="w-full"
          />
        </div>
      )}

      {/* Principal-specific fields */}
      {formData.role === 'principal' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Departments *
            </label>
            <select
              value={formData.departmentCount}
              onChange={(e) => handleInputChange('departmentCount', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {Array.from({ length: 30 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>{num} Department{num > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              College Website URL
            </label>
            <input
              type="url"
              value={formData.websiteUrl}
              onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://www.college.edu"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SPOC (Single Point of Contact) Name *
            </label>
            <input
              type="text"
              value={formData.spocName}
              onChange={(e) => handleInputChange('spocName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter SPOC name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SPOC Email *
            </label>
            <input
              type="email"
              value={formData.spocEmail}
              onChange={(e) => handleInputChange('spocEmail', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="spoc@college.edu"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SPOC Phone *
            </label>
            <input
              type="tel"
              value={formData.spocPhone}
              onChange={(e) => handleInputChange('spocPhone', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter SPOC phone number"
              required
            />
          </div>
        </>
      )}

      {/* Student-specific fields */}
      {formData.role === 'student' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registration Number *
              </label>
              <input
                type="text"
                value={formData.rollNumber}
                onChange={(e) => handleInputChange('rollNumber', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your registration number"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year of Study *
              </label>
              <OptimizedDropdown
                options={[
                  { value: '1st Year', label: '1st Year' },
                  { value: '2nd Year', label: '2nd Year' },
                  { value: '3rd Year', label: '3rd Year' },
                  { value: '4th Year', label: '4th Year' }
                ]}
                value={formData.class}
                onChange={(value) => handleInputChange('class', value)}
                placeholder="📚 Select your year of study"
                required
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semester *
              </label>
              <OptimizedDropdown
                options={[
                  { value: '1st Semester', label: '1st Semester' },
                  { value: '2nd Semester', label: '2nd Semester' },
                  { value: '3rd Semester', label: '3rd Semester' },
                  { value: '4th Semester', label: '4th Semester' },
                  { value: '5th Semester', label: '5th Semester' },
                  { value: '6th Semester', label: '6th Semester' },
                  { value: '7th Semester', label: '7th Semester' },
                  { value: '8th Semester', label: '8th Semester' }
                ]}
                value={formData.semester}
                onChange={(value) => handleInputChange('semester', value)}
                placeholder="📖 Select your semester"
                required
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Batch Year *
              </label>
              <OptimizedDropdown
                options={getCurrentYearBatches()}
                value={formData.batchYear}
                onChange={(value) => handleInputChange('batchYear', value)}
                placeholder="🎓 Select your batch year"
                required
                className="w-full"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Address Information</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address Line 1 *
        </label>
        <input
          type="text"
          value={formData.addressLine1}
          onChange={(e) => handleInputChange('addressLine1', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter your address"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address Line 2
        </label>
        <input
          type="text"
          value={formData.addressLine2}
          onChange={(e) => handleInputChange('addressLine2', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Apartment, suite, etc. (optional)"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State *
          </label>
          <CascadingDropdown
            level="state"
            value={formData.state}
            onChange={(value) => {
              handleInputChange('state', value);
              // Reset dependent fields
              handleInputChange('district', '');
              handleInputChange('pincode', '');
            }}
            required
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            District *
          </label>
          <CascadingDropdown
            level="district"
            parentValue={formData.state}
            value={formData.district}
            onChange={(value) => {
              handleInputChange('district', value);
              // Reset dependent fields
              handleInputChange('pincode', '');
            }}
            required
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City *
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your city"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pincode *
          </label>
          <CascadingDropdown
            level="pincode"
            parentValue={formData.district}
            value={formData.pincode}
            onChange={(value) => handleInputChange('pincode', value)}
            required
            className="w-full"
          />
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Information</h3>

      {/* Student-specific fields */}
      {formData.role === 'student' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Roll Number *
              </label>
              <input
                type="text"
                value={formData.rollNumber}
                onChange={(e) => handleInputChange('rollNumber', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your roll number"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Batch Year *
              </label>
              <input
                type="number"
                value={formData.batchYear}
                onChange={(e) => handleInputChange('batchYear', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 2026"
                min={new Date().getFullYear()}
                max={new Date().getFullYear() + 10}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Semester *
            </label>
            <select
              value={formData.semester}
              onChange={(e) => handleInputChange('semester', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Semester</option>
              <option value="1st Semester">1st Semester</option>
              <option value="2nd Semester">2nd Semester</option>
              <option value="3rd Semester">3rd Semester</option>
              <option value="4th Semester">4th Semester</option>
              <option value="5th Semester">5th Semester</option>
              <option value="6th Semester">6th Semester</option>
              <option value="7th Semester">7th Semester</option>
              <option value="8th Semester">8th Semester</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Aadhar Number *
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={formData.aadharNumber}
                onChange={(e) => {
                  // Format Aadhar number (XXXX XXXX XXXX)
                  const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                  const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                  handleInputChange('aadharNumber', formatted);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="XXXX XXXX XXXX"
                maxLength={14}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                max={new Date(Date.now() - 15 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // Minimum 15 years old
              />
            </div>
          </div>
        </>
      )}

      {/* Summary Section */}
      <div className="bg-gray-50 rounded-lg p-4 mt-6">
        <h4 className="text-md font-medium text-gray-800 mb-3">Registration Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Name:</span>
            <span className="font-medium">{formData.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium">{formData.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Phone:</span>
            <span className="font-medium">{formData.phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Role:</span>
            <span className="font-medium capitalize">{formData.role}</span>
          </div>
          {formData.collegeId && (
            <div className="flex justify-between">
              <span className="text-gray-600">College:</span>
              <span className="font-medium">{colleges.find(c => c.id === formData.collegeId)?.name}</span>
            </div>
          )}
          {formData.departmentId && (
            <div className="flex justify-between">
              <span className="text-gray-600">Department:</span>
              <span className="font-medium">{filteredDepartments.find(d => d.id === formData.departmentId)?.name}</span>
            </div>
          )}
          {formData.role === 'student' && formData.rollNumber && (
            <div className="flex justify-between">
              <span className="text-gray-600">Registration Number:</span>
              <span className="font-medium">{formData.rollNumber}</span>
            </div>
          )}
          {formData.role === 'student' && formData.batchYear && (
            <div className="flex justify-between">
              <span className="text-gray-600">Batch:</span>
              <span className="font-medium">Batch {formData.batchYear}</span>
            </div>
          )}
        </div>
      </div>

      {/* Verification Status */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-md font-medium text-blue-800 mb-2">Verification Status</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            {emailVerified ? (
              <div className="flex items-center space-x-1 text-blue-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-sm">Email Verified</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-orange-600">
                <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                <span className="text-sm">Email Not Verified</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {phoneVerified ? (
              <div className="flex items-center space-x-1 text-blue-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-sm">Phone Verified</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-orange-600">
                <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                <span className="text-sm">Phone Not Verified</span>
              </div>
            )}
          </div>
        </div>

        {(!emailVerified || !phoneVerified) && (
          <p className="text-blue-700 text-xs mt-2">
            Please verify your email and phone number before submitting the registration.
          </p>
        )}
      </div>

      {/* Terms and Conditions */}
      <div className="flex items-start space-x-2">
        <input
          type="checkbox"
          id="terms"
          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          required
        />
        <label htmlFor="terms" className="text-sm text-gray-700">
          I agree to the{' '}
          <a href="#" className="text-blue-600 hover:text-blue-700 underline">
            Terms and Conditions
          </a>{' '}
          and{' '}
          <a href="#" className="text-blue-600 hover:text-blue-700 underline">
            Privacy Policy
          </a>{' '}
          of the Student-ACT Learning Management System.
        </label>
      </div>
    </div>
  );

  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center mt-4">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Create Account - Step {currentStep} of 4
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Form Content */}
          <div className="p-6">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex space-x-3">
              {currentStep < 4 ? (
                <button
                  onClick={nextStep}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Registration'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOTPVerification && (
        <OTPVerification
          identifier={otpPurpose === 'email' ? formData.email : formData.phone}
          type={otpPurpose}
          purpose="registration"
          onSuccess={handleOTPSuccess}
          onClose={() => setShowOTPVerification(false)}
        />
      )}
    </>
  );
};

export default EnhancedSignup;
