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
            <a href="#contact">Contact</a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="main-container">
        <div>
          <a href="https://vite.dev" target="_blank">
            <img src={viteLogo} className="logo" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="logo react" alt="React logo" />
          </a>
        </div>
        <h1 className="gradient-title">Vite + React</h1>
        <div className="card">
          <button className="btn-primary" onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
          <p>
            Edit <code>src/App.jsx</code> and save to test HMR
          </p>
        </div>
        <p className="read-the-docs">
          Click on the Vite and React logos to learn more
        </p>
      </div>
    </>
  )
}

export default App
