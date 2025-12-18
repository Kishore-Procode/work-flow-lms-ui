import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, EyeIcon, EyeSlashIcon, KeyIcon, CheckCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { ApiService } from '../../services/api';

interface ResetPasswordProps {
  email: string;
  otp: string;
  onBack: () => void;
  onSuccess: () => void;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ email, otp, onBack, onSuccess }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(10 * 60); // 10 minutes in seconds

  // Countdown timer for session timeout
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error('Session expired. Please start the password reset process again.');
          onBack(); // Go back to login
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onBack]);

  // Format time remaining
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Password strength validation
  const validatePassword = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
    };

    const isValid = Object.values(requirements).every(req => req);
    return { requirements, isValid };
  };

  const passwordValidation = validatePassword(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setError('Both password fields are required');
      return;
    }

    if (!passwordValidation.isValid) {
      setError('Password does not meet the requirements');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await ApiService.resetPassword(email, otp, newPassword, confirmPassword);

      if (response.success) {
        toast.success('Password Reset Successful! Your password has been reset successfully. You can now login with your new password.');
        onSuccess();
      } else {
        setError(response.message || 'Failed to reset password');
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to reset password. Please try again.';
      setError(errorMessage);
      toast.error('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const maskEmail = (email: string): string => {
    const [local, domain] = email.split('@');
    const maskedLocal = local.length > 2 ? 
      local[0] + '*'.repeat(local.length - 2) + local[local.length - 1] : 
      local;
    return `${maskedLocal}@${domain}`;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Main Content Panel - Full width on mobile, left half on desktop */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 lg:py-0">
        <div className="mx-auto w-full max-w-md">
          {/* Security Notice and Timer */}
          <div className="mb-8 space-y-2">
            <div className="flex items-center text-blue-600 text-sm">
              <ShieldCheckIcon className="w-4 h-4 mr-2" />
              <span>OTP Verified - Complete your password reset</span>
            </div>
            <div className={`flex items-center text-sm ${timeRemaining < 120 ? 'text-red-600' : 'text-orange-600'}`}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Session expires in: {formatTime(timeRemaining)}</span>
              {timeRemaining < 120 && <span className="ml-2 animate-pulse">⚠️</span>}
            </div>
          </div>

          {/* Logo - Mobile Responsive */}
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-center sm:space-x-6 space-y-4 sm:space-y-0">
            <img
              src="/logo.png"
              alt="College Logo"
              className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 object-contain shadow-lg rounded-lg"
            />
            <div className="text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl xl:text-4xl font-bold text-darkblue drop-shadow-lg leading-tight">
                Reset Password
              </h2>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <p className="text-gray-600 mb-2">
              Create a new password for your account:
            </p>
            <p className="text-blue-600 font-medium">{maskEmail(email)}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter new password"
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                >
                  {showNewPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            {newPassword && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Password Requirements:</h4>
                <div className="space-y-2">
                  {Object.entries({
                    length: 'At least 8 characters',
                    lowercase: 'One lowercase letter',
                    uppercase: 'One uppercase letter',
                    number: 'One number',
                    special: 'One special character (@$!%*?&)',
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <CheckCircleIcon 
                        className={`w-4 h-4 ${
                          passwordValidation.requirements[key as keyof typeof passwordValidation.requirements] 
                            ? 'text-blue-500' 
                            : 'text-gray-300'
                        }`} 
                      />
                      <span 
                        className={`text-sm ${
                          passwordValidation.requirements[key as keyof typeof passwordValidation.requirements] 
                            ? 'text-blue-700' 
                            : 'text-gray-600'
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Confirm new password"
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-2 text-sm text-red-600">Passwords do not match</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !passwordValidation.isValid || newPassword !== confirmPassword}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-base min-h-[44px]"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Resetting Password...
                </div>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right Panel - Image/Info - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10 text-center text-white px-8">
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto mb-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <KeyIcon className="w-16 h-16 text-white" />
            </div>
            <h3 className="text-3xl font-bold mb-4">Secure Password</h3>
            <p className="text-lg opacity-90 leading-relaxed max-w-md">
              Create a strong password to keep your account secure and protect your data.
            </p>
          </div>
          
          <div className="bg-white bg-opacity-10 rounded-lg p-6 backdrop-blur-sm">
            <h4 className="text-xl font-semibold mb-3">Security Notice</h4>
            <div className="space-y-2 text-left text-sm">
              <p>• Your OTP has been verified and is now invalid</p>
              <p>• You have 10 minutes to complete this step</p>
              <p>• Use a strong password with mixed characters</p>
              <p>• Don't reuse passwords from other accounts</p>
              <p>• This session will expire automatically</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
