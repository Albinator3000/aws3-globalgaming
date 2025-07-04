import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import IVSPlayer from './components/IVSPlayer'
import LiveChat from './components/LiveChat'

function App() {
  const [count, setCount] = useState(0)

  // Your stream URL from the ivsstreamdetails.js file
  const streamUrl = "https://6376322642cf.us-west-2.playback.live-video.net/api/video/v1/us-west-2.251394915937.channel.aVHZaA2R5mCI.m3u8";

  return (
    <>
      {/* Navigation Header */}
      <nav className="nav">
        <div className="nav-container">
          <div className="logo-text">GlobalGaming</div>
          <div className="nav-links">
            <a href="#home">Home</a>
            <a href="#about">
              About
              <div className="about-tooltip">
                <p>
                  GlobalGaming is an emerging esports tournament organizer. We are looking to provide 
                  the greatest stream for all of your favorite esports teams. Our platform delivers 
                  high-quality, low-latency video while supporting multiple languages. ©GlobalGaming LLC est. 2025
                </p>
              </div>
            </a>
            <a href="#contact">Login</a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="main-container">
        <h1 className="gradient-title">GlobalGaming Live Stream</h1>
        
        {/* Stream and Chat Layout */}
        <div style={{ 
          display: 'flex', 
          gap: '2rem', 
          width: '100%', 
          maxWidth: '1400px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'flex-start'
        }}>
          {/* Video Player */}
          <div style={{ flex: '1', minWidth: '600px', maxWidth: '900px' }}>
            <IVSPlayer 
              playbackUrl={streamUrl}
              autoplay={true}
            />
            
            {/* Stream Info */}
            <div style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              background: 'var(--card-bg)', 
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)'
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
                🏆 Championship Tournament
              </h3>
              <p style={{ margin: '0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Watch the best esports teams compete live! Ultra-low latency streaming powered by Amazon IVS.
              </p>
              <div style={{ 
                marginTop: '0.75rem', 
                display: 'flex', 
                gap: '1rem', 
                fontSize: '0.875rem',
                color: 'var(--text-secondary)'
              }}>
                <span>🎮 Multi-game Tournament</span>
                <span>🌍 Global Competition</span>
                <span>💰 $50K Prize Pool</span>
              </div>
            </div>
          </div>
          
          {/* Live Chat */}
          <div style={{ width: '400px', minWidth: '300px' }}>
            <LiveChat />
          </div>
        </div>

        {/* Quick Start Info */}
        <div className="card" style={{ marginTop: '3rem', maxWidth: '600px' }}>
          <h2>🎮 GlobalGaming Live Stream</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Ultra-low latency streaming powered by Amazon IVS. 
            Start streaming and watch it appear here in real-time!
          </p>
          
          <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--secondary-color)' }}>
            💡 <strong>Getting Started:</strong> Check the README.md file for complete setup instructions, 
            OBS configuration, and AWS CLI commands to optimize your stream.
          </p>
        </div>
      </div>
    </>
  )
}

export default App