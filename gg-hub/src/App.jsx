import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

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
        <h1 className="gradient-title">IVS Player</h1>
      </div>
    </>
  )
}

export default App
