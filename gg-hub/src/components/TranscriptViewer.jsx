import { useState, useEffect } from 'react';

const TranscriptViewer = () => {
  const [transcripts, setTranscripts] = useState([]);
  const [selectedTranscript, setSelectedTranscript] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('original');
  const [loading, setLoading] = useState(false);

  // Sample data for now - we'll replace this with real data later
  useEffect(() => {
    // Simulate loading some sample transcript data
    const sampleTranscripts = [
      {
        id: 'demo-transcript-1',
        title: 'GG Walkalong Demo w/ @ophera + AWS',
        date: '2025-01-09T15:30:00Z',
        duration: '45 minutes',
        transcript: `Welcome to GlobalGaming! Today we're doing a walkthrough of our new streaming platform with AWS integration. 

This is really exciting because we're showing off the ultra-low latency features that make our platform perfect for competitive gaming. 

The Amazon IVS integration allows us to achieve 3-5 second delay, which is crucial for real-time interaction with viewers during tournament streams.

We're also demonstrating the chat features and how they integrate seamlessly with the video player. This creates an immersive experience for esports fans worldwide.

Thank you for joining us today, and we hope you enjoy exploring the platform!`,
        translations: {
          'es': 'Bienvenidos a GlobalGaming! Hoy estamos haciendo un recorrido de nuestra nueva plataforma de streaming con integración de AWS...',
          'fr': 'Bienvenue sur GlobalGaming! Aujourd\'hui, nous faisons une démonstration de notre nouvelle plateforme de streaming avec l\'intégration AWS...',
          'de': 'Willkommen bei GlobalGaming! Heute machen wir eine Demonstration unserer neuen Streaming-Plattform mit AWS-Integration...'
        }
      }
    ];

    setTranscripts(sampleTranscripts);
  }, []);

  // Language options
  const languageOptions = {
    'original': 'English (Original)',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German'
  };

  const handleSelectTranscript = (transcript) => {
    setSelectedTranscript(transcript);
    setSelectedLanguage('original');
  };

  const getCurrentText = () => {
    if (!selectedTranscript) return '';
    
    if (selectedLanguage === 'original') {
      return selectedTranscript.transcript;
    }
    
    return selectedTranscript.translations?.[selectedLanguage] || 'Translation not available';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="transcript-viewer">
      <div className="transcript-header">
        <h2>📝 Stream Transcripts</h2>
        <p>View transcripts and translations of your streams</p>
      </div>

      <div className="transcript-content">
        {/* Left side - Transcript list */}
        <div className="transcript-list">
          <h3>Available Transcripts</h3>
          {transcripts.length === 0 ? (
            <div className="no-transcripts">
              <p>No transcripts available yet.</p>
              <p>Process your VOD files to generate transcripts.</p>
            </div>
          ) : (
            <div className="transcript-items">
              {transcripts.map((transcript) => (
                <div 
                  key={transcript.id}
                  className={`transcript-item ${selectedTranscript?.id === transcript.id ? 'selected' : ''}`}
                  onClick={() => handleSelectTranscript(transcript)}
                >
                  <div className="transcript-item-title">{transcript.title}</div>
                  <div className="transcript-item-meta">
                    <span>📅 {formatDate(transcript.date)}</span>
                    <span>⏱️ {transcript.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right side - Transcript display */}
        {selectedTranscript && (
          <div className="transcript-display">
            <div className="transcript-controls">
              <div className="language-selector">
                <label htmlFor="language-select">Language:</label>
                <select 
                  id="language-select"
                  value={selectedLanguage} 
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                >
                  {Object.entries(languageOptions).map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              
              <button 
                className="download-btn"
                onClick={() => console.log('Download feature coming soon!')}
              >
                📥 Download
              </button>
            </div>

            <div className="transcript-text">
              <div className="transcript-meta">
                <strong>Title:</strong> {selectedTranscript.title}<br/>
                <strong>Date:</strong> {formatDate(selectedTranscript.date)}<br/>
                <strong>Duration:</strong> {selectedTranscript.duration}
              </div>
              
              <div className="transcript-body">
                {getCurrentText().split('\n\n').map((paragraph, index) => (
                  paragraph.trim() && (
                    <p key={index} className="transcript-paragraph">
                      {paragraph.trim()}
                    </p>
                  )
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Show prompt when no transcript is selected */}
        {!selectedTranscript && (
          <div className="transcript-placeholder">
            <div className="placeholder-content">
              <h3>Select a transcript to view</h3>
              <p>Choose a transcript from the list to see the content and available translations.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptViewer;