import React, { useState } from 'react';
import { Eye, EyeOff, TreePine, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../UI/Toast';

const MobileLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<'student' | 'faculty'>('student');
  const { login } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Determine allowed roles based on selected login type
      const allowedRoles = selectedRole === 'student'
        ? ['student']
        : ['admin', 'principal', 'hod', 'staff'];

      const user = await login(email, password, allowedRoles);
      toast.success(`Welcome back, ${user?.name || 'User'}!`);
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed. Please try again.';
      console.error('Mobile login error:', error);

      // Set error for inline display
      setError(errorMessage);

      // Show toast notification
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-emerald-50 to-teal-50 flex flex-col">
      {/* Header */}
      <div className="pt-12 pb-8 px-6 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-emerald-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
          <TreePine className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Student - ACT
        </h1>
        <p className="text-gray-600 text-sm">
          R.M.K Engineering College
        </p>
      </div>

      {/* Login Form */}
      <div className="flex-1 px-6">
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          {/* Role Selection */}
          <div className="mb-6">
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setSelectedRole('student')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                  selectedRole === 'student'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🎓 Student Login
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('faculty')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                  selectedRole === 'faculty'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                👨‍🏫 Faculty Login
              </button>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {selectedRole === 'student' ? 'Student Login' : 'Faculty Login'}
            </h2>
            <p className="text-gray-600 text-sm">
              {selectedRole === 'student'
                ? 'Sign in to continue monitoring your tree'
                : 'Access your faculty dashboard'
              }
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email/Registration Number Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {selectedRole === 'student' ? 'Registration Number' : 'Email Address'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white text-base"
                  placeholder="Enter email or registration number"
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Students can use registration number (e.g., 2021CSE001) or email
              </p>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white text-base"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-emerald-600 text-white py-4 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Quick Login Options */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                setEmail('testing@gmail.com');
                setPassword('Viknesh@25');
              }}
              className="w-full p-3 border-2 border-gray-200 rounded-xl text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-sm font-medium"
            >
              Use Demo Account
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Don't have an account?{' '}
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              Contact Administrator
            </button>
          </p>
        </div>
      </div>

      {/* Bottom Decoration */}
      <div className="h-20 bg-gradient-to-t from-blue-100 to-transparent"></div>
    </div>
  );
};

export default MobileLogin;
