// Simple routing utility for maintaining URL state
export class SimpleRouter {
  private static instance: SimpleRouter;
  private currentRoute: string = '/dashboard';
  private listeners: ((route: string) => void)[] = [];

  private constructor() {
    // Listen for browser navigation events
    window.addEventListener('popstate', (event) => {
      const route = this.getRouteFromPath(window.location.pathname);
      this.setRoute(route, false); // Don't push to history when handling popstate
    });

    // Initialize route from current URL
    this.currentRoute = this.getRouteFromPath(window.location.pathname);
  }

  static getInstance(): SimpleRouter {
    if (!SimpleRouter.instance) {
      SimpleRouter.instance = new SimpleRouter();
    }
    return SimpleRouter.instance;
  }

  private getRouteFromPath(pathname: string): string {
    // Remove leading slash and handle special cases
    const path = pathname.replace(/^\//, '') || 'dashboard';
    console.log('🔍 Router: getRouteFromPath called with pathname:', pathname, '→ path:', path);

    // Handle invitation URLs
    if (path.startsWith('invitation/')) {
      console.log('🔍 Router: Invitation URL detected:', path);
      return path;
    }

    // Handle play-session URLs with parameters (e.g., play-session/subject-id)
    if (path.startsWith('play-session/')) {
      console.log('🔍 Router: Play Session URL detected:', path);
      return path;
    }

    // Handle course-player URLs with parameters (e.g., course-player/subject-id)
    if (path.startsWith('course-player/')) {
      console.log('🔍 Router: Course Player URL detected:', path);
      return path;
    }

    // Default routes
    const validRoutes = [
      'dashboard', 'login', 'colleges', 'users', 'staff', 'students',
      'departments', 'invitations', 'registration-requests', 'trees',
      'reports', 'settings', 'student-progress', 'content', 'bulk-upload',
      'approvals', 'data-visualization', 'class-incharge', 'tree-inventory',
      'lms-content-mapping', 'my-enrollments', 'student-enrollments',
      'student-assignments', 'student-examinations', 'examination-grading',
      'hod-content-creation', 'staff-content-creation', 'subject-staff-assignment'
    ];

    const isValid = validRoutes.includes(path);
    const result = isValid ? path : 'dashboard';
    console.log('🔍 Router: Route validation - path:', path, 'isValid:', isValid, 'result:', result);
    return result;
  }

  getCurrentRoute(): string {
    return this.currentRoute;
  }

  setRoute(route: string, pushToHistory = true): void {
    console.log('🔍 Router: setRoute called - route:', route, 'pushToHistory:', pushToHistory);
    this.currentRoute = route;

    if (pushToHistory) {
      const url = route === 'dashboard' ? '/' : `/${route}`;
      console.log('🔍 Router: Pushing to history - url:', url);
      window.history.pushState({ route }, '', url);
    }

    // Notify listeners
    console.log('🔍 Router: Notifying', this.listeners.length, 'listeners');
    this.listeners.forEach(listener => listener(route));
  }

  onRouteChange(callback: (route: string) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  navigateTo(route: string): void {
    console.log('🔍 Router: navigateTo called with route:', route);
    this.setRoute(route, true);
  }

  // Helper method to update URL without triggering navigation
  updateUrlOnly(route: string): void {
    const url = route === 'dashboard' ? '/' : `/${route}`;
    window.history.replaceState({ route }, '', url);
  }

  // Helper method to extract route parameters
  getRouteParams(route: string): Record<string, string> {
    const params: Record<string, string> = {};

    // Handle play-session routes: play-session/:subjectId
    if (route.startsWith('play-session/')) {
      const subjectId = route.replace('play-session/', '');
      if (subjectId) {
        params.subjectId = subjectId;
      }
    }

    // Handle course-player routes: course-player/:subjectId
    if (route.startsWith('course-player/')) {
      const subjectId = route.replace('course-player/', '');
      if (subjectId) {
        params.subjectId = subjectId;
      }
    }

    return params;
  }

  // Helper method to navigate to play session
  navigateToPlaySession(subjectId: string): void {
    const route = `play-session/${subjectId}`;
    console.log('🔍 Router: navigateToPlaySession called with subjectId:', subjectId, '→ route:', route);
    this.setRoute(route, true);
  }

  // Helper method to navigate to course player
  navigateToCoursePlayer(subjectId: string): void {
    const route = `course-player/${subjectId}`;
    console.log('🔍 Router: navigateToCoursePlayer called with subjectId:', subjectId, '→ route:', route);
    this.setRoute(route, true);
  }

  // Helper method to navigate to assignments page
  navigateToAssignments(): void {
    console.log('🔍 Router: navigateToAssignments called');
    this.setRoute('student-assignments', true);
  }

  // Helper method to navigate to examinations page
  navigateToExaminations(): void {
    console.log('🔍 Router: navigateToExaminations called');
    this.setRoute('student-examinations', true);
  }

  // Helper method to navigate to examination grading page
  navigateToExaminationGrading(): void {
    console.log('🔍 Router: navigateToExaminationGrading called');
    this.setRoute('examination-grading', true);
  }

  // Helper method to navigate to tab
  navigateToTab(tab: string): void {
    console.log('🔍 Router: navigateToTab called with tab:', tab);
    this.setRoute(tab, true);
  }
}

export const router = SimpleRouter.getInstance();
