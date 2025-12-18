/**
 * Test Utilities and Helpers
 * 
 * This file provides utility functions and custom render methods
 * for testing React components with React Query and other providers.
 * 
 * @author Student-ACT LMS Team
 * @version 1.0.0
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '../hooks/useAuth';
import { ThemeProvider } from '../contexts/ThemeContext';
import type { User } from '../types/api';

/**
 * Mock user data for testing
 */
export const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  phone: '+1234567890',
  role: 'student',
  status: 'active',
  collegeId: 'test-college-id',
  departmentId: 'test-department-id',
  rollNumber: 'TEST001',
  year: 2024,
  section: 'A',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

/**
 * Mock auth context values
 */
export const mockAuthContext = {
  user: mockUser,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
  isAuthenticated: true,
  error: null,
};

/**
 * Create a test QueryClient with disabled retries and caching
 */
export const createTestQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
};

/**
 * Custom render options interface
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  authContext?: typeof mockAuthContext;
  initialEntries?: string[];
}

/**
 * All the providers wrapper component
 */
const AllTheProviders: React.FC<{
  children: React.ReactNode;
  queryClient: QueryClient;
  authContext: typeof mockAuthContext;
}> = ({ children, queryClient, authContext }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthContext.Provider value={authContext}>
          {children}
        </AuthContext.Provider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

/**
 * Custom render function that includes all necessary providers
 * 
 * @param ui - The React element to render
 * @param options - Custom render options
 * @returns Render result with additional utilities
 * 
 * @example
 * ```tsx
 * import { renderWithProviders } from '../test/utils';
 * import MyComponent from './MyComponent';
 * 
 * test('renders MyComponent', () => {
 *   const { getByText } = renderWithProviders(<MyComponent />);
 *   expect(getByText('Hello World')).toBeInTheDocument();
 * });
 * ```
 */
export const renderWithProviders = (
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    authContext = mockAuthContext,
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AllTheProviders queryClient={queryClient} authContext={authContext}>
      {children}
    </AllTheProviders>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
};

/**
 * Render component without authentication (for login/public pages)
 */
export const renderWithoutAuth = (
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: Omit<CustomRenderOptions, 'authContext'> = {}
) => {
  const unauthenticatedContext = {
    ...mockAuthContext,
    user: null,
    isAuthenticated: false,
  };

  return renderWithProviders(ui, {
    queryClient,
    authContext: unauthenticatedContext,
    ...renderOptions,
  });
};

/**
 * Mock API responses for testing
 */
export const mockApiResponses = {
  users: [mockUser],
  colleges: [
    {
      id: 'test-college-id',
      name: 'Test College',
      code: 'TC',
      status: 'active' as const,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ],
  departments: [
    {
      id: 'test-department-id',
      name: 'Test Department',
      code: 'TD',
      collegeId: 'test-college-id',
      status: 'active' as const,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ],
  invitations: [
    {
      id: 'test-invitation-id',
      email: 'invited@example.com',
      role: 'student' as const,
      status: 'pending' as const,
      sentBy: 'test-user-id',
      invitationToken: 'test-token',
      sentAt: '2024-01-01T00:00:00Z',
      expiresAt: '2024-01-08T00:00:00Z',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ],
};

/**
 * Wait for React Query to settle (useful for async tests)
 */
export const waitForQueryToSettle = async (queryClient: QueryClient) => {
  await queryClient.getQueryCache().getAll().forEach(query => {
    if (query.state.fetchStatus === 'fetching') {
      return query.promise;
    }
  });
};

/**
 * Mock fetch implementation for testing
 */
export const mockFetch = (response: any, status = 200) => {
  return jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => response,
    text: async () => JSON.stringify(response),
  });
};

/**
 * Mock axios implementation for testing
 */
export const mockAxios = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  create: jest.fn(() => mockAxios),
  defaults: {
    headers: {
      common: {},
    },
  },
  interceptors: {
    request: {
      use: jest.fn(),
      eject: jest.fn(),
    },
    response: {
      use: jest.fn(),
      eject: jest.fn(),
    },
  },
};

/**
 * Create mock error for testing error states
 */
export const createMockError = (message: string, status = 500) => {
  const error = new Error(message) as any;
  error.response = {
    status,
    data: { message },
  };
  return error;
};

/**
 * Utility to suppress console errors during tests
 */
export const suppressConsoleError = (callback: () => void) => {
  const originalError = console.error;
  console.error = jest.fn();
  
  try {
    callback();
  } finally {
    console.error = originalError;
  }
};

/**
 * Custom matchers for better test assertions
 */
export const customMatchers = {
  toHaveBeenCalledWithApiData: (received: jest.Mock, expectedData: any) => {
    const calls = received.mock.calls;
    const found = calls.some(call => 
      JSON.stringify(call[0]) === JSON.stringify(expectedData)
    );
    
    return {
      message: () => 
        `Expected function to have been called with API data ${JSON.stringify(expectedData)}`,
      pass: found,
    };
  },
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
