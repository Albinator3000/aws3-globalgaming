import { useState, useCallback } from 'react'
import './App.css'
import IVSPlayer from './components/IVSPlayer'
import LiveChat from './components/LiveChat'
import TranscriptViewer from './components/TranscriptViewer'

function App() {
  const [currentPage, setCurrentPage] = useState('stream'); // 'stream', 'vods', 'about'
  const [streamStatus, setStreamStatus] = useState({
    isLive: false,
    isLoading: true,
    error: null
  });

  // Your stream URL from the ivsstreamdetails.js file
  const streamUrl = "https://6376322642cf.us-west-2.playback.live-video.net/api/video/v1/us-west-2.251394915937.channel.aVHZaA2R5mCI.m3u8";

  // Wrap in useCallback to prevent recreation on every render
  const handleStatusChange = useCallback((status) => {
    setStreamStatus(status);
  }, []);

  const renderCurrentPage = () => {
    switch(currentPage) {
      case 'stream':
        return renderStreamPage();
      case 'vods':
        return renderVODsPage();
      case 'about':
        return renderAboutPage();
      default:
        return renderStreamPage();
    }
  };

  const renderStreamPage = () => (
    <div className="content-layout">
      {/* Left Side - Video Player and Stream Details */}
      <div className="stream-section">
        {/* Stream Title Header */}
        <div className="stream-header">
          <h1 className="stream-title">GG Walkalong Demo w/ @ophera + AWS</h1>
          <div className={`live-indicator ${streamStatus.isLive ? 'live' : 'offline'}`}>
            <div className="live-dot"></div>
            <span>{streamStatus.isLoading ? 'connecting' : streamStatus.isLive ? 'live' : 'offline'}</span>
          </div>
        </div>

        {/* Video Player */}
        <div className="video-container">
          <IVSPlayer 
            playbackUrl={streamUrl}
            autoplay={true}
            onStatusChange={handleStatusChange}
          />
        </div>
        
        {/* Stream Controls Bar */}
        <div className="stream-controls">
          <div className="controls-left">
            <span>Mute Button using favicon</span>
            <span>Volume: volume bar</span>
            <span>Live Bitrate: # fps</span>
          </div>
        </div>

        {/* Stream Details Dropdown */}
        <div className="stream-details">
          <div className="dropdown-header">
            <span>Stream Details dropdown</span>
          </div>
        </div>
      </div>
      
      {/* Right Side - Chat */}
      <div className="chat-section">
        <div className="chat-header-custom">
          <h2 className="chat-title-custom">Chat</h2>
        </div>
        <div className="chat-wrapper">
          <LiveChat />
        </div>

        {/* Bottom Section */}
        <div className="bottom-section">
          <div className="accolades-text">
            accolades for attending the stream
          </div>
        </div>
      </div>
    </div>
  );

  const renderVODsPage = () => (
    <div className="vods-page">
      <div className="page-header">
        <h1 className="page-title">📺 Video on Demand</h1>
        <p className="page-description">Watch past streams and view transcripts with translations</p>
      </div>
      
      <div className="vods-content">
        {/* VOD Player Section */}
        <div className="vod-player-section">
          <div className="vod-header">
            <h2>Featured VODs</h2>
          </div>
          <div className="vod-grid">
            {/* Sample VOD items - we'll replace this with real data later */}
            <div className="vod-item">
              <div className="vod-thumbnail">
                <div className="thumbnail-placeholder">🎮</div>
                <div className="vod-duration">45:32</div>
              </div>
              <div className="vod-info">
                <h3>GG Walkalong Demo</h3>
                <p>January 9, 2025</p>
              </div>
            </div>
            
            <div className="vod-item">
              <div className="vod-thumbnail">
                <div className="thumbnail-placeholder">🏆</div>
                <div className="vod-duration">1:23:45</div>
              </div>
              <div className="vod-info">
                <h3>Tournament Finals</h3>
                <p>January 8, 2025</p>
              </div>
            </div>
            
            <div className="vod-item">
              <div className="vod-thumbnail">
                <div className="thumbnail-placeholder">🎯</div>
                <div className="vod-duration">32:18</div>
              </div>
              <div className="vod-info">
                <h3>Strategy Session</h3>
                <p>January 7, 2025</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transcript Viewer Section */}
        <TranscriptViewer />
      </div>
    </div>
  );

  const renderAboutPage = () => (
    <div className="about-page">
      <div className="page-header">
        <h1 className="page-title">🎮 About GlobalGaming</h1>
        <p className="page-description">Building the future of esports streaming</p>
      </div>
      
      <div className="about-content">
        <div className="about-section">
          <h2>Our Mission</h2>
          <p>
            GlobalGaming is an emerging esports tournament organizer providing high-quality, 
            low-latency video streaming for competitive gaming. Our platform supports multiple 
            languages and delivers the best viewing experience for esports fans worldwide.
          </p>
        </div>
        
        <div className="about-section">
          <h2>Technology</h2>
          <p>
            Built with cutting-edge technology including Amazon IVS for ultra-low latency 
            streaming (3-5 second delay), React for responsive user interfaces, and AWS 
            infrastructure for global scalability.
          </p>
        </div>
        
        <div className="about-section">
          <h2>Features</h2>
          <ul>
            <li>Ultra-low latency streaming (3-5 seconds)</li>
            <li>Real-time chat interaction</li>
            <li>Multi-language support</li>
            <li>Automatic transcript generation</li>
            <li>Mobile-responsive design</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Navigation Header */}
      <nav className="nav">
        <div className="nav-container">
          <div className="logo-text">Global Gaming</div>
          <div className="nav-links">
            <a 
              href="#stream" 
              className={currentPage === 'stream' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                setCurrentPage('stream');
              }}
            >
              Stream
            </a>
            <a 
              href="#vods" 
              className={currentPage === 'vods' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                setCurrentPage('vods');
              }}
            >
              VODs
            </a>
            <a 
              href="#about" 
              className={currentPage === 'about' ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                setCurrentPage('about');
              }}
            >
              About
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="main-container">
        {renderCurrentPage()}
      </div>
    </>
  )
}

export default App