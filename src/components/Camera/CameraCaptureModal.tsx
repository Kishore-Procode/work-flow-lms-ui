import React, { useState, useRef, useCallback } from 'react';
import { Camera, X, Check, RotateCw, MapPin, Loader, Flashlight, ZoomIn, ZoomOut, Settings, Grid3X3, Timer } from 'lucide-react';

interface CameraCaptureModalProps {
  onClose: () => void;
  onCapture: (imageBlob: Blob, location: LocationData | null, caption?: string) => void;
  imageType: string;
  setImageType: (type: 'progress' | 'issue' | 'general') => void;
  uploading: boolean;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

// Utility function to check active media streams
const checkActiveStreams = () => {
  if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('Available video devices:', videoDevices.length);
    }).catch(err => console.log('Could not enumerate devices:', err));
  }
};

const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  onClose,
  onCapture,
  imageType,
  setImageType,
  uploading
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment'); // Back camera by default

  // Enhanced camera controls
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(3);
  const [countdown, setCountdown] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [resolution, setResolution] = useState<'HD' | 'FHD' | 'UHD'>('FHD');
  const [torchSupported, setTorchSupported] = useState(false);

  // Get user location
  const getCurrentLocation = useCallback(() => {
    setLocationLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
        setLocationLoading(false);
      },
      (error) => {
        let errorMessage = 'Location access denied';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        setLocationError(errorMessage);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, []);

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      console.log('Starting camera stream...');

      // Stop any existing stream first
      if (streamRef.current) {
        console.log('Stopping existing stream before starting new one');
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        // Wait a bit for cleanup
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Resolution settings
      const resolutionSettings = {
        'HD': { width: { ideal: 1280 }, height: { ideal: 720 } },
        'FHD': { width: { ideal: 1920 }, height: { ideal: 1080 } },
        'UHD': { width: { ideal: 3840 }, height: { ideal: 2160 } }
      };

      const constraints = {
        video: {
          facingMode: facingMode,
          ...resolutionSettings[resolution],
          zoom: zoomLevel
        },
        audio: false
      };

      console.log('Requesting camera with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Double-check we don't have a race condition
      if (streamRef.current) {
        console.log('Race condition detected, stopping old stream');
        streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }

      streamRef.current = stream;
      console.log('Camera stream started successfully, tracks:', stream.getTracks().length);

      // Check torch support
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      setTorchSupported('torch' in capabilities);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
        console.log('Video element updated with new stream');
      }

      // Get location when camera starts
      getCurrentLocation();
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  }, [facingMode, getCurrentLocation]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    try {
      console.log('stopCamera called, current stream:', !!streamRef.current);

      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        console.log('Found tracks to stop:', tracks.length);

        // Stop all tracks (video and audio)
        tracks.forEach((track, index) => {
          console.log(`Stopping track ${index}:`, track.kind, track.readyState);
          track.stop();
          console.log(`Track ${index} after stop:`, track.readyState);
        });

        // Clear the stream reference
        streamRef.current = null;
        console.log('Stream reference cleared');
      }

      // Clear video element source
      if (videoRef.current) {
        console.log('Clearing video element srcObject');
        videoRef.current.srcObject = null;
        // Force video element to pause and reset
        videoRef.current.pause();
        videoRef.current.load();
      }

      setIsStreaming(false);
      setTorchEnabled(false);
      console.log('Camera stream fully stopped and cleaned up');

      // Additional cleanup - force garbage collection hint
      setTimeout(() => {
        console.log('Post-cleanup check - stream should be null:', streamRef.current);
        checkActiveStreams(); // Check what devices are still active
      }, 100);

    } catch (error) {
      console.error('Error stopping camera:', error);
    }
  }, []);

  // Switch camera (front/back)
  const switchCamera = useCallback(() => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, [stopCamera]);

  // Toggle torch/flashlight
  const toggleTorch = useCallback(async () => {
    if (!streamRef.current || !torchSupported) return;

    try {
      const track = streamRef.current.getVideoTracks()[0];
      await track.applyConstraints({
        advanced: [{ torch: !torchEnabled } as any]
      });
      setTorchEnabled(!torchEnabled);
    } catch (error) {
      console.error('Failed to toggle torch:', error);
    }
  }, [torchEnabled, torchSupported]);

  // Handle zoom
  const handleZoom = useCallback(async (direction: 'in' | 'out') => {
    if (!streamRef.current) return;

    const newZoom = direction === 'in'
      ? Math.min(zoomLevel + 0.5, 3)
      : Math.max(zoomLevel - 0.5, 1);

    try {
      const track = streamRef.current.getVideoTracks()[0];
      await track.applyConstraints({
        advanced: [{ zoom: newZoom } as any]
      });
      setZoomLevel(newZoom);
    } catch (error) {
      console.error('Failed to adjust zoom:', error);
    }
  }, [zoomLevel]);

  // Timer countdown
  const startTimer = useCallback(() => {
    if (!timerEnabled) {
      capturePhoto();
      return;
    }

    setCountdown(timerSeconds);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          capturePhoto();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [timerEnabled, timerSeconds]);

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedBlob(blob);
        setCapturedImage(canvas.toDataURL('image/jpeg', 0.8));
        stopCamera();
      }
    }, 'image/jpeg', 0.8);
  }, [stopCamera]);

  // Retake photo
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setCapturedBlob(null);
    startCamera();
  }, [startCamera]);

  // Confirm and upload photo
  const confirmPhoto = useCallback(() => {
    if (capturedBlob && location) {
      onCapture(capturedBlob, location, caption);
    } else if (capturedBlob) {
      // Upload without location if not available
      onCapture(capturedBlob, null, caption);
    }
    // Ensure camera is stopped after upload
    stopCamera();
  }, [capturedBlob, location, caption, onCapture, stopCamera]);

  // Start camera when component mounts
  React.useEffect(() => {
    startCamera();

    // Handle page visibility change (tab switch, minimize, etc.)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Page hidden, stopping camera');
        stopCamera();
      }
    };

    // Handle page unload/refresh
    const handleBeforeUnload = () => {
      console.log('Page unloading, stopping camera');
      stopCamera();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      stopCamera();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [startCamera, stopCamera]);

  // Update camera when facing mode changes
  React.useEffect(() => {
    if (isStreaming) {
      startCamera();
    }
  }, [facingMode, isStreaming, startCamera]);

  // Handle keyboard events (ESC to close)
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !uploading) {
        console.log('ESC pressed, closing camera modal');
        stopCamera();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, stopCamera, uploading]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-black/80 text-white p-4 flex items-center justify-between">
        <button
          onClick={async () => {
            console.log('Close button clicked - stopping camera');
            stopCamera(); // Ensure camera is stopped before closing

            // Wait a moment for cleanup to complete
            await new Promise(resolve => setTimeout(resolve, 200));

            onClose();
          }}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30"
          disabled={uploading}
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="text-center">
          <h2 className="text-lg font-semibold">Take Tree Photo</h2>
          {location && (
            <p className="text-sm text-blue-400 flex items-center justify-center">
              <MapPin className="w-4 h-4 mr-1" />
              Location captured
            </p>
          )}
          {locationLoading && (
            <p className="text-sm text-yellow-400 flex items-center justify-center">
              <Loader className="w-4 h-4 mr-1 animate-spin" />
              Getting location...
            </p>
          )}
          {locationError && (
            <p className="text-sm text-red-400">
              {locationError}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {isStreaming && (
            <>
              {/* Settings */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Switch Camera */}
              <button
                onClick={switchCamera}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30"
              >
                <RotateCw className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative bg-black">
        {!capturedImage ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: `scale(${zoomLevel})` }}
            />

            {/* Grid Overlay */}
            {showGrid && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="border border-white/30"></div>
                  ))}
                </div>
              </div>
            )}

            {/* Countdown Timer */}
            {countdown > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-8xl font-bold text-white animate-pulse">
                  {countdown}
                </div>
              </div>
            )}

            {/* Side Controls */}
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 space-y-4">
              {/* Torch */}
              {torchSupported && (
                <button
                  onClick={toggleTorch}
                  className={`p-3 rounded-full ${torchEnabled ? 'bg-yellow-500' : 'bg-white/20'} hover:bg-white/30 transition-colors`}
                >
                  <Flashlight className={`w-6 h-6 ${torchEnabled ? 'text-black' : 'text-white'}`} />
                </button>
              )}

              {/* Zoom Controls */}
              <div className="space-y-2">
                <button
                  onClick={() => handleZoom('in')}
                  disabled={zoomLevel >= 3}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-50 block"
                >
                  <ZoomIn className="w-5 h-5 text-white" />
                </button>
                <div className="text-white text-xs text-center">
                  {zoomLevel.toFixed(1)}x
                </div>
                <button
                  onClick={() => handleZoom('out')}
                  disabled={zoomLevel <= 1}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-50 block"
                >
                  <ZoomOut className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Grid Toggle */}
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`p-2 rounded-full ${showGrid ? 'bg-blue-500' : 'bg-white/20'} hover:bg-white/30 transition-colors`}
              >
                <Grid3X3 className={`w-5 h-5 ${showGrid ? 'text-white' : 'text-white'}`} />
              </button>
            </div>

            {/* Camera Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center justify-between">
                {/* Timer Toggle */}
                <button
                  onClick={() => setTimerEnabled(!timerEnabled)}
                  className={`p-3 rounded-full ${timerEnabled ? 'bg-blue-500' : 'bg-white/20'} hover:bg-white/30 transition-colors`}
                >
                  <Timer className={`w-6 h-6 text-white`} />
                </button>

                {/* Capture Button */}
                <button
                  onClick={startTimer}
                  disabled={!isStreaming || locationLoading || countdown > 0}
                  className="w-20 h-20 rounded-full border-4 border-white bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Camera className="w-8 h-8 text-white" />
                </button>

                {/* Settings Panel Toggle */}
                <div className="w-12"></div> {/* Spacer for centering */}
              </div>

              {locationLoading && (
                <p className="text-center text-white mt-4">
                  Please wait while we get your location...
                </p>
              )}
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="absolute top-16 right-4 bg-black/80 rounded-lg p-4 space-y-4 min-w-[200px]">
                <h3 className="text-white font-medium">Camera Settings</h3>

                {/* Resolution */}
                <div>
                  <label className="block text-white text-sm mb-1">Resolution</label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value as any)}
                    className="w-full bg-white/20 text-white border border-white/30 rounded px-2 py-1 text-sm"
                  >
                    <option value="HD" className="text-black">HD (720p)</option>
                    <option value="FHD" className="text-black">Full HD (1080p)</option>
                    <option value="UHD" className="text-black">4K (2160p)</option>
                  </select>
                </div>

                {/* Timer Settings */}
                {timerEnabled && (
                  <div>
                    <label className="block text-white text-sm mb-1">Timer (seconds)</label>
                    <select
                      value={timerSeconds}
                      onChange={(e) => setTimerSeconds(Number(e.target.value))}
                      className="w-full bg-white/20 text-white border border-white/30 rounded px-2 py-1 text-sm"
                    >
                      <option value={3} className="text-black">3 seconds</option>
                      <option value={5} className="text-black">5 seconds</option>
                      <option value={10} className="text-black">10 seconds</option>
                    </select>
                  </div>
                )}

                {/* Camera Info */}
                <div className="text-xs text-gray-300 space-y-1">
                  <div>Camera: {facingMode === 'environment' ? 'Back' : 'Front'}</div>
                  <div>Zoom: {zoomLevel.toFixed(1)}x</div>
                  {torchSupported && <div>Torch: {torchEnabled ? 'On' : 'Off'}</div>}
                  <div>Grid: {showGrid ? 'On' : 'Off'}</div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Captured Image Preview */}
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover"
            />
            
            {/* Image Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <div className="space-y-4">
                {/* Image Type Selection */}
                <div className="bg-black/60 rounded-lg p-4">
                  <label className="block text-white text-sm font-medium mb-2">
                    Image Type
                  </label>
                  <select
                    value={imageType}
                    onChange={(e) => setImageType(e.target.value as any)}
                    className="w-full bg-white/20 text-white border border-white/30 rounded-md px-3 py-2"
                  >
                    <option value="progress" className="text-black">Progress Update</option>
                    <option value="issue" className="text-black">Issue/Problem</option>
                    <option value="general" className="text-black">General Photo</option>
                  </select>
                </div>

                {/* Caption Input */}
                <div className="bg-black/60 rounded-lg p-4">
                  <label className="block text-white text-sm font-medium mb-2">
                    Caption (Optional)
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full bg-white/20 text-white border border-white/30 rounded-md px-3 py-2 placeholder-white/60"
                    rows={2}
                    placeholder="Describe your tree's progress..."
                  />
                </div>

                {/* Location Info */}
                {location && (
                  <div className="bg-blue-600/80 rounded-lg p-3">
                    <p className="text-white text-sm flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      Location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      <br />
                      <span className="text-xs">Accuracy: ±{Math.round(location.accuracy)}m</span>
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={retakePhoto}
                    disabled={uploading}
                    className="flex-1 bg-white/20 text-white border border-white/30 rounded-lg py-3 font-medium hover:bg-white/30 disabled:opacity-50"
                  >
                    Retake
                  </button>
                  <button
                    onClick={confirmPhoto}
                    disabled={!capturedBlob || uploading}
                    className="flex-1 bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    {uploading ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Upload Photo
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCaptureModal;
