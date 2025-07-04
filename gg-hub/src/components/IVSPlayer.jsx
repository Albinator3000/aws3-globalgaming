import { useEffect, useRef, useState } from 'react';

const IVSPlayer = ({ 
  playbackUrl = "https://6376322642cf.us-west-2.playback.live-video.net/api/video/v1/us-west-2.251394915937.channel.aVHZaA2R5mCI.m3u8",
  autoplay = true 
}) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializePlayer = async () => {
      try {
        // Load IVS Player SDK
        const script = document.createElement('script');
        script.src = 'https://player.live-video.net/1.26.0/amazon-ivs-player.min.js';
        script.async = true;
        
        script.onload = () => {
          if (window.IVSPlayer && videoRef.current) {
            // Check if IVS is supported
            if (!window.IVSPlayer.isPlayerSupported) {
              setError('IVS Player is not supported in this browser');
              setIsLoading(false);
              return;
            }

            // Create the player with low-latency configuration
            const player = window.IVSPlayer.create({
              // Enable low-latency mode for ultra-low latency
              streamingTechnology: 'llhls', // Low-Latency HLS
              
              // Buffer configuration for minimal latency
              maxBufferLength: 3, // Keep only 3 seconds in buffer
              minBufferLength: 1, // Start playback with 1 second buffered
              
              // Quality settings for better performance
              initialBufferLength: 1, // Reduce initial buffer
              
              // Retry configuration
              maxRetries: 5,
              retryDelay: 2000,
              
              // Playback settings
              playbackRates: [1], // Only normal speed to avoid additional processing
              
              // Error recovery
              enableStallDetection: true,
              stallThreshold: 2000 // 2 second stall threshold
            });
            
            playerRef.current = player;

            // Attach player to video element
            player.attachHTMLVideoElement(videoRef.current);

            // Enhanced event listeners
            player.addEventListener(window.IVSPlayer.PlayerState.PLAYING, () => {
              console.log('Stream playing successfully');
              setIsPlaying(true);
              setIsLoading(false);
              setIsLive(true);
              setError(null);
            });

            player.addEventListener(window.IVSPlayer.PlayerState.BUFFERING, () => {
              console.log('Stream buffering...');
              setIsLoading(true);
            });

            player.addEventListener(window.IVSPlayer.PlayerState.IDLE, () => {
              console.log('Stream idle');
              setIsPlaying(false);
              setIsLoading(false);
              setIsLive(false);
            });

            player.addEventListener(window.IVSPlayer.PlayerState.ENDED, () => {
              console.log('Stream ended');
              setIsPlaying(false);
              setIsLive(false);
            });

            // Better error handling
            player.addEventListener(window.IVSPlayer.PlayerEventType.ERROR, (err) => {
              console.error('IVS Player Error:', err);
              
              // Handle different error types
              if (err.type === 'NetworkError') {
                setError('Network connection issue - retrying...');
                // Auto-retry after network errors
                setTimeout(() => {
                  if (playerRef.current) {
                    playerRef.current.load(playbackUrl);
                  }
                }, 3000);
              } else if (err.type === 'NotFoundError') {
                setError('Stream not found - broadcaster may be offline');
              } else {
                setError('Stream temporarily unavailable');
              }
              
              setIsLoading(false);
              setIsLive(false);
            });

            // Quality change events
            player.addEventListener(window.IVSPlayer.PlayerEventType.QUALITY_CHANGED, (quality) => {
              console.log('Quality changed to:', quality);
            });

            // Metadata for live status
            player.addEventListener(window.IVSPlayer.PlayerEventType.TEXT_METADATA_CUE, (cue) => {
              console.log('Stream metadata:', cue.text);
            });

            // Handle stalls and recover
            let stallTimeout;
            player.addEventListener(window.IVSPlayer.PlayerEventType.DURATION_CHANGED, () => {
              clearTimeout(stallTimeout);
              stallTimeout = setTimeout(() => {
                if (playerRef.current && playerRef.current.getState() === window.IVSPlayer.PlayerState.BUFFERING) {
                  console.log('Recovering from stall...');
                  playerRef.current.load(playbackUrl);
                }
              }, 5000);
            });

            // Load and play the stream with error handling
            try {
              player.load(playbackUrl);
              
              if (autoplay) {
                // Delay autoplay slightly to ensure proper initialization
                setTimeout(() => {
                  player.play().catch((err) => {
                    console.warn('Autoplay failed:', err);
                    setIsPlaying(false);
                  });
                }, 100);
              }

              // Set initial volume
              player.setVolume(volume);
              
            } catch (loadError) {
              console.error('Failed to load stream:', loadError);
              setError('Failed to load stream');
              setIsLoading(false);
            }
          }
        };

        script.onerror = () => {
          setError('Failed to load IVS Player SDK');
          setIsLoading(false);
        };

        document.head.appendChild(script);

        return () => {
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }
        };
      } catch (err) {
        console.error('Failed to initialize player:', err);
        setError('Failed to initialize player');
        setIsLoading(false);
      }
    };

    initializePlayer();

    // Cleanup
    return () => {
      if (playerRef.current) {
        playerRef.current.delete();
      }
    };
  }, [playbackUrl, autoplay, volume]);

  const togglePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pause();
        setIsPlaying(false);
      } else {
        playerRef.current.play().catch((err) => {
          console.error('Play failed:', err);
        });
      }
    }
  };

  const toggleMute = () => {
    if (playerRef.current) {
      const newMutedState = !isMuted;
      playerRef.current.setMuted(newMutedState);
      setIsMuted(newMutedState);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume);
      if (newVolume > 0 && isMuted) {
        setIsMuted(false);
        playerRef.current.setMuted(false);
      }
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

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
        
        {/* Status Indicator */}
        <div className={`ivs-status ${isLive ? 'live' : 'offline'}`}>
          <div className="ivs-status-dot"></div>
          {isLive ? 'LIVE' : 'OFFLINE'}
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="ivs-loading">
            <div className="ivs-loading-spinner"></div>
            Loading stream...
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="ivs-loading">
            <span style={{ color: '#ef4444' }}>⚠️ {error}</span>
          </div>
        )}

        {/* Custom Controls */}
        <div className="ivs-controls">
          <button className="ivs-play-btn" onClick={togglePlayPause}>
            {isPlaying ? '⏸️' : '▶️'}
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