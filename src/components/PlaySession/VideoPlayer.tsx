/**
 * Isolated Video Player Component
 * 
 * Completely isolated video player that prevents re-renders
 * 
 * @author Student-ACT LMS Team
 * @version 1.0.0
 */

import React from 'react';
import { Video } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  title: string;
  thumbnail?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = React.memo(({ url, title, thumbnail }) => {
  // Memoize the embed URL calculation
  const embedUrl = React.useMemo(() => {
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    
    if (!isYouTube) return url;

    let processedUrl = url;

    // Handle youtu.be short URLs
    if (processedUrl.includes('youtu.be/')) {
      const videoId = processedUrl.split('youtu.be/')[1].split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    // Handle youtube.com/watch URLs
    else if (processedUrl.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(processedUrl.split('?')[1]);
      const videoId = urlParams.get('v');
      return `https://www.youtube.com/embed/${videoId}`;
    }
    // Handle other formats with regex
    else if (!processedUrl.includes('/embed/')) {
      const videoIdMatch = processedUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (videoIdMatch && videoIdMatch[1]) {
        return `https://www.youtube.com/embed/${videoIdMatch[1]}`;
      }
    }

    return processedUrl;
  }, [url]);

  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

  if (!url) {
    return (
      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Video className="h-16 w-16 mx-auto mb-2" />
          <p>Video content not available</p>
        </div>
      </div>
    );
  }

  if (isYouTube) {
    return (
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title}
        />
      </div>
    );
  }

  // For non-YouTube videos
  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden">
      <video
        src={embedUrl}
        controls
        className="w-full h-full"
        poster={thumbnail}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if URL changes
  return prevProps.url === nextProps.url;
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;

