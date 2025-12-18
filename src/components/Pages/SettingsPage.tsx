import React, { useState, useEffect } from 'react';
import { User, Edit, Eye, EyeOff, Save, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ApiService } from '../../services/api';
import { useProfile, useUpdateProfile, useChangePassword } from '../../hooks/api/useProfile';
import { toast } from 'react-hot-toast';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    department: '',
    yearOfStudy: '',
    hod: '',
    rollNumber: '',
    semester: '',
    profileImageUrl: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Update profile data when profile is loaded
  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        college: profile.collegeName || 'Not assigned',
        department: profile.departmentName || 'Not assigned',
        yearOfStudy: profile.yearOfStudy || profile.year_of_study || 'Not specified', // Fixed: Use proper year field
        hod: profile.hodName || 'Not assigned',
        rollNumber: profile.rollNumber || profile.registrationNumber || 'Not assigned',
        semester: profile.semester || 'Not specified',
        profileImageUrl: profile.profileImageUrl || ''
      });
    }
  }, [profile]);

  const handleProfileSave = async () => {
    try {
      // Only send fields that the backend accepts (name and phone)
      const updateData: any = {};
      
      // Always include name if it's not empty
      if (profileData.name && profileData.name.trim()) {
        updateData.name = profileData.name.trim();
      }
      
      // Only include phone if it's not empty and valid
      if (profileData.phone && profileData.phone.trim()) {
        const cleanPhone = profileData.phone.trim();
        // Basic validation: at least 10 digits
        if (cleanPhone.length >= 10) {
          updateData.phone = cleanPhone;
        }
      }
      
      console.log('Sending profile update with data:', updateData);
      
      await updateProfileMutation.mutateAsync(updateData);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || error.message || 'Failed to update profile. Please try again.');
    }
  };

  const handlePasswordChange = async () => {
    // Enhanced validation
    if (!passwordData.currentPassword.trim()) {
      toast.error('Current password is required!');
      return;
    }

    if (!passwordData.newPassword.trim()) {
      toast.error('New password is required!');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match!');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long!');
      return;
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(passwordData.newPassword);
    const hasLowerCase = /[a-z]/.test(passwordData.newPassword);
    const hasNumbers = /\d/.test(passwordData.newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      toast.error('Password must contain at least one uppercase letter, one lowercase letter, and one number!');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error('New password must be different from current password!');
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });

      // Reset form and hide password fields
      setShowPasswordForm(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowCurrentPassword(false);
      setShowNewPassword(false);

      toast.success('Password changed successfully! For security, please log in again with your new password.');

    } catch (error: any) {
      console.error('Failed to change password:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to change password. Please check your current password and try again.';
      toast.error(errorMessage);
    }
  };

  // Show loading state
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-50 pt-2 lg:pt-0 pb-16 lg:pb-6">
        <div className="p-3 lg:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 lg:p-6">
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading profile...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (profileError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-50 pt-2 lg:pt-0 pb-16 lg:pb-6">
        <div className="p-3 lg:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 lg:p-6">
                <div className="text-center py-12">
                  <div className="text-red-600 mb-4">
                    <X className="w-12 h-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load profile</h3>
                  <p className="text-gray-600 mb-4">There was an error loading your profile information.</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-50 pt-2 lg:pt-0 pb-16 lg:pb-6">
      <div className="p-3 lg:p-6">
        <div className="max-w-4xl mx-auto">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <User className="w-6 lg:w-8 h-6 lg:h-8 text-blue-600 mr-2 lg:mr-3" />
            <span className="lg:hidden">Account Info</span>
            <span className="hidden lg:inline">Account Information</span>
          </h1>
          <p className="text-gray-600 text-sm lg:text-base">Manage your account details and settings</p>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4 lg:mb-6">
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center space-x-3 lg:space-x-4 mb-4 lg:mb-0">
                <div className="w-12 lg:w-16 h-12 lg:h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 lg:w-8 h-6 lg:h-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg lg:text-xl font-semibold text-gray-900">{profile?.name || 'Loading...'}</h2>
                  <p className="text-gray-600 text-sm lg:text-base">
                    {profile?.role === 'student'
                      ? `${profile?.yearOfStudy || 'Year not specified'}, ${profile?.department || 'Department not assigned'}`
                      : profile?.role || 'Role not specified'
                    }
                  </p>
                </div>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  disabled={updateProfileMutation.isLoading}
                  className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full lg:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-4 lg:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                {isEditing && profile?.role !== 'student' ? (
                  <input
                    type="text"
                    value={profileData.name?.split(' ')[0] || ''}
                    onChange={(e) => {
                      const lastName = profileData.name?.split(' ').slice(1).join(' ') || '';
                      setProfileData({ ...profileData, name: `${e.target.value} ${lastName}`.trim() });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                    placeholder="Enter your first name"
                  />
                ) : (
                  <p className="text-gray-900 text-sm lg:text-base bg-gray-50 px-3 py-2 rounded-lg">{profileData.name?.split(' ')[0] || 'Not set'}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                {isEditing && profile?.role !== 'student' ? (
                  <input
                    type="text"
                    value={profileData.name?.split(' ').slice(1).join(' ') || ''}
                    onChange={(e) => {
                      const firstName = profileData.name?.split(' ')[0] || '';
                      setProfileData({ ...profileData, name: `${firstName} ${e.target.value}`.trim() });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                    placeholder="Enter your last name"
                  />
                ) : (
                  <p className="text-gray-900 text-sm lg:text-base bg-gray-50 px-3 py-2 rounded-lg">{profileData.name?.split(' ').slice(1).join(' ') || 'Not set'}</p>
                )}
              </div>

              {/* College - Show for all roles except admin */}
              {profile?.role !== 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">College</label>
                  <p className="text-gray-900 text-sm lg:text-base bg-gray-50 px-3 py-2 rounded-lg">{profileData.college}</p>
                </div>
              )}

              {/* Department - Show for student, staff, hod */}
              {(profile?.role === 'student' || profile?.role === 'staff' || profile?.role === 'hod') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <p className="text-gray-900 text-sm lg:text-base bg-gray-50 px-3 py-2 rounded-lg">{profileData.department}</p>
                </div>
              )}

              {/* Year of Study - Show only for students */}
              {profile?.role === 'student' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year of Study</label>
                  {isEditing && profile?.role !== 'student' ? (
                    <input
                      type="text"
                      value={profileData.yearOfStudy || ''}
                      onChange={(e) => setProfileData({ ...profileData, yearOfStudy: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                      placeholder="e.g., 1st Year"
                    />
                  ) : (
                    <p className="text-gray-900 text-sm lg:text-base bg-gray-50 px-3 py-2 rounded-lg">{profileData.yearOfStudy}</p>
                  )}
                </div>
              )}

              {/* HOD - Show only for students */}
              {profile?.role === 'student' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">HOD</label>
                  <p className="text-gray-900 text-sm lg:text-base bg-gray-50 px-3 py-2 rounded-lg">{profileData.hod}</p>
                </div>
              )}

              {/* Registration Number - Show only for students */}
              {profile?.role === 'student' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number</label>
                  <p className="text-gray-900 text-sm lg:text-base bg-gray-50 px-3 py-2 rounded-lg">{profileData.rollNumber}</p>
                </div>
              )}

              {/* Semester - Show only for students */}
              {/* {profile?.role === 'student' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                  {isEditing && profile?.role !== 'student' ? (
                    <input
                      type="text"
                      value={profileData.semester || ''}
                      onChange={(e) => setProfileData({ ...profileData, semester: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                      placeholder="e.g., 1st Semester"
                    />
                  ) : (
                    <p className="text-gray-900 text-sm lg:text-base bg-gray-50 px-3 py-2 rounded-lg">{profileData.semester}</p>
                  )}
                </div>
              )} */}

              {/* Phone Number - Show for all roles */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                {isEditing  ? (
                  <input
                    type="tel"
                    value={profileData.phone || ''}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <p className="text-gray-900 text-sm lg:text-base bg-gray-50 px-3 py-2 rounded-lg">{profileData.phone || 'Not set'}</p>
                )}
              </div>

              {/* Email ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email ID</label>
                <p className="text-gray-900 text-sm lg:text-base bg-gray-50 px-3 py-2 rounded-lg break-all">{profileData.email}</p>
              </div>

              {/* Password */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-3 space-y-2 lg:space-y-0">
                  <p className="text-gray-900 text-sm lg:text-base bg-gray-50 px-3 py-2 rounded-lg flex-1">••••••••</p>
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors w-full lg:w-auto text-center"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons for Edit Mode */}
            {isEditing && (
              <div className="flex flex-col lg:flex-row space-y-3 lg:space-y-0 lg:space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleProfileSave}
                  disabled={updateProfileMutation.isLoading}
                  className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 lg:py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 w-full lg:w-auto"
                >
                  {updateProfileMutation.isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}</span>
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    // Reset form data to original profile data
                    if (profile) {
                      setProfileData({
                        name: profile.name || '',
                        email: profile.email || '',
                        phone: profile.phone || '',
                        college: profile.collegeName || 'Not assigned',
                        department: profile.departmentName || 'Not assigned',
                        yearOfStudy: profile.yearOfStudy || profile.year_of_study || 'Not specified', // Fixed: Use proper year field
                        hod: profile.hodName || 'Not assigned',
                        rollNumber: profile.rollNumber || profile.registrationNumber || 'Not assigned',
                        semester: profile.semester || 'Not specified',
                        profileImageUrl: profile.profileImageUrl || ''
                      });
                    }
                  }}
                  className="flex items-center justify-center space-x-2 bg-gray-600 text-white px-6 py-3 lg:py-2 rounded-lg hover:bg-gray-700 transition-colors w-full lg:w-auto"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Settings for Mobile */}
        <div className="lg:hidden grid grid-cols-2 gap-3 mb-4">
          <div className="bg-blue-100 rounded-xl p-3 text-center">
            <Edit className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-blue-800">Edit Profile</h4>
            <p className="text-xs text-blue-700">Update details</p>
          </div>
          <div className="bg-purple-100 rounded-xl p-3 text-center">
            <EyeOff className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-purple-800">Security</h4>
            <p className="text-xs text-purple-700">Change password</p>
          </div>
        </div>

        {/* Account Security Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 lg:p-6">
          <h3 className="text-base lg:text-lg font-semibold text-blue-900 mb-3 lg:mb-4">Account Security</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm lg:text-base text-blue-800">Two-factor authentication</span>
              <span className="text-xs lg:text-sm bg-red-100 text-red-700 px-2 py-1 rounded">Disabled</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm lg:text-base text-blue-800">Last login</span>
              <span className="text-xs lg:text-sm text-blue-700">Today, 10:30 AM</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm lg:text-base text-blue-800">Active sessions</span>
              <span className="text-xs lg:text-sm text-blue-700">1 device</span>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-4 lg:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>

            <div className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                />
              </div>
            </div>

            <div className="flex flex-col lg:flex-row space-y-3 lg:space-y-0 lg:space-x-3 mt-6">
              <button
                onClick={handlePasswordChange}
                disabled={changePasswordMutation.isLoading}
                className="flex-1 bg-blue-600 text-white py-3 lg:py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {changePasswordMutation.isLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span>{changePasswordMutation.isLoading ? 'Changing...' : 'Change Password'}</span>
              </button>
              <button
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="flex-1 bg-gray-600 text-white py-3 lg:py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default SettingsPage;
