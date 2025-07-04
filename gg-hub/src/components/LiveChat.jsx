import { useState, useEffect, useRef } from 'react';

const LiveChat = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      username: "StreamMaster",
      content: "Welcome to GlobalGaming!",
      timestamp: new Date(),
      badges: ["mod"],
      isSystem: true
    },
    {
      id: 2,
      username: "ProGamer2025",
      content: "This stream quality is amazing!",
      timestamp: new Date(Date.now() - 30000),
      badges: ["sub"]
    },
    {
      id: 3,
      username: "EsportsEnthusiast",
      content: "Can't wait for the tournament!",
      timestamp: new Date(Date.now() - 60000),
      badges: []
    }
  ]);
  
  const [currentMessage, setCurrentMessage] = useState("");
  const [onlineCount, setOnlineCount] = useState(42);
  const messagesEndRef = useRef(null);

  // Simulate new messages for demo
  useEffect(() => {
    const interval = setInterval(() => {
      const demoMessages = [
        "This is so exciting!",
        "Great gameplay!",
        "When does the next match start?",
        "The graphics are incredible",
        "Go team blue!",
        "This player is insane!",
        "Best stream on the platform",
        "Love the camera angles",
        "Who's your favorite player?",
        "This tournament is epic!"
      ];

      const demoUsers = [
        "GamerX", "StreamFan", "EsportsLover", "ProPlayer", "TournamentWatcher",
        "GameMaster", "StreamViewer", "EpicGamer", "ChatModerator", "FanBoy2025"
      ];

      if (Math.random() > 0.7) { // 30% chance every 3 seconds
        const newMessage = {
          id: Date.now(),
          username: demoUsers[Math.floor(Math.random() * demoUsers.length)],
          content: demoMessages[Math.floor(Math.random() * demoMessages.length)],
          timestamp: new Date(),
          badges: Math.random() > 0.8 ? ["sub"] : []
        };

        setMessages(prev => [...prev.slice(-50), newMessage]); // Keep last 50 messages
        
        // Simulate online count fluctuation
        setOnlineCount(prev => Math.max(20, prev + Math.floor(Math.random() * 6) - 2));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentMessage.trim()) {
      const newMessage = {
        id: Date.now(),
        username: "You",
        content: currentMessage,
        timestamp: new Date(),
        badges: [],
        isOwnMessage: true
      };

      setMessages(prev => [...prev, newMessage]);
      setCurrentMessage("");
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3 className="chat-title">Live Chat</h3>
        <div className="chat-online-count">{onlineCount} online</div>
      </div>
      
      <div className="chat-messages">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`chat-message ${message.isOwnMessage ? 'own-message' : ''}`}
          >
            {message.isSystem ? (
              <div className="chat-system-message">
                {message.content}
              </div>
            ) : (
              <>
                <div className="chat-message-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {message.badges?.map((badge, idx) => (
                      <span key={idx} className={`chat-badge ${badge}`}>
                        {badge}
                      </span>
                    ))}
                    <span 
                      className={`chat-username ${message.badges?.includes('mod') ? 'moderator' : ''} ${message.badges?.includes('sub') ? 'subscriber' : ''}`}
                    >
                      {message.username}
                    </span>
                  </div>
                  <span className="chat-timestamp">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <div className="chat-message-content">
                  {message.content}
                </div>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-input-form">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="Type a message..."
            className="chat-input"
            maxLength={500}
          />
          <button 
            type="button" 
            className="chat-emoji-btn"
            onClick={() => setCurrentMessage(prev => prev + "🔥")}
          >
            🔥
          </button>
          <button type="submit" className="chat-send-btn" disabled={!currentMessage.trim()}>
            ➤
          </button>
        </form>
      </div>
    </div>
  );
};

export default LiveChat;