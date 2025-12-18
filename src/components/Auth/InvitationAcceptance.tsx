import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { ApiService } from '../../services/api';

import LoadingSpinner from '../UI/LoadingSpinner';
import { Eye, EyeOff, User, Mail, Phone, GraduationCap, Building, Users } from 'lucide-react';
import { router } from '../../utils/router';

interface InvitationData {
  id: string;
  email: string;
  role: string;
  collegeId: string;
  departmentId?: string;
  collegeName: string;
  departmentName?: string;
  invitationToken: string;
  name?: string;
  phone?: string;
  yearOfStudy?: number;
  section?: string;
  rollNumber?: string;
  designation?: string;
  qualification?: string;
  experience?: number;
  // Additional metadata
  sentAt?: string;
  expiresAt?: string;
  sentBy?: string;
  sentByName?: string;
  courseId?: string;
  courseName?: string;
  academicYearId?: string;
  academicYearName?: string;
}

interface InvitationAcceptanceProps {
  token?: string;
  onNavigateToLogin?: () => void;
}

const InvitationAcceptance: React.FC<InvitationAcceptanceProps> = ({
  token,
  onNavigateToLogin,
}) => {
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Student-specific fields
    rollNumber: '',
    // Staff-specific fields
    designation: '',
    qualification: '',
    experience: 0,
    // Principal-specific fields
    adminNotes: '',
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (token) {
      validateInvitation();
    }
  }, [token]);

  const validateInvitation = async () => {
    try {
      setLoading(true);
      const response = await ApiService.validateInvitationToken(token!);
      setInvitation(response);

      // Pre-populate form with invitation data
      setFormData(prev => ({
        ...prev,
        name: response.name || '',
        phone: response.phone || '',
        rollNumber: response.rollNumber || '',
        designation: response.designation || '',
        qualification: response.qualification || '',
        experience: response.experience || 0,
      }));

      // No need to load dropdown data since everything is static
    } catch (error) {
      console.error('Failed to validate invitation:', error);
      toast.error('Invalid or expired invitation link');
      if (onNavigateToLogin) {
        onNavigateToLogin();
      } else {
        router.navigateTo('login');
      }
    } finally {
      setLoading(false);
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Indian phone number validation: 10 digits, optionally starting with +91
    let cleanedPhone = phone.replace(/\s+/g, '');

    // Step 2: Remove '+91' or '91' if present at the start AND length > 10
    if (cleanedPhone.length > 10) {
      if (cleanedPhone.startsWith('+91')) {
        cleanedPhone = cleanedPhone.slice(3);
      } else if (cleanedPhone.startsWith('91')) {
        cleanedPhone = cleanedPhone.slice(2);
      }
    }
    // Step 3: Validate that the remaining number is exactly 10 digits
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(cleanedPhone);
  };

  const validatePasswordStrength = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
    if (!/\d/.test(password)) errors.push('One number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('One special character');
    return errors;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhoneNumber(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordErrors = validatePasswordStrength(formData.password);
      if (passwordErrors.length > 0) {
        newErrors.password = `Password must contain: ${passwordErrors.join(', ')}`;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Role-specific validation
    if (invitation?.role === 'student') {
      if (!formData.rollNumber.trim()) newErrors.rollNumber = 'Roll number is required';
    } else if (invitation?.role === 'staff' || invitation?.role === 'hod') {
      if (!formData.designation) newErrors.designation = 'Designation is required';
      if (!formData.qualification) newErrors.qualification = 'Qualification is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // debugger;
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setSubmitting(true);
      const acceptanceData = {
        invitationToken: token!,
        name: formData.name,
        phone: formData.phone,
        password: formData.password,
        // Include role-specific data
        ...(invitation?.role === 'student' && {
          rollNumber: formData.rollNumber,
        }),
        ...(['staff', 'hod'].includes(invitation?.role || '') && {
          designation: formData.designation,
          qualification: formData.qualification,
          experience: formData.experience,
        }),
      };

      console.log('Sending acceptance data:', acceptanceData);

      await ApiService.acceptInvitationPublic(acceptanceData);

      // Show success message with role-specific information
      const roleMessages = {
        student: 'Student account created successfully! You can now access your academic portal.',
        staff: 'Staff account created successfully! You can now access the faculty portal.',
        hod: 'HOD account created successfully! You can now access the department management portal.',
        principal:
          'Principal account created successfully! You can now access the administrative portal.',
        admin:
          'Admin account created successfully! You can now access the system administration portal.',
      };

      const successMessage =
        roleMessages[invitation?.role as keyof typeof roleMessages] ||
        'Account created successfully! You can now log in.';

      toast.success(successMessage, {
        duration: 5000,
        position: 'top-center',
      });

      // Small delay to let user see the success message
      setTimeout(() => {
        if (onNavigateToLogin) {
          onNavigateToLogin();
        } else {
          router.navigateTo('login');
        }
      }, 2000);
    } catch (error: any) {
      console.error('Failed to accept invitation:', error);

      // Enhanced error handling with specific messages
      let errorMessage = 'Failed to create account. Please try again.';

      if (error.response?.status === 400) {
        errorMessage =
          error.response.data?.message || 'Invalid invitation data. Please check your information.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Invitation not found or has expired. Please request a new invitation.';
      } else if (error.response?.status === 409) {
        errorMessage = 'An account with this email already exists. Please try logging in instead.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error occurred. Please try again later or contact support.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }

      toast.error(errorMessage, {
        duration: 6000,
        position: 'top-center',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <LoadingSpinner />
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>Invalid Invitation</h2>
          <p className='text-gray-600 mb-4'>This invitation link is invalid or has expired.</p>
          <button
            onClick={() => (onNavigateToLogin ? onNavigateToLogin() : router.navigateTo('login'))}
            className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700'
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='text-center'>
          <div className='mx-auto w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center mb-4'>
            <GraduationCap className='w-8 h-8 text-white' />
          </div>
          <h2 className='text-3xl font-bold text-gray-900'>Complete Your Registration</h2>
          <p className='mt-2 text-sm text-gray-600'>
            You've been invited to join as a{' '}
            <span className='font-semibold capitalize text-blue-600'>{invitation.role}</span>
          </p>
          <p className='mt-1 text-xs text-gray-500'>
            Please fill in the required information to activate your account
          </p>
        </div>
      </div>

      <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-2xl'>
        <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
          {/* Invitation Details - Read-only Information */}
          <div className='mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200'>
            <h3 className='text-lg font-medium text-blue-900 mb-3 flex items-center'>
              <Mail className='w-5 h-5 mr-2' />
              Invitation Details
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm'>
              <div className='flex items-center space-x-2'>
                <Mail className='w-4 h-4 text-blue-600 flex-shrink-0' />
                <div>
                  <span className='text-gray-500'>Email:</span>
                  <span className='ml-1 font-medium text-gray-900'>{invitation.email}</span>
                </div>
              </div>

              <div className='flex items-center space-x-2'>
                <User className='w-4 h-4 text-blue-600 flex-shrink-0' />
                <div>
                  <span className='text-gray-500'>Role:</span>
                  <span className='ml-1 font-medium text-gray-900 capitalize'>
                    {invitation.role}
                  </span>
                </div>
              </div>

              <div className='flex items-center space-x-2'>
                <Building className='w-4 h-4 text-blue-600 flex-shrink-0' />
                <div>
                  <span className='text-gray-500'>College:</span>
                  <span className='ml-1 font-medium text-gray-900'>
                    {invitation.collegeName || 'Not specified'}
                  </span>
                </div>
              </div>

              {(invitation.departmentName || invitation.role !== 'principal') && (
                <div className='flex items-center space-x-2'>
                  <Users className='w-4 h-4 text-blue-600 flex-shrink-0' />
                  <div>
                    <span className='text-gray-500'>Department:</span>
                    <span className='ml-1 font-medium text-gray-900'>
                      {invitation.departmentName || 'Not specified'}
                    </span>
                  </div>
                </div>
              )}

              {invitation.role === 'student' && invitation.yearOfStudy && (
                <div className='flex items-center space-x-2'>
                  <GraduationCap className='w-4 h-4 text-blue-600 flex-shrink-0' />
                  <div>
                    <span className='text-gray-500'>Year of Study:</span>
                    <span className='ml-1 font-medium text-gray-900'>
                      {invitation.academicYearName || 'N/A'}
                    </span>
                    {/* <span className="ml-1 font-medium text-gray-900">
                      {invitation.yearOfStudy === 1 ? '1st Year' :
                        invitation.yearOfStudy === 2 ? '2nd Year' :
                          invitation.yearOfStudy === 3 ? '3rd Year' :
                            invitation.yearOfStudy === 4 ? '4th Year' :
                              `${invitation.yearOfStudy} Year`}
                    </span> */}
                  </div>
                </div>
              )}

              {invitation.role === 'student' && invitation.section && (
                <div className='flex items-center space-x-2'>
                  <Users className='w-4 h-4 text-blue-600 flex-shrink-0' />
                  <div>
                    <span className='text-gray-500'>Section:</span>
                    <span className='ml-1 font-medium text-gray-900'>{invitation.section}</span>
                  </div>
                </div>
              )}
            </div>

            {invitation.sentByName && (
              <div className='mt-3 pt-3 border-t border-blue-200'>
                <div className='text-xs text-blue-700'>
                  Invited by: <span className='font-medium'>{invitation.sentByName}</span>
                  {invitation.sentAt && (
                    <span className='ml-2'>
                      on {new Date(invitation.sentAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Basic Information - Editable Fields */}
            <div className='space-y-4'>
              <h3 className='text-lg font-medium text-gray-900 border-b pb-2 flex items-center'>
                <User className='w-5 h-5 mr-2 text-blue-600' />
                Personal Information
                <span className='ml-2 text-xs text-gray-500 font-normal'>(Editable)</span>
              </h3>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Full Name *
                  <span className='text-xs text-gray-500 ml-1'>(as per official documents)</span>
                </label>
                <input
                  type='text'
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.name
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder='Enter your complete full name'
                  maxLength={100}
                />
                {errors.name && (
                  <p className='text-red-500 text-xs mt-1 flex items-center'>
                    <span className='w-1 h-1 bg-red-500 rounded-full mr-1'></span>
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Phone Number *
                  <span className='text-xs text-gray-500 ml-1'>
                    (10-digit Indian mobile number)
                  </span>
                </label>
                <input
                  type='tel'
                  value={formData.phone}
                  onChange={e => {
                    // Allow only numbers and + symbol
                    const value = e.target.value.replace(/[^\d+]/g, '');
                    setFormData({ ...formData, phone: value });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.phone
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  placeholder='9876543210 or +919876543210'
                  maxLength={13}
                />
                {errors.phone && (
                  <p className='text-red-500 text-xs mt-1 flex items-center'>
                    <span className='w-1 h-1 bg-red-500 rounded-full mr-1'></span>
                    {errors.phone}
                  </p>
                )}
                {!errors.phone && formData.phone && validatePhoneNumber(formData.phone) && (
                  <p className='text-blue-600 text-xs mt-1 flex items-center'>
                    <span className='w-1 h-1 bg-blue-600 rounded-full mr-1'></span>
                    Valid phone number
                  </p>
                )}
              </div>
            </div>

            {/* Password Section - Secure Setup */}
            <div className='space-y-4'>
              <h3 className='text-lg font-medium text-gray-900 border-b pb-2 flex items-center'>
                <Eye className='w-5 h-5 mr-2 text-blue-600' />
                Account Security
                <span className='ml-2 text-xs text-gray-500 font-normal'>
                  (Create strong password)
                </span>
              </h3>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Password *
                  <span className='text-xs text-gray-500 ml-1'>
                    (minimum 8 characters with mixed case, numbers & symbols)
                  </span>
                </label>
                <div className='relative'>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 transition-colors ${
                      errors.password
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    placeholder='Create a strong password'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors'
                  >
                    {showPassword ? (
                      <EyeOff className='w-4 h-4 text-gray-400' />
                    ) : (
                      <Eye className='w-4 h-4 text-gray-400' />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className='mt-2'>
                    <div className='text-xs text-gray-600 mb-1'>Password strength:</div>
                    <div className='flex space-x-1'>
                      {[1, 2, 3, 4].map(level => {
                        const passwordErrors = validatePasswordStrength(formData.password);
                        const strength = 4 - passwordErrors.length;
                        return (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded ${
                              level <= strength
                                ? strength === 1
                                  ? 'bg-red-500'
                                  : strength === 2
                                    ? 'bg-yellow-500'
                                    : strength === 3
                                      ? 'bg-blue-500'
                                      : 'bg-blue-500'
                                : 'bg-gray-200'
                            }`}
                          />
                        );
                      })}
                    </div>
                    <div className='text-xs mt-1'>
                      {validatePasswordStrength(formData.password).length === 0 ? (
                        <span className='text-blue-600'>Strong password ✓</span>
                      ) : (
                        <span className='text-gray-500'>
                          Missing: {validatePasswordStrength(formData.password).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {errors.password && (
                  <p className='text-red-500 text-xs mt-1 flex items-center'>
                    <span className='w-1 h-1 bg-red-500 rounded-full mr-1'></span>
                    {errors.password}
                  </p>
                )}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Confirm Password *
                  <span className='text-xs text-gray-500 ml-1'>
                    (must match the password above)
                  </span>
                </label>
                <div className='relative'>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 transition-colors ${
                      errors.confirmPassword
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    placeholder='Re-enter your password'
                  />
                  <button
                    type='button'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className='absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors'
                  >
                    {showConfirmPassword ? (
                      <EyeOff className='w-4 h-4 text-gray-400' />
                    ) : (
                      <Eye className='w-4 h-4 text-gray-400' />
                    )}
                  </button>
                </div>
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className='text-blue-600 text-xs mt-1 flex items-center'>
                    <span className='w-1 h-1 bg-blue-600 rounded-full mr-1'></span>
                    Passwords match ✓
                  </p>
                )}
                {errors.confirmPassword && (
                  <p className='text-red-500 text-xs mt-1 flex items-center'>
                    <span className='w-1 h-1 bg-red-500 rounded-full mr-1'></span>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
            {/* Student-specific fields */}
            {invitation.role === 'student' && (
              <div className='space-y-4'>
                <h3 className='text-lg font-medium text-gray-900 border-b pb-2 flex items-center'>
                  <GraduationCap className='w-5 h-5 mr-2 text-blue-600' />
                  Academic Information
                </h3>

                {/* Static Academic Information Display
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border">
                  {invitation.yearOfStudy && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Year of Study</label>
                      <div className="text-sm font-medium text-gray-900 p-2 bg-white rounded border">
                        {invitation.yearOfStudy === 1 ? '1st Year' :
                         invitation.yearOfStudy === 2 ? '2nd Year' :
                         invitation.yearOfStudy === 3 ? '3rd Year' :
                         invitation.yearOfStudy === 4 ? '4th Year' :
                         `${invitation.yearOfStudy} Year`}
                      </div>
                    </div>
                  )}

                  {invitation.section && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Section</label>
                      <div className="text-sm font-medium text-gray-900 p-2 bg-white rounded border">
                        {invitation.section}
                      </div>
                    </div>
                  )}
                </div> */}

                {/* Editable Roll Number */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Roll Number *
                    <span className='text-xs text-gray-500 ml-1'>
                      (your student registration number)
                    </span>
                  </label>
                  <input
                    type='text'
                    value={formData.rollNumber}
                    onChange={e =>
                      setFormData({ ...formData, rollNumber: e.target.value.toUpperCase() })
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.rollNumber
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    placeholder='Enter your roll number'
                    maxLength={20}
                  />
                  {errors.rollNumber && (
                    <p className='text-red-500 text-xs mt-1 flex items-center'>
                      <span className='w-1 h-1 bg-red-500 rounded-full mr-1'></span>
                      {errors.rollNumber}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Staff/HOD-specific fields */}
            {(invitation.role === 'staff' || invitation.role === 'hod') && (
              <div className='space-y-4'>
                <h3 className='text-lg font-medium text-gray-900 border-b pb-2'>
                  Professional Information
                </h3>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Designation *
                  </label>
                  <input
                    type='text'
                    value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.designation ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder='e.g., Assistant Professor, Associate Professor'
                  />
                  {errors.designation && (
                    <p className='text-red-500 text-xs mt-1'>{errors.designation}</p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Qualification *
                  </label>
                  <input
                    type='text'
                    value={formData.qualification}
                    onChange={e => setFormData({ ...formData, qualification: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.qualification ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder='e.g., M.Tech, Ph.D, M.Sc'
                  />
                  {errors.qualification && (
                    <p className='text-red-500 text-xs mt-1'>{errors.qualification}</p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Experience (Years)
                  </label>
                  <input
                    type='number'
                    min='0'
                    max='50'
                    value={formData.experience}
                    onChange={e =>
                      setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    placeholder='Years of experience'
                  />
                </div>
              </div>
            )}

            {/* Principal-specific fields */}
            {invitation.role === 'principal' && (
              <div className='space-y-4'>
                <h3 className='text-lg font-medium text-gray-900 border-b pb-2'>
                  Administrative Information
                </h3>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Administrative Notes
                  </label>
                  <textarea
                    value={formData.adminNotes}
                    onChange={e => setFormData({ ...formData, adminNotes: e.target.value })}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    rows={3}
                    placeholder='Any additional notes or information'
                  />
                </div>
              </div>
            )}

            <div className='flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200'>
              <button
                type='submit'
                disabled={submitting}
                className='flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-blue-700 flex items-center justify-center space-x-2 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none'
              >
                {submitting ? (
                  <>
                    <div className='animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent'></div>
                    <span>Creating Your Account...</span>
                  </>
                ) : (
                  <>
                    <User className='w-5 h-5' />
                    <span>Complete Registration</span>
                  </>
                )}
              </button>
              <button
                type='button'
                onClick={() =>
                  onNavigateToLogin ? onNavigateToLogin() : router.navigateTo('login')
                }
                disabled={submitting}
                className='px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium'
              >
                Back to Login
              </button>
            </div>

            {/* Additional Help Text */}
            <div className='mt-4 text-center'>
              <p className='text-xs text-gray-500'>
                By creating an account, you agree to the terms and conditions of the One Student One
                Learning Management System.
              </p>
              {invitation?.expiresAt && (
                <p className='text-xs text-orange-600 mt-1'>
                  ⚠️ This invitation expires on{' '}
                  {new Date(invitation.expiresAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InvitationAcceptance;
