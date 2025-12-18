import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';

interface SecureImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  onError?: () => void;
}

const SecureImage: React.FC<SecureImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  fallback = null,
  onError 
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const loadSecureImage = async () => {
      try {
        setLoading(true);
        setError(false);

        // Get auth token
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('No authentication token');
        }

        // Fetch image with authentication
        const response = await fetch(src, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        
        if (!isCancelled) {
          const objectUrl = URL.createObjectURL(blob);
          setImageSrc(objectUrl);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading secure image:', err);
        if (!isCancelled) {
          setError(true);
          setLoading(false);
          onError?.();
        }
      }
    };

    if (src) {
      loadSecureImage();
    }

    return () => {
      isCancelled = true;
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [src, onError]);

  // Cleanup object URL when component unmounts
  useEffect(() => {
    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 ${className}`}>
        <div className="w-full h-full bg-gray-300 rounded"></div>
      </div>
    );
  }

  if (error || !imageSrc) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <div className="text-gray-400 text-center">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs">Failed to load</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={() => {
        setError(true);
        onError?.();
      }}
    />
  );
};

export default SecureImage;
