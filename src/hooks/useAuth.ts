import { createContext, useContext } from 'react';
import type { AuthUser } from '../types/api';
import { useAuthStatus, useLogin, useLogout } from './api/useAuth';

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string,selectedRole:string) => Promise<AuthUser | null>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
  error: any;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const { user, isAuthenticated, isLoading, error } = useAuthStatus();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  const login = async (email: string, password: string,selectedRole:string): Promise<AuthUser | null> => {
    try {
      const response = await loginMutation.mutateAsync({ email, password,selectedRole });
      if (response.success && response.data) {
        return response.data.user;
      }
      return null;
    } catch (error) {
      console.error('Login failed:', error);
      // Re-throw the error so the Login component can handle it
      throw error;
    }
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user,
    login,
    logout,
    loading: isLoading, // Only show loading for initial auth check, not during login/logout
    isAuthenticated,
    error: error || loginMutation.error || logoutMutation.error,
  };
};