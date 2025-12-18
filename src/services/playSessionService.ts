/**
 * Play Session Service
 * 
 * API client for Play Session functionality.
 * Handles all HTTP requests to the Play Session backend.
 */

import api from './api';
import {
  GetSessionBySubjectResponse,
  GetSessionContentBlocksResponse,
  GetUserProgressResponse,
  GetBulkUserProgressResponse,
  UpdateProgressRequest,
  UpdateProgressResponse,
  GetCommentsResponse,
  CreateCommentRequest,
  CreateCommentResponse,
  GetQuizQuestionsResponse,
  SubmitQuizAttemptRequest,
  SubmitQuizAttemptResponse,
  MapSubjectToSessionRequest,
  MapSubjectToSessionResponse,
} from '../types/playSession';

const BASE_PATH = '/play-session';

/**
 * Play Session Service
 */
export const playSessionService = {
  /**
   * Get workflow session mapped to an LMS subject
   */
  getSessionBySubject: async (
    subjectId: string,
    enrollmentId?: string
  ): Promise<GetSessionBySubjectResponse> => {
    console.log('📡 API Call: getSessionBySubject', { subjectId, enrollmentId });
    try {
      const params = enrollmentId ? { enrollmentId } : undefined;
      const response = await api.get(`${BASE_PATH}/subject/${subjectId}/session`, params);
      console.log('✅ API Response: getSessionBySubject - Full response:', response);
      console.log('✅ API Response: getSessionBySubject - response.data:', response.data);
      console.log('✅ API Response: getSessionBySubject - response.data.data:', response.data?.data);

      // Check if response.data has the data property or if it's already unwrapped
      const result = response.data?.data || response.data;
      console.log('✅ API Response: getSessionBySubject - Returning:', result);
      return result;
    } catch (error) {
      console.error('❌ API Error: getSessionBySubject', error);
      throw error;
    }
  },

  /**
   * Get all content blocks for a session
   */
  getSessionContentBlocks: async (
    sessionId: string
  ): Promise<GetSessionContentBlocksResponse> => {
    console.log('📡 API Call: getSessionContentBlocks', { sessionId });
    try {
      const response = await api.get(`${BASE_PATH}/session/${sessionId}/content-blocks`);
      console.log('✅ API Response: getSessionContentBlocks', response);
      const result = response.data?.data || response.data;
      return result;
    } catch (error) {
      console.error('❌ API Error: getSessionContentBlocks', error);
      throw error;
    }
  },

  /**
   * Get user's progress for a session
   */
  getUserProgress: async (
    sessionId: string,
    enrollmentId?: string
  ): Promise<GetUserProgressResponse> => {
    console.log('📡 API Call: getUserProgress', { sessionId, enrollmentId });
    try {
      const params = enrollmentId ? { enrollmentId } : undefined;
      const response = await api.get(`${BASE_PATH}/progress/${sessionId}`, params);
      console.log('✅ API Response: getUserProgress', response);
      const result = response.data?.data || response.data;
      return result;
    } catch (error) {
      console.error('❌ API Error: getUserProgress', error);
      throw error;
    }
  },

  /**
   * Get user's progress for ALL sessions in a subject/course
   * Optimized for Course Player - loads all progress in one call
   */
  getBulkUserProgress: async (
    subjectId: string
  ): Promise<GetBulkUserProgressResponse> => {
    console.log('📡 API Call: getBulkUserProgress', { subjectId });
    try {
      const response = await api.get(`${BASE_PATH}/progress/bulk/${subjectId}`);
      console.log('✅ API Response: getBulkUserProgress', response);
      const result = response.data?.data || response.data;
      return result;
    } catch (error) {
      console.error('❌ API Error: getBulkUserProgress', error);
      throw error;
    }
  },

  /**
   * Update user's progress for a content block
   */
  updateProgress: async (
    request: UpdateProgressRequest
  ): Promise<UpdateProgressResponse> => {
    console.log('📡 API Call: updateProgress', request);
    try {
      const response = await api.post(`${BASE_PATH}/progress`, request);
      console.log('✅ API Response: updateProgress', response);
      const result = response.data?.data || response.data;
      return result;
    } catch (error) {
      console.error('❌ API Error: updateProgress', error);
      throw error;
    }
  },

  /**
   * Get comments for a content block
   */
  getComments: async (blockId: string): Promise<GetCommentsResponse> => {
    console.log('📡 API Call: getComments', { blockId });
    try {
      const response = await api.get(`${BASE_PATH}/comments/${blockId}`);
      console.log('✅ API Response: getComments', response);
      const result = response.data?.data || response.data;
      return result;
    } catch (error) {
      console.error('❌ API Error: getComments', error);
      throw error;
    }
  },

  /**
   * Create a new comment
   */
  createComment: async (
    request: CreateCommentRequest
  ): Promise<CreateCommentResponse> => {
    console.log('📡 API Call: createComment', request);
    try {
      const response = await api.post(`${BASE_PATH}/comments`, request);
      console.log('✅ API Response: createComment', response);
      const result = response.data?.data || response.data;
      return result;
    } catch (error) {
      console.error('❌ API Error: createComment', error);
      throw error;
    }
  },

  /**
   * Get quiz questions for a content block
   */
  getQuizQuestions: async (blockId: string): Promise<GetQuizQuestionsResponse> => {
    console.log('📡 API Call: getQuizQuestions', { blockId });
    try {
      const response = await api.get(`${BASE_PATH}/quiz/${blockId}/questions`);
      console.log('✅ API Response: getQuizQuestions', response);
      const result = response.data?.data || response.data;
      return result;
    } catch (error) {
      console.error('❌ API Error: getQuizQuestions', error);
      throw error;
    }
  },

  /**
   * Submit a quiz attempt
   */
  submitQuizAttempt: async (
    request: SubmitQuizAttemptRequest
  ): Promise<SubmitQuizAttemptResponse> => {
    console.log('📡 API Call: submitQuizAttempt', request);
    try {
      const response = await api.post(`${BASE_PATH}/quiz/attempt`, request);
      console.log('✅ API Response: submitQuizAttempt', response);
      const result = response.data?.data || response.data;
      return result;
    } catch (error) {
      console.error('❌ API Error: submitQuizAttempt', error);
      throw error;
    }
  },

  /**
   * Map an LMS subject to a workflow session (Admin/Staff only)
   */
  mapSubjectToSession: async (
    request: MapSubjectToSessionRequest
  ): Promise<MapSubjectToSessionResponse> => {
    console.log('📡 API Call: mapSubjectToSession', request);
    try {
      const response = await api.post(`${BASE_PATH}/map-subject-to-session`, request);
      console.log('✅ API Response: mapSubjectToSession', response);
      const result = response.data?.data || response.data;
      return result;
    } catch (error) {
      console.error('❌ API Error: mapSubjectToSession', error);
      throw error;
    }
  },
};

export default playSessionService;

