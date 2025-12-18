import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, User, Mail, Phone, Building, GraduationCap, UserCheck } from 'lucide-react';
import { ApiService } from '../../services/api';
import { College, Department } from '../../types/api';
import { useToast } from '../UI/Toast';
import OptimizedDropdown from '../UI/OptimizedDropdown';
// Removed unused imports

interface SignUpPopupProps {
  onClose: () => void;
  onSuccess: () => void;
}

const SignUpPopup: React.FC<SignUpPopupProps> = ({ onClose, onSuccess }) => {
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    collegeId: '',
    departmentId: '',
    class: '',
    rollNumber: '',
    // Faculty-specific fields
    employeeId: '',
    designation: ''
  });
  const [colleges, setColleges] = useState<College[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<{id: string, name: string}[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // Filter departments based on selected college
    if (formData.collegeId) {
      // Use the public API to get departments for the selected college
      const loadDepartmentsForCollege = async () => {
        try {
          const collegeDeptsData = await ApiService.getDepartmentsByCollegePublic(formData.collegeId);
          setFilteredDepartments(collegeDeptsData || []);
          // Reset department selection if current selection is not valid for the new college
          if (formData.departmentId && !collegeDeptsData.find(d => d.id === formData.departmentId)) {
            setFormData(prev => ({ ...prev, departmentId: '', class: '' }));
          }
        } catch (error) {
          console.error('Failed to load departments for college:', error);
          toast.warning('Loading departments failed', 'Using cached data instead');
          // Fallback to client-side filtering
          const filtered = departments.filter(dept => dept.collegeId === formData.collegeId);
          setFilteredDepartments(filtered);
        }
      };
      loadDepartmentsForCollege();
    } else {
      setFilteredDepartments([]);
      setFormData(prev => ({ ...prev, departmentId: '', class: '' }));
    }
  }, [formData.collegeId, departments]);

  useEffect(() => {
    // Load classes based on selected college and department
    if (formData.collegeId && formData.departmentId && formData.role === 'student') {
      const loadClassesForDepartment = async () => {
        try {
          const classesData = await ApiService.getClassesByDepartmentPublic(formData.collegeId, formData.departmentId);
          setClasses(classesData || []);
          // Reset class selection if current selection is not valid for the new department
          if (formData.class && !classesData.find(c => c.id === formData.class)) {
            setFormData(prev => ({ ...prev, class: '' }));
          }
        } catch (error) {
          console.error('Failed to load classes for department:', error);
          toast.warning('Loading classes failed', 'Please try selecting the department again');
          setClasses([]);
        }
      };
      loadClassesForDepartment();
    } else {
      setClasses([]);
      setFormData(prev => ({ ...prev, class: '' }));
    }
  }, [formData.collegeId, formData.departmentId, formData.role]);

  const loadInitialData = async () => {
    try {
      const [collegesData, departmentsData] = await Promise.all([
        ApiService.getCollegesPublic(),
        ApiService.getDepartmentsPublic()
      ]);
      setColleges(collegesData || []);
      setDepartments(departmentsData || []);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      toast.error('Failed to load form data', 'Please try refreshing the page');
    } finally {
      setLoadingData(false);
    }
  };

  // Mutation for creating registration request
  const createRegistrationMutation = useMutation({
    mutationFn: (data: any) => ApiService.createRegistrationRequest(data),
    onSuccess: () => {
      toast.success('Registration submitted successfully! You will be notified once approved.');
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Failed to submit registration request:', error);
      toast.error('Registration failed', 'Failed to submit registration request. Please try again.');
    },
  });

  const loading = createRegistrationMutation.isPending;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createRegistrationMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const roleOptions = [
    { value: 'student', label: 'Student', icon: GraduationCap },
    { value: 'staff', label: 'Staff Member', icon: UserCheck },
    { value: 'hod', label: 'Head of Department', icon: User },
    { value: 'principal', label: 'Principal', icon: Building }
  ];

  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header - Role-based title */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            {formData.role === 'student' && <GraduationCap className="h-6 w-6 text-blue-600" />}
            {formData.role === 'staff' && <UserCheck className="h-6 w-6 text-blue-600" />}
            {formData.role === 'hod' && <User className="h-6 w-6 text-purple-600" />}
            {formData.role === 'principal' && <Building className="h-6 w-6 text-orange-600" />}
            {!formData.role && <User className="h-6 w-6 text-gray-600" />}
            <h2 className="text-xl font-bold text-gray-900">
              {formData.role === 'student' && 'Student Registration'}
              {formData.role === 'staff' && 'Staff Registration'}
              {formData.role === 'hod' && 'HOD Registration'}
              {formData.role === 'principal' && 'Principal Registration'}
              {!formData.role && 'Registration Form'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* First Name and Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  value={formData.name?.split(' ')[0] || ''}
                  onChange={(e) => {
                    const lastName = formData.name?.split(' ').slice(1).join(' ') || '';
                    handleInputChange('name', `${e.target.value} ${lastName}`.trim());
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your first name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  value={formData.name?.split(' ').slice(1).join(' ') || ''}
                  onChange={(e) => {
                    const firstName = formData.name?.split(' ')[0] || '';
                    handleInputChange('name', `${firstName} ${e.target.value}`.trim());
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your last name"
                  required
                />
              </div>
            </div>
          </div>

          {/* Email - Role-specific placeholders */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email ID *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={
                  formData.role === 'student' ? 'student@college.edu' :
                  formData.role === 'staff' ? 'staff@college.edu' :
                  formData.role === 'hod' ? 'hod@college.edu' :
                  formData.role === 'principal' ? 'principal@college.edu' :
                  'Enter your email ID'
                }
                required
              />
            </div>
            {formData.role && (
              <p className="text-xs text-gray-500 mt-1">
                {formData.role === 'student' && 'Use your personal or college-provided email address'}
                {formData.role === 'staff' && 'Use your official college email address'}
                {formData.role === 'hod' && 'Use your official HOD email address'}
                {formData.role === 'principal' && 'Use your official principal email address'}
              </p>
            )}
          </div>

          {/* Phone - Role-specific validation hints */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={
                  formData.role === 'student' ? '+91 98765 43210 (Personal)' :
                  formData.role === 'staff' ? '+91 98765 43210 (Official)' :
                  formData.role === 'hod' ? '+91 98765 43210 (Office)' :
                  formData.role === 'principal' ? '+91 98765 43210 (Office)' :
                  'Enter your phone number'
                }
                required
              />
            </div>
            {formData.role && (
              <p className="text-xs text-gray-500 mt-1">
                {formData.role === 'student' && 'Your personal contact number for important notifications'}
                {(formData.role === 'staff' || formData.role === 'hod' || formData.role === 'principal') && 'Official contact number for administrative communications'}
              </p>
            )}
          </div>

          {/* Role Selection - Enhanced with descriptions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">👤 Select your role</option>
              {roleOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.value === 'student' && '🎓 '}
                  {option.value === 'staff' && '👨‍🏫 '}
                  {option.value === 'hod' && '👔 '}
                  {option.value === 'principal' && '🏛️ '}
                  {option.label}
                </option>
              ))}
            </select>
            {formData.role && (
              <p className="text-xs text-gray-500 mt-1">
                {formData.role === 'student' && 'Access student portal, view grades, and track academic progress'}
                {formData.role === 'staff' && 'Manage classes, students, and academic activities'}
                {formData.role === 'hod' && 'Oversee department operations and manage faculty'}
                {formData.role === 'principal' && 'Manage entire institution and administrative functions'}
              </p>
            )}
          </div>

          {/* College */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              College *
            </label>
            <OptimizedDropdown
              options={colleges.map(college => ({
                value: college.id,
                label: college.name
              }))}
              value={formData.collegeId}
              onChange={(value) => handleInputChange('collegeId', value)}
              placeholder="🏛️ Select your college"
              required
              searchable
              className="w-full"
            />
          </div>

          {/* Department */}
          {formData.role !== 'principal' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department {formData.role !== 'principal' ? '*' : ''}
              </label>
              <OptimizedDropdown
                options={filteredDepartments.map(department => ({
                  value: department.id,
                  label: department.name
                }))}
                value={formData.departmentId}
                onChange={(value) => handleInputChange('departmentId', value)}
                placeholder="🏢 Select your department"
                required={formData.role !== 'principal'}
                disabled={!formData.collegeId}
                searchable
                className="w-full"
              />
              {!formData.collegeId && (
                <p className="text-xs text-gray-500 mt-1">Please select a college first</p>
              )}
            </div>
          )}

          {/* Class - Only for students */}
          {formData.role === 'student' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class *
              </label>
              <select
                value={formData.class}
                onChange={(e) => handleInputChange('class', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={!formData.collegeId || !formData.departmentId}
              >
                <option value="">Select your class</option>
                {classes.map(classItem => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </option>
                ))}
              </select>
              {(!formData.collegeId || !formData.departmentId) && (
                <p className="text-xs text-gray-500 mt-1">Please select college and department first</p>
              )}
            </div>
          )}

          {/* Roll Number - Only for students */}
          {formData.role === 'student' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Roll Number
              </label>
              <input
                type="text"
                value={formData.rollNumber}
                onChange={(e) => handleInputChange('rollNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your roll number (optional)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your official college registration number (e.g., 2024CSE001)
              </p>
            </div>
          )}

          {/* Employee ID - Only for faculty */}
          {(formData.role === 'staff' || formData.role === 'hod' || formData.role === 'principal') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee ID *
              </label>
              <input
                type="text"
                value={formData.employeeId || ''}
                onChange={(e) => handleInputChange('employeeId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your employee ID"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Your official college employee identification number
              </p>
            </div>
          )}

          {/* Designation - Only for faculty */}
          {(formData.role === 'staff' || formData.role === 'hod') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Designation *
              </label>
              <select
                value={formData.designation || ''}
                onChange={(e) => handleInputChange('designation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select your designation</option>
                {formData.role === 'staff' && (
                  <>
                    <option value="assistant_professor">Assistant Professor</option>
                    <option value="associate_professor">Associate Professor</option>
                    <option value="professor">Professor</option>
                    <option value="lecturer">Lecturer</option>
                    <option value="lab_assistant">Lab Assistant</option>
                    <option value="admin_staff">Administrative Staff</option>
                  </>
                )}
                {formData.role === 'hod' && (
                  <>
                    <option value="hod_professor">HOD & Professor</option>
                    <option value="hod_associate">HOD & Associate Professor</option>
                    <option value="hod_assistant">HOD & Assistant Professor</option>
                  </>
                )}
              </select>
            </div>
          )}

          {/* Role-specific Registration Info */}
          <div className={`border rounded-lg p-4 ${
            formData.role === 'student' ? 'bg-blue-50 border-blue-200' :
            formData.role === 'staff' ? 'bg-blue-50 border-blue-200' :
            formData.role === 'hod' ? 'bg-purple-50 border-purple-200' :
            formData.role === 'principal' ? 'bg-orange-50 border-orange-200' :
            'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {formData.role === 'student' && <GraduationCap className="h-5 w-5 text-blue-500" />}
                {formData.role === 'staff' && <UserCheck className="h-5 w-5 text-blue-500" />}
                {formData.role === 'hod' && <User className="h-5 w-5 text-purple-500" />}
                {formData.role === 'principal' && <Building className="h-5 w-5 text-orange-500" />}
                {!formData.role && <UserCheck className="h-5 w-5 text-gray-400" />}
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${
                  formData.role === 'student' ? 'text-blue-800' :
                  formData.role === 'staff' ? 'text-blue-800' :
                  formData.role === 'hod' ? 'text-purple-800' :
                  formData.role === 'principal' ? 'text-orange-800' :
                  'text-gray-800'
                }`}>
                  {formData.role === 'student' && 'Student Registration Process'}
                  {formData.role === 'staff' && 'Faculty Registration Process'}
                  {formData.role === 'hod' && 'HOD Registration Process'}
                  {formData.role === 'principal' && 'Principal Registration Process'}
                  {!formData.role && 'Registration Process'}
                </h3>
                <div className={`mt-2 text-sm ${
                  formData.role === 'student' ? 'text-blue-700' :
                  formData.role === 'staff' ? 'text-blue-700' :
                  formData.role === 'hod' ? 'text-purple-700' :
                  formData.role === 'principal' ? 'text-orange-700' :
                  'text-gray-700'
                }`}>
                  <p>
                    {formData.role === 'student' && 'Your student registration will be reviewed by the academic office. You will receive login credentials via email once approved.'}
                    {formData.role === 'staff' && 'Your faculty registration will be reviewed by the administration. Access to teaching portal will be granted upon approval.'}
                    {formData.role === 'hod' && 'Your HOD registration requires principal approval. You will receive administrative access once verified.'}
                    {formData.role === 'principal' && 'Your principal registration requires system administrator verification. Full institutional access will be granted upon approval.'}
                    {!formData.role && 'Your registration request will be reviewed by the system administrator. You will receive an email notification once your account is approved and activated.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Role-specific Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                formData.role === 'student' ? 'bg-blue-600 hover:bg-blue-700' :
                formData.role === 'staff' ? 'bg-blue-600 hover:bg-blue-700' :
                formData.role === 'hod' ? 'bg-purple-600 hover:bg-purple-700' :
                formData.role === 'principal' ? 'bg-orange-600 hover:bg-orange-700' :
                'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {loading ? 'Submitting...' :
                formData.role === 'student' ? 'Submit Student Registration' :
                formData.role === 'staff' ? 'Submit Faculty Registration' :
                formData.role === 'hod' ? 'Submit HOD Registration' :
                formData.role === 'principal' ? 'Submit Principal Registration' :
                'Submit Registration Request'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUpPopup;
