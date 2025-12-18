import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeftIcon, ShieldCheckIcon, ClockIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { ApiService } from '../../services/api';

interface PasswordResetOTPProps {
  email: string;
  onBack: () => void;
  onSuccess: (email: string, otp: string) => void;
}

const PasswordResetOTP: React.FC<PasswordResetOTPProps> = ({ email, onBack, onSuccess }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    // Countdown timer
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const maskEmail = (email: string): string => {
    const [local, domain] = email.split('@');
    const maskedLocal = local.length > 2 ? 
      local[0] + '*'.repeat(local.length - 2) + local[local.length - 1] : 
      local;
    return `${maskedLocal}@${domain}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (value && index === 5 && newOtp.every(digit => digit !== '')) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      setError('');
      inputRefs.current[5]?.focus();
      
      // Auto-submit
      setTimeout(() => handleVerifyOTP(pastedData), 100);
    }
  };

  const handleVerifyOTP = async (otpCode: string) => {
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await ApiService.verifyResetOTP(email, otpCode);

      if (response.success) {
        toast.success('Verification Successful! OTP verified! You can now reset your password.');
        onSuccess(email, otpCode);
      } else {
        setAttempts(prev => prev + 1);
        setError(response.message || 'Invalid OTP. Please try again.');
        
        // Clear OTP inputs on error
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();

        // Check if max attempts reached
        if (attempts + 1 >= maxAttempts) {
          setError('Maximum attempts exceeded. Please request a new OTP.');
          setOtp(['', '', '', '', '', '']);
        }
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      setAttempts(prev => prev + 1);
      const errorMessage = error.response?.data?.message || error.message || 'Verification failed. Please try again.';
      setError(errorMessage);
      
      // Clear OTP inputs on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResending(true);
    setError('');

    try {
      const response = await ApiService.forgotPassword(email);

      if (response.success) {
        toast.success('Code Resent! A new verification code has been sent to your email.');
        setCountdown(60);
        setCanResend(false);
        setAttempts(0);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError(response.message || 'Failed to resend code');
      }
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to resend code. Please try again.';
      setError(errorMessage);
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    handleVerifyOTP(otpCode);
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
            Back
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
                Verify Code
              </h2>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <p className="text-gray-600 mb-2">
              We've sent a 6-digit verification code to:
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

            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Enter Verification Code
              </label>
              <div className="flex space-x-2 sm:space-x-3 justify-center" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    disabled={loading}
                  />
                ))}
              </div>
            </div>

            {/* Timer and Resend */}
            <div className="text-center">
              {!canResend ? (
                <div className="flex items-center justify-center text-gray-600 text-sm">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  Resend code in {countdown}s
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resending}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors duration-200 disabled:opacity-50"
                >
                  {resending ? 'Sending...' : 'Resend Code'}
                </button>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || otp.some(digit => digit === '') || attempts >= maxAttempts}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-base min-h-[44px]"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Verifying...
                </div>
              ) : (
                'Verify Code'
              )}
            </button>
          </form>

          {/* Attempts Counter */}
          {attempts > 0 && attempts < maxAttempts && (
            <div className="mt-4 text-center text-sm text-gray-600">
              {maxAttempts - attempts} attempts remaining
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Image/Info - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10 text-center text-white px-8">
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto mb-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <ShieldCheckIcon className="w-16 h-16 text-white" />
            </div>
            <h3 className="text-3xl font-bold mb-4">Secure Verification</h3>
            <p className="text-lg opacity-90 leading-relaxed max-w-md">
              Enter the 6-digit code sent to your email to verify your identity and proceed with password reset.
            </p>
          </div>
          
          <div className="bg-white bg-opacity-10 rounded-lg p-6 backdrop-blur-sm">
            <h4 className="text-xl font-semibold mb-3">Security Tips</h4>
            <div className="space-y-2 text-left text-sm">
              <p>• The code expires in 15 minutes</p>
              <p>• Don't share this code with anyone</p>
              <p>• Check your spam folder if you don't see the email</p>
              <p>• You can request a new code if needed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetOTP;
