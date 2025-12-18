/**
 * OTP React Query Hooks
 * 
 * React Query hooks for OTP generation, verification, and management
 * following enterprise standards for state management and error handling.
 * 
 * @author Student - ACT Team
 * @version 1.0.0
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../../services/api';
import type { 
  OTPRequest, 
  OTPVerification, 
  ApiResponse 
} from '../../types/api';

/**
 * Hook for generating and sending OTP
 * 
 * @example
 * ```tsx
 * const generateOTP = useGenerateOTP();
 * 
 * const handleSendOTP = async () => {
 *   try {
 *     const result = await generateOTP.mutateAsync({
 *       identifier: 'user@example.com',
 *       type: 'email',
 *       purpose: 'registration'
 *     });
 *     console.log('OTP sent:', result);
 *   } catch (error) {
 *     console.error('Failed to send OTP:', error);
 *   }
 * };
 * ```
 */
export const useGenerateOTP = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: OTPRequest): Promise<ApiResponse<{
      expiresAt: string;
      identifier: string;
      type: string;
    }>> => {
      const response = await ApiService.generateOTP(request);
      return response;
    },
    onSuccess: (data, variables) => {
      // Invalidate any existing OTP-related queries
      queryClient.invalidateQueries({
        queryKey: ['otp', variables.identifier, variables.purpose],
      });
    },
    onError: (error: any) => {
      console.error('Generate OTP error:', error);
    },
    retry: (failureCount, error: any) => {
      // Don't retry on validation errors or rate limiting
      if (error?.status === 400 || error?.status === 429) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook for verifying OTP
 * 
 * @example
 * ```tsx
 * const verifyOTP = useVerifyOTP();
 * 
 * const handleVerifyOTP = async () => {
 *   try {
 *     const result = await verifyOTP.mutateAsync({
 *       identifier: 'user@example.com',
 *       otp: '123456',
 *       purpose: 'registration'
 *     });
 *     
 *     if (result.data.verified) {
 *       console.log('OTP verified successfully');
 *     }
 *   } catch (error) {
 *     console.error('OTP verification failed:', error);
 *   }
 * };
 * ```
 */
export const useVerifyOTP = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (verification: OTPVerification): Promise<ApiResponse<{
      verified: boolean;
      userId?: string;
    }>> => {
      const response = await ApiService.verifyOTP(verification);
      return response;
    },
    onSuccess: (data, variables) => {
      if (data.data.verified) {
        // Clear OTP-related cache on successful verification
        queryClient.removeQueries({
          queryKey: ['otp', variables.identifier, variables.purpose],
        });

        // If user ID is returned, invalidate user-related queries
        if (data.data.userId) {
          queryClient.invalidateQueries({
            queryKey: ['user', data.data.userId],
          });
        }
      }
    },
    onError: (error: any) => {
      console.error('Verify OTP error:', error);
    },
    retry: (failureCount, error: any) => {
      // Don't retry on validation errors or invalid OTP
      if (error?.status === 400) {
        return false;
      }
      return failureCount < 1; // Only retry once for verification
    },
    retryDelay: 1000,
  });
};

/**
 * Hook for resending OTP
 * 
 * @example
 * ```tsx
 * const resendOTP = useResendOTP();
 * 
 * const handleResendOTP = async () => {
 *   try {
 *     const result = await resendOTP.mutateAsync({
 *       identifier: 'user@example.com',
 *       type: 'email',
 *       purpose: 'registration'
 *     });
 *     console.log('OTP resent:', result);
 *   } catch (error) {
 *     console.error('Failed to resend OTP:', error);
 *   }
 * };
 * ```
 */
export const useResendOTP = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: OTPRequest): Promise<ApiResponse<{
      expiresAt: string;
      identifier: string;
      type: string;
    }>> => {
      const response = await ApiService.resendOTP(request);
      return response;
    },
    onSuccess: (data, variables) => {
      // Invalidate existing OTP queries
      queryClient.invalidateQueries({
        queryKey: ['otp', variables.identifier, variables.purpose],
      });
    },
    onError: (error: any) => {
      console.error('Resend OTP error:', error);
    },
    retry: (failureCount, error: any) => {
      // Don't retry on rate limiting
      if (error?.status === 429) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Combined OTP hook with all operations
 * 
 * @example
 * ```tsx
 * const otp = useOTP();
 * 
 * // Generate OTP
 * const handleSendOTP = () => {
 *   otp.generate.mutate({
 *     identifier: 'user@example.com',
 *     type: 'email',
 *     purpose: 'registration'
 *   });
 * };
 * 
 * // Verify OTP
 * const handleVerifyOTP = () => {
 *   otp.verify.mutate({
 *     identifier: 'user@example.com',
 *     otp: '123456',
 *     purpose: 'registration'
 *   });
 * };
 * 
 * // Resend OTP
 * const handleResendOTP = () => {
 *   otp.resend.mutate({
 *     identifier: 'user@example.com',
 *     type: 'email',
 *     purpose: 'registration'
 *   });
 * };
 * ```
 */
export const useOTP = () => {
  const generate = useGenerateOTP();
  const verify = useVerifyOTP();
  const resend = useResendOTP();

  return {
    generate,
    verify,
    resend,
    // Combined loading state
    isLoading: generate.isPending || verify.isPending || resend.isPending,
    // Combined error state
    error: generate.error || verify.error || resend.error,
    // Reset all mutations
    reset: () => {
      generate.reset();
      verify.reset();
      resend.reset();
    },
  };
};

/**
 * Hook for OTP workflow management
 * Provides a complete OTP verification workflow with state management
 * 
 * @example
 * ```tsx
 * const otpWorkflow = useOTPWorkflow({
 *   identifier: 'user@example.com',
 *   type: 'email',
 *   purpose: 'registration',
 *   onSuccess: () => console.log('OTP verified!'),
 *   onError: (error) => console.error('OTP error:', error)
 * });
 * 
 * // Start the workflow
 * otpWorkflow.start();
 * 
 * // Verify OTP
 * otpWorkflow.verify('123456');
 * 
 * // Resend OTP
 * otpWorkflow.resend();
 * ```
 */
export const useOTPWorkflow = (config: {
  identifier: string;
  type: 'email' | 'sms';
  purpose: 'registration' | 'login' | 'password_reset' | 'phone_verification' | 'email_verification';
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}) => {
  const generate = useGenerateOTP();
  const verify = useVerifyOTP();
  const resend = useResendOTP();

  const start = () => {
    generate.mutate(
      {
        identifier: config.identifier,
        type: config.type,
        purpose: config.purpose,
      },
      {
        onSuccess: config.onSuccess,
        onError: config.onError,
      }
    );
  };

  const verifyCode = (otp: string) => {
    verify.mutate(
      {
        identifier: config.identifier,
        otp,
        purpose: config.purpose,
      },
      {
        onSuccess: (data) => {
          if (data.data.verified && config.onSuccess) {
            config.onSuccess(data);
          }
        },
        onError: config.onError,
      }
    );
  };

  const resendCode = () => {
    resend.mutate(
      {
        identifier: config.identifier,
        type: config.type,
        purpose: config.purpose,
      },
      {
        onSuccess: config.onSuccess,
        onError: config.onError,
      }
    );
  };

  return {
    start,
    verify: verifyCode,
    resend: resendCode,
    isGenerating: generate.isPending,
    isVerifying: verify.isPending,
    isResending: resend.isPending,
    isLoading: generate.isPending || verify.isPending || resend.isPending,
    generateError: generate.error,
    verifyError: verify.error,
    resendError: resend.error,
    error: generate.error || verify.error || resend.error,
    isVerified: verify.isSuccess && verify.data?.data.verified,
    reset: () => {
      generate.reset();
      verify.reset();
      resend.reset();
    },
  };
};

export default {
  useGenerateOTP,
  useVerifyOTP,
  useResendOTP,
  useOTP,
  useOTPWorkflow,
};
