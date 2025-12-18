import React, { useState } from 'react';
import { ArrowLeftIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { ApiService } from '../../services/api';

interface ForgotPasswordProps {
  onBack: () => void;
  onSuccess: (email: string) => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await ApiService.forgotPassword(email.toLowerCase().trim());

      if (response.success) {
        toast.success('Reset code sent! Check your email for the verification code.');
        onSuccess(email.toLowerCase().trim());
      } else {
        setError(response.message || 'Failed to send reset code');
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send reset code. Please try again.';
      setError(errorMessage);
      toast.error('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Main Content Panel - Full width on mobile, left half on desktop */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 lg:py-0">
        <div className="mx-auto w-full max-w-md">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-blue-600 mb-8 transition-colors duration-200"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Login
          </button>

          {/* Logo - Mobile Responsive */}
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-center sm:space-x-6 space-y-4 sm:space-y-0">
            <img
              src="/logo.png"
              alt="College Logo"
              className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 object-contain shadow-lg rounded-lg"
            />
            <div className="text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl xl:text-4xl font-bold text-darkblue drop-shadow-lg leading-tight">
                Forgot Password
              </h2>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 mb-8">
            Enter your email address and we'll send you a verification code to reset your password.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter your email address"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  disabled={loading}
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-base min-h-[44px]"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Sending Code...
                </div>
              ) : (
                'Send Reset Code'
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <button
                onClick={onBack}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
              >
                Back to Login
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Image/Info - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10 text-center text-white px-8">
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto mb-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <EnvelopeIcon className="w-16 h-16 text-white" />
            </div>
            <h3 className="text-3xl font-bold mb-4">Secure Password Reset</h3>
            <p className="text-lg opacity-90 leading-relaxed max-w-md">
              We'll send a secure verification code to your email address to help you reset your password safely.
            </p>
          </div>
          
          <div className="bg-white bg-opacity-10 rounded-lg p-6 backdrop-blur-sm">
            <h4 className="text-xl font-semibold mb-3">What happens next?</h4>
            <div className="space-y-3 text-left">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center text-sm font-bold text-blue-800 mt-0.5">1</div>
                <p className="text-sm">Check your email for a 6-digit verification code</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center text-sm font-bold text-blue-800 mt-0.5">2</div>
                <p className="text-sm">Enter the code on the next screen</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center text-sm font-bold text-blue-800 mt-0.5">3</div>
                <p className="text-sm">Create a new secure password</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
