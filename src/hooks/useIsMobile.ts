import { useState, useEffect } from 'react';

/**
 * Custom hook to detect if the current device is mobile
 * Uses multiple detection methods for better accuracy:
 * 1. User Agent detection
 * 2. Screen size detection
 * 3. Touch capability detection
 */
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      // Method 1: Check user agent for mobile devices
      const userAgent = navigator.userAgent.toLowerCase();
      // console.log('User Agent:', userAgent); // Uncomment for debugging

      // Mobile device keywords (iOS devices often don't have 'mobile' in user agent)
      const mobileKeywords = [
        'android', 'webos', 'iphone', 'ipad', 'ipod',
        'blackberry', 'windows phone', 'mobile', 'tablet',
        'samsung', 'nokia', 'motorola', 'lg', 'htc', 'sony'
      ];

      // iOS specific detection (iOS Safari often shows as desktop)
      const iosKeywords = ['iphone', 'ipad', 'ipod'];
      const isIOS = iosKeywords.some(keyword => userAgent.includes(keyword)) ||
        (userAgent.includes('safari') && userAgent.includes('mobile')) ||
        (userAgent.includes('webkit') && userAgent.includes('mobile') && !userAgent.includes('android')) ||
        // Additional iOS detection methods
        (navigator.platform && ['iPhone', 'iPad', 'iPod'].includes(navigator.platform)) ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform)) || // iPad with iPadOS 13+
        (/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream);

      // Desktop OS keywords that should NOT be considered mobile (but exclude iOS)
      const desktopKeywords = [
        'windows nt', 'linux x86_64', 'x11', 'ubuntu', 'fedora', 'debian', 'centos'
      ];

      // Note: We removed 'macintosh' and 'mac os x' from desktop keywords
      // because iOS devices can show these in their user agent

      const isMobileUserAgent = mobileKeywords.some(keyword =>
        userAgent.includes(keyword)
      );

      const isDesktopUserAgent = desktopKeywords.some(keyword =>
        userAgent.includes(keyword)
      );

      // Method 2: Check screen size (mobile-first breakpoint)
      const isMobileScreen = window.innerWidth <= 768;

      // Method 3: Check if device has touch capability
      const isTouchDevice = 'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (window as any).DocumentTouch && document instanceof (window as any).DocumentTouch;

      // Method 4: Check for mobile-specific APIs (but exclude desktop browsers)
      const hasMobileAPIs = ('orientation' in window ||
        'DeviceMotionEvent' in window ||
        'DeviceOrientationEvent' in window) && !isDesktopUserAgent;

      // Enhanced logic with iOS priority:
      // 1. If iOS detected, it's ALWAYS mobile (highest priority)
      // 2. If desktop OS detected in user agent, it's NOT mobile (even with small screen)
      // 3. If mobile keywords in user agent, it IS mobile
      // 4. If small screen AND touch AND no desktop OS, it might be mobile
      // 5. If has mobile APIs AND no desktop OS, it might be mobile

      let isMobileDevice = false;

      if (isIOS) {
        // iOS devices are always mobile, regardless of other factors
        isMobileDevice = true;
        // console.log('Detected as Mobile (iOS)'); // Uncomment for debugging
      } else if (isDesktopUserAgent) {
        // Definitely desktop - even if screen is small or has touch
        isMobileDevice = false;
        // console.log('Detected as Desktop (OS-based)'); // Uncomment for debugging
      } else if (isMobileUserAgent) {
        // Definitely mobile
        isMobileDevice = true;
        // console.log('Detected as Mobile (User Agent)'); // Uncomment for debugging
      } else if (isMobileScreen && isTouchDevice) {
        // Small screen with touch, no desktop OS detected
        isMobileDevice = true;
        // console.log('Detected as Mobile (Screen + Touch)'); // Uncomment for debugging
      } else if (hasMobileAPIs) {
        // Has mobile APIs, no desktop OS detected
        isMobileDevice = true;
        // console.log('Detected as Mobile (APIs)'); // Uncomment for debugging
      } else {
        // Default to desktop
        isMobileDevice = false;
        // console.log('Detected as Desktop (Default)'); // Uncomment for debugging
      }

      // Uncomment for debugging:
      // console.log('Detection Results:', {
      //   userAgent: userAgent.substring(0, 100) + '...',
      //   isIOS,
      //   isMobileUserAgent,
      //   isDesktopUserAgent,
      //   isMobileScreen,
      //   isTouchDevice,
      //   hasMobileAPIs,
      //   finalResult: isMobileDevice
      // });

      setIsMobile(isMobileDevice);
    };

    // Initial check
    checkDevice();
    
    // Re-check on window resize (for responsive behavior)
    window.addEventListener('resize', checkDevice);
    
    // Re-check on orientation change (mobile devices)
    window.addEventListener('orientationchange', checkDevice);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  return isMobile;
};

/**
 * Hook to get detailed device information
 */
export const useDeviceInfo = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    screenWidth: 0,
    screenHeight: 0,
    hasTouch: false,
    userAgent: '',
    platform: ''
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      // Mobile detection with iOS priority and desktop OS exclusion
      const mobileKeywords = ['android', 'webos', 'iphone', 'ipod', 'blackberry', 'windows phone', 'mobile'];
      const desktopKeywords = ['windows nt', 'linux x86_64', 'x11', 'ubuntu', 'fedora', 'debian', 'centos'];

      // iOS specific detection (enhanced)
      const iosKeywords = ['iphone', 'ipad', 'ipod'];
      const isIOS = iosKeywords.some(keyword => userAgent.includes(keyword)) ||
        (userAgent.includes('safari') && userAgent.includes('mobile')) ||
        (userAgent.includes('webkit') && userAgent.includes('mobile') && !userAgent.includes('android')) ||
        (navigator.platform && ['iPhone', 'iPad', 'iPod'].includes(navigator.platform)) ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform)) ||
        (/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream);

      const isMobileUserAgent = mobileKeywords.some(keyword => userAgent.includes(keyword));
      const isDesktopUserAgent = desktopKeywords.some(keyword => userAgent.includes(keyword));

      let isMobile = false;
      if (isIOS) {
        isMobile = true; // iOS is always mobile
      } else if (isDesktopUserAgent) {
        isMobile = false; // Desktop OS detected
      } else if (isMobileUserAgent) {
        isMobile = true; // Mobile OS detected
      } else {
        isMobile = screenWidth <= 768 && hasTouch; // Fallback to screen + touch
      }

      // Tablet detection with iPad priority
      const tabletKeywords = ['ipad', 'tablet', 'kindle', 'playbook', 'silk'];
      const isTabletUserAgent = tabletKeywords.some(keyword => userAgent.includes(keyword));
      const isIPad = userAgent.includes('ipad');

      let isTablet = false;
      if (isIPad) {
        isTablet = true; // iPad is always a tablet
      } else if (isDesktopUserAgent) {
        isTablet = false; // Desktop OS detected
      } else if (isTabletUserAgent) {
        isTablet = true; // Tablet detected
      } else {
        isTablet = !isMobile && screenWidth > 768 && screenWidth <= 1024 && hasTouch; // Fallback
      }

      // Desktop is everything else or explicitly detected desktop OS
      const isDesktop = isDesktopUserAgent || (!isMobile && !isTablet);

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        screenWidth,
        screenHeight,
        hasTouch,
        userAgent: navigator.userAgent,
        platform: (navigator as any).userAgentData?.platform || navigator.platform || 'Unknown'
      });
    };

    updateDeviceInfo();
    
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);
    
    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
};
