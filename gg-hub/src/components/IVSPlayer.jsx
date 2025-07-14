import { useEffect, useRef, useState, useCallback } from 'react';

const IVSPlayer = ({ 
  playbackUrl = "https://6376322642cf.us-west-2.playback.live-video.net/api/video/v1/us-west-2.251394915937.channel.aVHZaA2R5mCI.m3u8",
  autoplay = true,
  onStatusChange = () => {} // Callback to pass status to parent
}) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState(null);
  const retryTimeoutRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Stable callback for status updates
  const updateStatus = useCallback((status) => {
    onStatusChange(status);
  }, [onStatusChange]);

  // Pass status changes to parent component
  useEffect(() => {
    updateStatus({ isLive, isLoading, error });
  }, [isLive, isLoading, error, updateStatus]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    if (playerRef.current) {
      try {
        playerRef.current.pause();
        playerRef.current.delete();
      } catch (e) {
        console.warn('Error during player cleanup:', e);
      }
      playerRef.current = null;
    }
    
    isInitializedRef.current = false;
  }, []);

  // Initialize player with better error handling
  const initializePlayer = useCallback(async () => {
    // Prevent multiple initializations
    if (isInitializedRef.current) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Load IVS Player SDK
      const script = document.createElement('script');
      script.src = 'https://player.live-video.net/1.26.0/amazon-ivs-player.min.js';
      script.async = true;
      
      script.onload = () => {
        if (!window.IVSPlayer || !videoRef.current || isInitializedRef.current) {
          return;
        }

        // Check if IVS is supported
        if (!window.IVSPlayer.isPlayerSupported) {
          setError('IVS Player is not supported in this browser');
          setIsLoading(false);
          return;
        }

        try {
          // Create the player with optimized low-latency configuration
          const player = window.IVSPlayer.create({
            // Minimal buffer configuration for low latency
            initialBufferLength: 0.5,  // Start with minimal buffer
            maxBufferLength: 2,        // Keep buffer small
            minBufferLength: 0.5,      // Minimum before seeking
            
            // Playback settings
            playbackRates: [1],        // Only normal speed
            
            // Error recovery
            enableStallDetection: true,
            stallThreshold: 3000,      // 3 second stall threshold
            maxRetries: 3,             // Limit retries
            retryDelay: 1000,          // 1 second retry delay
          });
          
          playerRef.current = player;
          isInitializedRef.current = true;

          // Attach player to video element
          player.attachHTMLVideoElement(videoRef.current);

          // Set up event listeners with better error handling
          player.addEventListener(window.IVSPlayer.PlayerState.PLAYING, () => {
            console.log('✅ Stream playing successfully');
            setIsPlaying(true);
            setIsLoading(false);
            setIsLive(true);
            setError(null);
          });

          player.addEventListener(window.IVSPlayer.PlayerState.BUFFERING, () => {
            console.log('⏳ Stream buffering...');
            setIsLoading(true);
          });

          player.addEventListener(window.IVSPlayer.PlayerState.IDLE, () => {
            console.log('⏸️ Stream idle');
            setIsPlaying(false);
            setIsLoading(false);
            setIsLive(false);
          });

          player.addEventListener(window.IVSPlayer.PlayerState.ENDED, () => {
            console.log('🔚 Stream ended');
            setIsPlaying(false);
            setIsLive(false);
            setIsLoading(false);
          });

          // Improved error handling
          player.addEventListener(window.IVSPlayer.PlayerEventType.ERROR, (err) => {
            console.error('❌ IVS Player Error:', err);
            
            let errorMessage = 'Stream temporarily unavailable';
            
            // Handle specific error types
            switch(err.type) {
              case 'NetworkError':
                errorMessage = 'Network connection issue';
                // Auto-retry network errors after delay
                retryTimeoutRef.current = setTimeout(() => {
                  if (playerRef.current && isInitializedRef.current) {
                    console.log('🔄 Retrying after network error...');
                    playerRef.current.load(playbackUrl);
                  }
                }, 3000);
                break;
              case 'NotFoundError':
                errorMessage = 'Stream not found - broadcaster may be offline';
                break;
              case 'NotSupportedError':
                errorMessage = 'Stream format not supported';
                break;
              default:
                errorMessage = `Stream error: ${err.type || 'Unknown'}`;
            }
            
            setError(errorMessage);
            setIsLoading(false);
            setIsLive(false);
            setIsPlaying(false);
          });

          // Handle quality changes
          player.addEventListener(window.IVSPlayer.PlayerEventType.QUALITY_CHANGED, (quality) => {
            console.log('📺 Quality changed:', quality);
          });

          // Handle duration changes (indicates stream activity)
          player.addEventListener(window.IVSPlayer.PlayerEventType.DURATION_CHANGED, () => {
            // Clear any existing stall recovery
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current);
              retryTimeoutRef.current = null;
            }
          });

          // Load and play the stream
          player.load(playbackUrl);
          
          // Set initial volume
          player.setVolume(volume);
          player.setMuted(autoplay); // Mute for autoplay compliance
          
          if (autoplay) {
            // Small delay to ensure proper initialization
            setTimeout(() => {
              if (playerRef.current && isInitializedRef.current) {
                playerRef.current.play().catch((err) => {
                  console.warn('⚠️ Autoplay failed (this is normal):', err.message);
                  setIsPlaying(false);
                  // Don't set this as an error since autoplay failure is common
                });
              }
            }, 500);
          }
          
        } catch (playerError) {
          console.error('❌ Failed to create player:', playerError);
          setError('Failed to initialize video player');
          setIsLoading(false);
          isInitializedRef.current = false;
        }
      };

      script.onerror = () => {
        console.error('❌ Failed to load IVS Player SDK');
        setError('Failed to load video player');
        setIsLoading(false);
      };

      // Only add script if it doesn't already exist
      if (!document.querySelector('script[src*="amazon-ivs-player"]')) {
        document.head.appendChild(script);
      } else if (window.IVSPlayer) {
        // SDK already loaded, initialize directly
        script.onload();
      }

    } catch (err) {
      console.error('❌ Failed to initialize player:', err);
      setError('Failed to initialize player');
      setIsLoading(false);
    }
  }, [playbackUrl, autoplay, volume]);

  // Initialize player on mount
  useEffect(() => {
    initializePlayer();
    
    // Cleanup on unmount
    return cleanup;
  }, [initializePlayer, cleanup]);

  // Control functions with null checks
  const togglePlayPause = useCallback(() => {
    if (!playerRef.current || !isInitializedRef.current) return;
    
    try {
      if (isPlaying) {
        playerRef.current.pause();
        setIsPlaying(false);
      } else {
        playerRef.current.play().catch((err) => {
          console.error('❌ Play failed:', err);
          setError('Failed to play stream');
        });
      }
    } catch (err) {
      console.error('❌ Toggle play/pause failed:', err);
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (!playerRef.current || !isInitializedRef.current) return;
    
    try {
      const newMutedState = !isMuted;
      playerRef.current.setMuted(newMutedState);
      setIsMuted(newMutedState);
    } catch (err) {
      console.error('❌ Toggle mute failed:', err);
    }
  }, [isMuted]);

  const handleVolumeChange = useCallback((e) => {
    if (!playerRef.current || !isInitializedRef.current) return;
    
    try {
      const newVolume = parseFloat(e.target.value);
      setVolume(newVolume);
      playerRef.current.setVolume(newVolume);
      
      if (newVolume > 0 && isMuted) {
        setIsMuted(false);
        playerRef.current.setMuted(false);
      }
    } catch (err) {
      console.error('❌ Volume change failed:', err);
    }
  }, [isMuted]);

  const toggleFullscreen = useCallback(() => {
    if (!videoRef.current) return;
    
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    } catch (err) {
      console.error('❌ Fullscreen toggle failed:', err);
    }
  }, []);

  const retryConnection = useCallback(() => {
    if (!playerRef.current || !isInitializedRef.current) {
      // Reinitialize if player is not available
      cleanup();
      initializePlayer();
      return;
    }
    
    try {
      setError(null);
      setIsLoading(true);
      playerRef.current.load(playbackUrl);
    } catch (err) {
      console.error('❌ Retry failed:', err);
      setError('Retry failed - please refresh the page');
    }
  }, [playbackUrl, cleanup, initializePlayer]);

  return (
    <div className="ivs-container">
      <div className="ivs-player">
        <video
          ref={videoRef}
          playsInline
          controls={false}
          muted={autoplay} // Required for autoplay in most browsers
          preload="none" // Don't preload to avoid conflicts
          style={{ width: '100%', height: '100%' }}
        />

        {/* Loading Indicator */}
        {isLoading && !error && (
          <div className="ivs-loading">
            <div className="ivs-loading-spinner"></div>
            <span>Loading stream...</span>
          </div>
        )}

        {/* Error Display with Retry Button */}
        {error && (
          <div className="ivs-loading">
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#ef4444', marginBottom: '1rem' }}>
                ⚠️ {error}
              </div>
              <button 
                onClick={retryConnection}
                style={{
                  background: 'rgba(124, 58, 237, 0.8)',
                  border: 'none',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                🔄 Retry
              </button>
            </div>
          </div>
        )}

        {/* Custom Controls */}
        <div className="ivs-controls">
          <button className="ivs-play-btn" onClick={togglePlayPause}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          
          <div className="ivs-progress">
            <div className="ivs-progress-bar" style={{ width: isLive ? '100%' : '0%' }}></div>
          </div>
          
          <div className="ivs-volume-control">
            <button className="ivs-volume-btn" onClick={toggleMute}>
              {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="ivs-volume-slider"
            />
          </div>
          
          <button className="ivs-fullscreen-btn" onClick={toggleFullscreen}>
            ⛶
          </button>
        </div>
      </div>
    </div>
  );
};

export default IVSPlayer;