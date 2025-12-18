/**
 * Enhanced Error Boundary Component
 *
 * This component provides comprehensive error handling with:
 * - Graceful error recovery
 * - Detailed error reporting
 * - User-friendly error messages
 * - Development vs production error display
 * - Accessibility support
 * - Error logging integration
 *
 * @author Student - ACT Team
 * @version 1.0.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Copy, ExternalLink } from 'lucide-react';

interface Props {
  /** Child components to render */
  children: ReactNode;
  /** Custom fallback UI to display on error */
  fallback?: ReactNode;
  /** Callback function called when an error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Whether to show detailed error information */
  showDetails?: boolean;
  /** Custom error message to display */
  errorMessage?: string;
  /** Whether to show recovery actions */
  showActions?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  retryCount: number;
}

/**
 * Enhanced Error Boundary with enterprise-level error handling
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   onError={(error, errorInfo) => logToService(error, errorInfo)}
 *   showDetails={process.env.NODE_ENV === 'development'}
 * >
 *   <App />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to monitoring service in production
    this.logErrorToService(error, errorInfo);
  }

  componentWillUnmount(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  /**
   * Log error to external monitoring service
   */
  private logErrorToService = (error: Error, errorInfo: ErrorInfo): void => {
    if (process.env.NODE_ENV === 'production') {
      // In production, integrate with error monitoring services like:
      // - Sentry
      // - Bugsnag
      // - LogRocket
      // - Custom logging service

      const errorReport = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.getCurrentUserId(),
        sessionId: this.getSessionId(),
        buildVersion: process.env.VITE_APP_VERSION || 'unknown',
      };

      // Example: Send to monitoring service
      // monitoringService.captureException(error, errorReport);
    }
  };

  /**
   * Get current user ID for error tracking
   */
  private getCurrentUserId = (): string | null => {
    try {
      const user = localStorage.getItem('currentUser');
      return user ? JSON.parse(user).id : null;
    } catch {
      return null;
    }
  };

  /**
   * Get session ID for error tracking
   */
  private getSessionId = (): string => {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  };

  /**
   * Handle page reload with retry logic
   */
  private handleReload = (): void => {
    this.setState(prevState => ({ retryCount: prevState.retryCount + 1 }));

    // Add delay to prevent rapid retries
    this.retryTimeoutId = setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  /**
   * Navigate to home page
   */
  private handleGoHome = (): void => {
    window.location.href = '/';
  };

  /**
   * Reset error boundary state to retry rendering
   */
  private handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined,
      retryCount: this.state.retryCount + 1,
    });
  };

  /**
   * Copy error details to clipboard
   */
  private handleCopyError = async (): Promise<void> => {
    const errorReport = {
      errorId: this.state.errorId,
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
      // Show success feedback (you might want to use a toast notification)
      console.log('Error report copied to clipboard');
    } catch (error) {
      console.error('Failed to copy error report:', error);
      // Fallback: create a downloadable file
      this.downloadErrorReport(errorReport);
    }
  };

  /**
   * Download error report as a file
   */
  private downloadErrorReport = (errorReport: any): void => {
    const blob = new Blob([JSON.stringify(errorReport, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `error-report-${this.state.errorId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Open support/help page
   */
  private handleGetHelp = (): void => {
    // Open support page or documentation
    window.open('/help', '_blank');
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const showDetails = this.props.showDetails ?? (process.env.NODE_ENV === 'development');
      const showActions = this.props.showActions ?? true;
      const errorMessage = this.props.errorMessage || 'Something unexpected happened';

      return (
        <div
          className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8"
          role="alert"
          aria-live="assertive"
        >
          <div className="sm:mx-auto sm:w-full sm:max-w-lg">
            <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200">
              <div className="text-center">
                {/* Error Icon */}
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                  <AlertTriangle
                    className="h-8 w-8 text-red-600"
                    aria-hidden="true"
                  />
                </div>

                {/* Error Title */}
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Oops! Something went wrong
                </h1>

                {/* Error Message */}
                <p className="text-gray-600 mb-6">
                  {errorMessage}. We apologize for the inconvenience.
                </p>

                {/* Error ID for support */}
                {this.state.errorId && (
                  <p className="text-xs text-gray-500 mb-4">
                    Error ID: <code className="bg-gray-100 px-1 rounded">{this.state.errorId}</code>
                  </p>
                )}

                {/* Development Error Details */}
                {showDetails && this.state.error && (
                  <details className="mb-6 text-left">
                    <summary className="cursor-pointer text-sm font-medium text-red-800 hover:text-red-900">
                      Show Error Details
                    </summary>
                    <div className="mt-3 p-4 bg-red-50 rounded-md border border-red-200">
                      <h3 className="text-sm font-medium text-red-800 mb-2">
                        Error Message:
                      </h3>
                      <p className="text-sm text-red-700 mb-3 font-mono">
                        {this.state.error.message}
                      </p>

                      {this.state.error.stack && (
                        <>
                          <h3 className="text-sm font-medium text-red-800 mb-2">
                            Stack Trace:
                          </h3>
                          <pre className="text-xs text-red-600 overflow-auto max-h-40 bg-white p-2 rounded border whitespace-pre-wrap">
                            {this.state.error.stack}
                          </pre>
                        </>
                      )}
                    </div>
                  </details>
                )}
              </div>

              {/* Action Buttons */}
              {showActions && (
                <div className="space-y-3">
                  {/* Primary Actions */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      onClick={this.handleRetry}
                      className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      aria-label="Retry loading the application"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                      Try Again
                    </button>

                    <button
                      onClick={this.handleReload}
                      className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      aria-label="Reload the page"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                      Reload Page
                    </button>
                  </div>

                  {/* Secondary Actions */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <button
                      onClick={this.handleGoHome}
                      className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      aria-label="Go to home page"
                    >
                      <Home className="h-4 w-4 mr-1" aria-hidden="true" />
                      Home
                    </button>

                    <button
                      onClick={this.handleCopyError}
                      className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      aria-label="Copy error details"
                    >
                      <Copy className="h-4 w-4 mr-1" aria-hidden="true" />
                      Copy Error
                    </button>

                    <button
                      onClick={this.handleGetHelp}
                      className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      aria-label="Get help and support"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" aria-hidden="true" />
                      Get Help
                    </button>
                  </div>

                  {/* Retry Count Display */}
                  {this.state.retryCount > 0 && (
                    <p className="text-xs text-gray-500 text-center mt-4">
                      Retry attempts: {this.state.retryCount}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for wrapping components with error boundary
 *
 * @param Component - The component to wrap
 * @param fallback - Optional fallback UI
 * @returns Wrapped component with error boundary
 *
 * @example
 * ```tsx
 * const SafeComponent = withErrorBoundary(MyComponent, <div>Error occurred</div>);
 * ```
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

/**
 * Simple error fallback component for inline error display
 *
 * @param error - The error object to display
 * @returns Simple error UI component
 *
 * @example
 * ```tsx
 * <ErrorBoundary fallback={<SimpleErrorFallback />}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export const SimpleErrorFallback: React.FC<{ error?: Error }> = ({ error }) => (
  <div className="p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
    <div className="flex items-center">
      <AlertTriangle className="w-5 h-5 text-red-600 mr-2" aria-hidden="true" />
      <h3 className="text-sm font-medium text-red-800">Something went wrong</h3>
    </div>
    <p className="text-sm text-red-700 mt-1">
      {error?.message || 'An unexpected error occurred. Please try again.'}
    </p>
    <button
      onClick={() => window.location.reload()}
      className="mt-2 text-sm text-red-600 hover:text-red-800 underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded"
      aria-label="Refresh the page"
    >
      Refresh page
    </button>
  </div>
);

export default ErrorBoundary;
