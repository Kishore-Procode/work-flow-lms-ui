import { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import CustomReactQueryDevtools from './components/DevTools/CustomReactQueryDevtools';
import { AuthContext, useAuthProvider } from './hooks/useAuth';
import ModernLogin from './components/Auth/ModernLogin';
import ModernDashboardLayout from './components/Layout/ModernDashboardLayout';
import InvitationAcceptance from './components/Auth/InvitationAcceptance';



import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';
import PerformanceMonitor from './components/Performance/PerformanceMonitor';
import { router } from './utils/router';
import { queryClient } from './lib/react-query';

// Inner App component that uses auth hooks
function AppContent() {
  const auth = useAuthProvider();
  const [currentView, setCurrentView] = useState<'login' | 'dashboard' | 'invitation'>('login');
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Check URL for invitation token and setup routing on mount
  useEffect(() => {
    const currentRoute = router.getCurrentRoute();
    console.log('🔍 App: Initial route check - currentRoute:', currentRoute, 'auth.user:', !!auth.user);

    if (currentRoute.startsWith('invitation/')) {
      const token = currentRoute.replace('invitation/', '');
      console.log('🔍 App: Setting invitation view with token:', token);
      setInvitationToken(token);
      setCurrentView('invitation');
    } else if (auth.user) {
      console.log('🔍 App: User is logged in, setting dashboard view');
      setCurrentView('dashboard');
    } else {
      console.log('🔍 App: No user, setting login view');
      setCurrentView('login');
    }

    // Mark initial load as complete after first auth check
    if (!initialLoadComplete) {
      setInitialLoadComplete(true);
    }

    // Listen for route changes
    const unsubscribe = router.onRouteChange((route) => {
      console.log('🔍 App: Route changed to:', route, 'auth.user:', !!auth.user);
      if (route.startsWith('invitation/')) {
        const token = route.replace('invitation/', '');
        console.log('🔍 App: Setting invitation view with token:', token);
        setInvitationToken(token);
        setCurrentView('invitation');
      } else if (auth.user) {
        console.log('🔍 App: User is logged in, keeping dashboard view');
        setCurrentView('dashboard');
      } else {
        console.log('🔍 App: No user, setting login view');
        setCurrentView('login');
      }
    });

    return unsubscribe;
  }, [auth.user, initialLoadComplete]);



  // Handle navigation
  const navigateToLogin = () => {
    setCurrentView('login');
    setInvitationToken(null);
    router.navigateTo('login');
  };

  const navigateToDashboard = () => {
    setCurrentView('dashboard');
    router.navigateTo('dashboard');
  };



  // Only show global loading for initial auth check, not during login attempts
  if (auth.loading && !initialLoadComplete) {
    return (
      <div className="app-root layout-wrapper bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderCurrentView = () => {
    if (currentView === 'invitation' && invitationToken) {
      return <InvitationAcceptance token={invitationToken} onNavigateToLogin={navigateToLogin} />;
    } else if (currentView === 'dashboard' && auth.user) {
      return <ModernDashboardLayout />;
    } else {
      return <ModernLogin onLoginSuccess={navigateToDashboard} />;
    }
  };

  return (
    <ThemeProvider>
      <AuthContext.Provider value={auth}>
        {renderCurrentView()}
        <PerformanceMonitor
          enabled={import.meta.env.DEV}
          showWidget={true}
        />
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

// Main App component with providers
function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppContent />
        {/* React Hot Toast */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
        {/* Custom React Query DevTools - only in development */}
        {import.meta.env.DEV && <CustomReactQueryDevtools />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;