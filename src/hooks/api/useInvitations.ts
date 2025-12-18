/**
 * Invitation Management React Query Hooks
 * 
 * This file contains React Query hooks for invitation operations
 * following MNC enterprise standards for error handling and type safety.
 * 
 * @author Student - ACT Team
 * @version 1.0.0
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiService } from '../../services/api';
import { queryKeys, invalidateQueries } from '../../lib/react-query';
import type {
  Invitation,
  CreateInvitationRequest,
  AcceptInvitationRequest,
  ValidateInvitationResponse,
  InvitationFilters,
  ApiResponse,
  ApiError,
} from '../../types/api';

/**
 * Hook to fetch all invitations with optional filtering
 * 
 * @param filters - Optional filters to apply to the invitation list
 * @returns {Object} Query object with invitations data and state
 * 
 * @example
 * ```tsx
 * const { data: invitations, isLoading, error } = useInvitations({
 *   status: 'pending',
 *   role: 'student'
 * });
 * 
 * if (isLoading) return <div>Loading invitations...</div>;
 * if (error) return <div>Error loading invitations</div>;
 * 
 * return (
 *   <div>
 *     {invitations?.map(invitation => (
 *       <InvitationCard key={invitation.id} invitation={invitation} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export const useInvitations = (filters: InvitationFilters = {}) => {
  return useQuery<Invitation[], ApiError>({
    queryKey: queryKeys.invitations.list(filters),
    queryFn: async (): Promise<Invitation[]> => {
      const response = await ApiService.getInvitations();
      
      if (!response || !Array.isArray(response)) {
        throw new Error('Invalid invitations response format');
      }
      
      // Apply client-side filtering if needed
      let filteredInvitations = response;
      
      if (filters.status) {
        filteredInvitations = filteredInvitations.filter(
          invitation => invitation.status === filters.status
        );
      }
      
      if (filters.role) {
        filteredInvitations = filteredInvitations.filter(
          invitation => invitation.role === filters.role
        );
      }
      
      if (filters.collegeId) {
        filteredInvitations = filteredInvitations.filter(
          invitation => invitation.collegeId === filters.collegeId
        );
      }
      
      if (filters.departmentId) {
        filteredInvitations = filteredInvitations.filter(
          invitation => invitation.departmentId === filters.departmentId
        );
      }
      
      if (filters.sentBy) {
        filteredInvitations = filteredInvitations.filter(
          invitation => invitation.sentBy === filters.sentBy
        );
      }
      
      return filteredInvitations;
    },
    staleTime: 1000 * 60 * 2, // Consider fresh for 2 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
  });
};

/**
 * Hook to fetch a single invitation by ID
 * 
 * @param invitationId - The ID of the invitation to fetch
 * @returns {Object} Query object with invitation data and state
 * 
 * @example
 * ```tsx
 * const { data: invitation, isLoading, error } = useInvitation(invitationId);
 * 
 * if (isLoading) return <div>Loading invitation...</div>;
 * if (error) return <div>Error loading invitation</div>;
 * if (!invitation) return <div>Invitation not found</div>;
 * 
 * return <InvitationDetails invitation={invitation} />;
 * ```
 */
export const useInvitation = (invitationId: string) => {
  return useQuery<Invitation, ApiError>({
    queryKey: queryKeys.invitations.detail(invitationId),
    queryFn: async (): Promise<Invitation> => {
      const response = await ApiService.getInvitation?.(invitationId);
      
      if (!response) {
        throw new Error('Invitation API not available');
      }
      
      return response;
    },
    enabled: !!invitationId,
    staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes
  });
};

/**
 * Hook to validate an invitation token
 * 
 * @param token - The invitation token to validate
 * @returns {Object} Query object with validation result and state
 * 
 * @example
 * ```tsx
 * const { data: invitation, isLoading, error } = useValidateInvitation(token);
 * 
 * if (isLoading) return <div>Validating invitation...</div>;
 * if (error) return <div>Invalid invitation token</div>;
 * if (!invitation) return <div>Invitation not found</div>;
 * 
 * return <InvitationAcceptanceForm invitation={invitation} />;
 * ```
 */
export const useValidateInvitation = (token: string) => {
  return useQuery<ValidateInvitationResponse, ApiError>({
    queryKey: queryKeys.invitations.validate(token),
    queryFn: async (): Promise<ValidateInvitationResponse> => {
      const response = await ApiService.validateInvitationToken(token);
      return response;
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 10, // Consider fresh for 10 minutes
    retry: false, // Don't retry validation failures
  });
};

/**
 * Hook for creating new invitations
 * 
 * @returns {Object} Mutation object with create invitation function and state
 * 
 * @example
 * ```tsx
 * const createInvitationMutation = useCreateInvitation();
 * 
 * const handleCreateInvitation = async (data: CreateInvitationRequest) => {
 *   try {
 *     const result = await createInvitationMutation.mutateAsync(data);
 *     toast.success(`Invitation sent to ${data.email}`);
 *   } catch (error) {
 *     toast.error('Failed to send invitation');
 *   }
 * };
 * ```
 */
export const useCreateInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation<Invitation, ApiError, CreateInvitationRequest>({
    mutationFn: async (data: CreateInvitationRequest): Promise<Invitation> => {
      const response = await ApiService.createInvitation(data);
      return response;
    },
    onSuccess: (newInvitation) => {
      // Invalidate and refetch invitations list
      invalidateQueries(queryClient, [
        queryKeys.invitations.lists(),
        queryKeys.dashboard.stats,
      ]);
      
      // Add the new invitation to the cache
      queryClient.setQueryData(
        queryKeys.invitations.detail(newInvitation.id),
        newInvitation
      );
      
      console.log('Invitation created successfully:', newInvitation);
    },
    onError: (error) => {
      console.error('Failed to create invitation:', error);
    },
  });
};

/**
 * Hook for accepting invitations (public endpoint)
 * 
 * @returns {Object} Mutation object with accept invitation function and state
 * 
 * @example
 * ```tsx
 * const acceptInvitationMutation = useAcceptInvitation();
 * 
 * const handleAcceptInvitation = async (data: AcceptInvitationRequest) => {
 *   try {
 *     await acceptInvitationMutation.mutateAsync(data);
 *     toast.success('Account created successfully!');
 *     navigate('/login');
 *   } catch (error) {
 *     toast.error('Failed to accept invitation');
 *   }
 * };
 * ```
 */
export const useAcceptInvitation = () => {
  return useMutation<ApiResponse<void>, ApiError, AcceptInvitationRequest>({
    mutationFn: async (data: AcceptInvitationRequest) => {
      const response = await ApiService.acceptInvitationPublic(data);
      return response;
    },
    onError: (error) => {
      console.error('Failed to accept invitation:', error);
    },
    retry: false, // Don't retry acceptance attempts
  });
};

/**
 * Hook for rejecting invitations
 * 
 * @returns {Object} Mutation object with reject invitation function and state
 * 
 * @example
 * ```tsx
 * const rejectInvitationMutation = useRejectInvitation();
 * 
 * const handleRejectInvitation = async (invitationId: string) => {
 *   try {
 *     await rejectInvitationMutation.mutateAsync(invitationId);
 *     toast.success('Invitation rejected');
 *   } catch (error) {
 *     toast.error('Failed to reject invitation');
 *   }
 * };
 * ```
 */
export const useRejectInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation<Invitation, ApiError, string>({
    mutationFn: async (invitationId: string): Promise<Invitation> => {
      const response = await ApiService.rejectInvitation(invitationId);
      return response;
    },
    onSuccess: (updatedInvitation) => {
      // Update the invitation in cache
      queryClient.setQueryData(
        queryKeys.invitations.detail(updatedInvitation.id),
        updatedInvitation
      );
      
      // Invalidate invitations list to reflect status change
      invalidateQueries(queryClient, [
        queryKeys.invitations.lists(),
        queryKeys.dashboard.stats,
      ]);
      
      console.log('Invitation rejected successfully:', updatedInvitation);
    },
    onError: (error) => {
      console.error('Failed to reject invitation:', error);
    },
  });
};

/**
 * Hook for resending invitations
 * 
 * @returns {Object} Mutation object with resend invitation function and state
 * 
 * @example
 * ```tsx
 * const resendInvitationMutation = useResendInvitation();
 * 
 * const handleResendInvitation = async (invitationId: string) => {
 *   try {
 *     await resendInvitationMutation.mutateAsync(invitationId);
 *     toast.success('Invitation resent successfully');
 *   } catch (error) {
 *     toast.error('Failed to resend invitation');
 *   }
 * };
 * ```
 */
export const useResendInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation<Invitation, ApiError, string>({
    mutationFn: async (invitationId: string): Promise<Invitation> => {
      const response = await ApiService.resendInvitation(invitationId);
      return response;
    },
    onSuccess: (updatedInvitation) => {
      // Update the invitation in cache
      queryClient.setQueryData(
        queryKeys.invitations.detail(updatedInvitation.id),
        updatedInvitation
      );
      
      // Invalidate invitations list to reflect updated timestamp
      invalidateQueries(queryClient, [
        queryKeys.invitations.lists(),
      ]);
      
      console.log('Invitation resent successfully:', updatedInvitation);
    },
    onError: (error) => {
      console.error('Failed to resend invitation:', error);
    },
  });
};

/**
 * Hook for deleting invitations
 * 
 * @returns {Object} Mutation object with delete invitation function and state
 * 
 * @example
 * ```tsx
 * const deleteInvitationMutation = useDeleteInvitation();
 * 
 * const handleDeleteInvitation = async (invitationId: string) => {
 *   if (confirm('Are you sure you want to delete this invitation?')) {
 *     try {
 *       await deleteInvitationMutation.mutateAsync(invitationId);
 *       toast.success('Invitation deleted successfully');
 *     } catch (error) {
 *       toast.error('Failed to delete invitation');
 *     }
 *   }
 * };
 * ```
 */
export const useDeleteInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: async (invitationId: string): Promise<void> => {
      await ApiService.deleteInvitation(invitationId);
    },
    onSuccess: (_, invitationId) => {
      // Remove the invitation from cache
      queryClient.removeQueries({
        queryKey: queryKeys.invitations.detail(invitationId),
      });
      
      // Invalidate invitations list
      invalidateQueries(queryClient, [
        queryKeys.invitations.lists(),
        queryKeys.dashboard.stats,
      ]);
      
      console.log('Invitation deleted successfully:', invitationId);
    },
    onError: (error) => {
      console.error('Failed to delete invitation:', error);
    },
  });
};
