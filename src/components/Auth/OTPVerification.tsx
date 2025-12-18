/**
 * OTP Verification Component
 * 
 * Comprehensive OTP verification component with:
 * - 6-digit OTP input with auto-focus
 * - Countdown timer with resend functionality
 * - Error handling and retry logic
 * - Accessibility features
 * - Professional UI/UX
 * 
 * @author Student-ACT LMS Team
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, Phone, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { ApiService } from '../../services/api';
import { useToast } from '../UI/Toast';

interface OTPVerificationProps {
  identifier: string; // email or phone
  type: 'email' | 'sms';
  purpose: 'registration' | 'login' | 'password_reset' | 'phone_verification' | 'email_verification';
  onSuccess: () => void;
  onClose: () => void;
}

const OTPVerification: React.FC<OTPVerificationProps> = ({
  identifier,
  type,
  purpose,
  onSuccess,
  onClose,
}) => {
  const toast = useToast();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Send initial OTP when component mounts
    sendOTP();
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

  useEffect(() => {
    // Auto-focus first input
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const sendOTP = async () => {
    try {
      setResending(true);
      setError('');
      
      const response = await ApiService.generateOTP({
        identifier,
        type,
        purpose,
      });

      if (response.success) {
        toast.success(
          'OTP Sent',
          `Verification code sent to ${maskIdentifier(identifier)}`
        );
        setCountdown(60);
        setCanResend(false);
      } else {
        setError(response.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      console.error('Failed to send OTP:', error);
      setError(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      verifyOTP(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      setError('');
      
      // Focus last input
      inputRefs.current[5]?.focus();
      
      // Auto-verify
      verifyOTP(pastedData);
    }
  };

  const verifyOTP = async (otpCode: string) => {
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await ApiService.verifyOTP({
        identifier,
        otp: otpCode,
        purpose,
      });

      if (response.success) {
        toast.success('Verification Successful', 'Your verification is complete!');
        onSuccess();
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
      console.error('OTP verification failed:', error);
      setError(error.message || 'Verification failed. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (canResend && !resending) {
      setAttempts(0);
      setOtp(['', '', '', '', '', '']);
      sendOTP();
    }
  };

  const handleManualVerify = () => {
    const otpCode = otp.join('');
    if (otpCode.length === 6) {
      verifyOTP(otpCode);
    } else {
      setError('Please enter all 6 digits');
    }
  };

  const maskIdentifier = (identifier: string): string => {
    if (identifier.includes('@')) {
      // Email masking
      const [local, domain] = identifier.split('@');
      const maskedLocal = local.length > 2 ? 
        local[0] + '*'.repeat(local.length - 2) + local[local.length - 1] : 
        local;
      return `${maskedLocal}@${domain}`;
    } else {
      // Phone masking
      return identifier.length > 4 ? 
        identifier.slice(0, 2) + '*'.repeat(identifier.length - 4) + identifier.slice(-2) : 
        identifier;
    }
  };

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Verify {type === 'email' ? 'Email' : 'Phone'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Icon and Description */}
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              {type === 'email' ? (
                <Mail className="h-8 w-8 text-blue-600" />
              ) : (
                <Phone className="h-8 w-8 text-blue-600" />
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Enter Verification Code
            </h3>
            <p className="text-gray-600 text-sm">
              We've sent a 6-digit code to{' '}
              <span className="font-medium">{maskIdentifier(identifier)}</span>
            </p>
          </div>

          {/* OTP Input */}
          <div className="flex justify-center space-x-3 mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOTPChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className={`w-12 h-12 text-center text-xl font-semibold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  error 
                    ? 'border-red-300 bg-red-50' 
                    : digit 
                    ? 'border-blue-300 bg-blue-50' 
                    : 'border-gray-300'
                }`}
                disabled={loading}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm mb-4 p-3 bg-red-50 rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Verify Button */}
          <button
            onClick={handleManualVerify}
            disabled={loading || otp.join('').length !== 6}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Verifying...</span>
              </div>
            ) : (
              'Verify Code'
            )}
          </button>

          {/* Resend Section */}
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-2">
              Didn't receive the code?
            </p>
            
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center justify-center space-x-1 mx-auto"
              >
                {resending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    <span>Resend Code</span>
                  </>
                )}
              </button>
            ) : (
              <p className="text-gray-500 text-sm">
                Resend available in {formatCountdown(countdown)}
              </p>
            )}
          </div>

          {/* Attempts Counter */}
          {attempts > 0 && (
            <div className="text-center mt-4">
              <p className="text-orange-600 text-sm">
                {maxAttempts - attempts} attempts remaining
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
