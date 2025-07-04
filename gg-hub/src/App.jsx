import { useState } from 'react'
import './App.css'
import IVSPlayer from './components/IVSPlayer'
import LiveChat from './components/LiveChat'

function App() {
  const [streamStatus, setStreamStatus] = useState({
    isLive: false,
    isLoading: true,
    error: null
  });

  // Your stream URL from the ivsstreamdetails.js file
  const streamUrl = "https://6376322642cf.us-west-2.playback.live-video.net/api/video/v1/us-west-2.251394915937.channel.aVHZaA2R5mCI.m3u8";

  const handleStatusChange = (status) => {
    setStreamStatus(status);
  };

  return (
    <>
      {/* Navigation Header */}
      <nav className="nav">
        <div className="nav-container">
          <div className="logo-text">Global Gaming</div>
          <div className="nav-links">
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#contact">Login</a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="main-container">
        {/* Stream and Chat Layout */}
        <div className="content-layout">
          {/* Left Side - Video Player and Stream Details */}
          <div className="stream-section">
            {/* Stream Title Header */}
            <div className="stream-header">
              <h1 className="stream-title">GG Walkalong Demo w/ ophera + AWS</h1>
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
      </div>
    </>
  )
}

export default App