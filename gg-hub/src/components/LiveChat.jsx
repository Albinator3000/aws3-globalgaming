// src/components/LiveChat.jsx - Improved with session management
import { useState, useEffect, useRef } from 'react';
import ChatService from '../services/chatService';

const LiveChat = ({ streamId = "aVHZaA2R5mCI", isLive = false }) => {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [onlineCount, setOnlineCount] = useState(42);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessionStats, setSessionStats] = useState({ totalMessages: 0 });
  const messagesEndRef = useRef(null);
  const randomMessageIntervalRef = useRef(null);
  const lastStreamStateRef = useRef(isLive);

  // Generate session ID when stream goes live
  useEffect(() => {
    if (isLive && !lastStreamStateRef.current) {
      // Stream just went live - start new session
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCurrentSessionId(newSessionId);
      
      // Show welcome banner at top
      const welcomeMessage = {
        id: `welcome_${newSessionId}`,
        username: "StreamMaster",
        content: "🎮 Welcome to GlobalGaming! Stream is now LIVE!",
        timestamp: new Date(),
        badges: ["mod"],
        isSystem: true,
        sessionId: newSessionId
      };
      
      setMessages([welcomeMessage]);
      setSessionStats({ totalMessages: 0 });
      
      // Save welcome message to database
      ChatService.saveMessage(welcomeMessage, streamId).catch(err => {
        console.warn("Failed to save welcome message:", err);
      });
      
      console.log(`🟢 Stream went LIVE - Session: ${newSessionId}`);
      
    } else if (!isLive && lastStreamStateRef.current) {
      // Stream just went offline - clear messages
      setMessages([]);
      setCurrentSessionId(null);
      setSessionStats({ totalMessages: 0 });
      
      console.log(`🔴 Stream went OFFLINE - Messages cleared`);
    }
    
    lastStreamStateRef.current = isLive;
  }, [isLive, streamId]);

  // Load session messages when stream is live
  useEffect(() => {
    const loadSessionMessages = async () => {
      if (!isLive || !currentSessionId) return;
      
      try {
        setIsLoading(true);
        
        // Load messages for current session
        const result = await ChatService.getSessionMessages(streamId, currentSessionId, 50);
        
        // Always keep welcome message at top
        const welcomeMessage = {
          id: `welcome_${currentSessionId}`,
          username: "StreamMaster",
          content: "🎮 Welcome to GlobalGaming! Stream is now LIVE!",
          timestamp: new Date(),
          badges: ["mod"],
          isSystem: true,
          sessionId: currentSessionId
        };
        
        const sessionMessages = result.messages.filter(msg => msg.id !== welcomeMessage.id);
        setMessages([welcomeMessage, ...sessionMessages]);
        
        setSessionStats({ totalMessages: sessionMessages.length });
        
      } catch (err) {
        console.error("❌ Error loading session messages:", err);
        setError("Failed to load chat history");
        setTimeout(() => setError(null), 3000);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentSessionId) {
      loadSessionMessages();
    }
  }, [currentSessionId, streamId, isLive]);

  // Random message generation (only when live)
  useEffect(() => {
    if (randomMessageIntervalRef.current) {
      clearInterval(randomMessageIntervalRef.current);
    }

    if (isLive && currentSessionId) {
      randomMessageIntervalRef.current = setInterval(async () => {
        const demoMessages = [
          "This is so exciting!",
          "Great gameplay! 🎮",
          "When does the next match start?",
          "The graphics are incredible",
          "Go team blue! 💙",
          "This player is insane!",
          "Best stream on the platform",
          "Love the camera angles 📹",
          "Who's your favorite player?",
          "This tournament is epic! 🏆",
          "Amazing stream quality!",
          "Can't wait for the finals!",
          "Such good commentary",
          "This game is intense! 🔥"
        ];

        const demoUsers = [
          "GamerX", "StreamFan", "EsportsLover", "ProPlayer", "TournamentWatcher",
          "GameMaster", "StreamViewer", "EpicGamer", "ChatModerator", "FanBoy2025",
          "ESportsKing", "GameChampion", "StreamAddict", "TourneyFan"
        ];

        if (Math.random() > 0.65) { // 35% chance every 4 seconds
          const newMessage = {
            id: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            username: demoUsers[Math.floor(Math.random() * demoUsers.length)],
            content: demoMessages[Math.floor(Math.random() * demoMessages.length)],
            timestamp: new Date(),
            badges: Math.random() > 0.85 ? ["sub"] : [],
            sessionId: currentSessionId
          };

          try {
            // Save to DynamoDB with session info
            await ChatService.saveMessage(newMessage, streamId);
            
            // Add to local state (keep welcome at top)
            setMessages(prev => {
              const welcomeMsg = prev.find(msg => msg.isSystem);
              const otherMsgs = prev.filter(msg => !msg.isSystem);
              const newMsgs = [...otherMsgs, newMessage].slice(-49); // Keep last 49 + welcome
              
              return welcomeMsg ? [welcomeMsg, ...newMsgs] : newMsgs;
            });
            
            // Update stats
            setSessionStats(prev => ({
              ...prev,
              totalMessages: prev.totalMessages + 1
            }));
            
          } catch (err) {
            console.error("❌ Error saving demo message:", err);
            // Still add to local state even if save fails
            setMessages(prev => {
              const welcomeMsg = prev.find(msg => msg.isSystem);
              const otherMsgs = prev.filter(msg => !msg.isSystem);
              const newMsgs = [...otherMsgs, newMessage].slice(-49);
              
              return welcomeMsg ? [welcomeMsg, ...newMsgs] : newMsgs;
            });
          }
          
          // Simulate online count fluctuation
          setOnlineCount(prev => Math.max(15, prev + Math.floor(Math.random() * 8) - 3));
        }
      }, 4000); // Every 4 seconds when live
    }

    return () => {
      if (randomMessageIntervalRef.current) {
        clearInterval(randomMessageIntervalRef.current);
      }
    };
  }, [isLive, currentSessionId, streamId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentMessage.trim() || !isLive || !currentSessionId) return;

    const newMessage = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      username: "You",
      content: currentMessage,
      timestamp: new Date(),
      badges: [],
      isOwnMessage: true,
      sessionId: currentSessionId
    };

    try {
      // Save to DynamoDB
      await ChatService.saveMessage(newMessage, streamId);
      
      // Add to local state (keep welcome at top)
      setMessages(prev => {
        const welcomeMsg = prev.find(msg => msg.isSystem);
        const otherMsgs = prev.filter(msg => !msg.isSystem);
        const newMsgs = [...otherMsgs, newMessage];
        
        return welcomeMsg ? [welcomeMsg, ...newMsgs] : newMsgs;
      });
      
      setCurrentMessage("");
      
      // Update stats
      setSessionStats(prev => ({
        ...prev,
        totalMessages: prev.totalMessages + 1
      }));
      
      console.log("✅ User message saved successfully");
      
    } catch (err) {
      console.error("❌ Error saving user message:", err);
      
      // Still add to local state even if DynamoDB fails
      setMessages(prev => {
        const welcomeMsg = prev.find(msg => msg.isSystem);
        const otherMsgs = prev.filter(msg => !msg.isSystem);
        const newMsgs = [...otherMsgs, newMessage];
        
        return welcomeMsg ? [welcomeMsg, ...newMsgs] : newMsgs;
      });
      
      setCurrentMessage("");
      
      // Show error briefly
      setError("Message sent but not saved to database");
      setTimeout(() => setError(null), 3000);
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Show different content based on stream state
  if (!isLive) {
    return (
      <div className="chat-container">
        <div className="chat-header">
          <h3 className="chat-title">Live Chat</h3>
          <div className="chat-online-count" style={{ color: '#ef4444' }}>
            Stream Offline
          </div>
        </div>
        
        <div className="chat-messages" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '300px'
        }}>
          <div style={{
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.6)',
            padding: '2rem'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>GG</div>
            <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              Stream is offline
            </div>
            <div style={{ fontSize: '0.9rem' }}>
              Chat will appear when the stream goes live
            </div>
          </div>
        </div>
        
        <div className="chat-input-container">
          <div className="chat-input-form" style={{ opacity: 0.5 }}>
            <input
              type="text"
              placeholder="Chat unavailable - stream offline"
              className="chat-input"
              disabled
            />
            <button className="chat-emoji-btn" disabled>🔥</button>
            <button className="chat-send-btn" disabled>➤</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3 className="chat-title">Live Chat</h3>
        <div className="chat-online-count" style={{ color: '#10b981' }}>
          🔴 {onlineCount} watching
          {sessionStats.totalMessages > 0 && (
            <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', opacity: 0.7 }}>
              • {sessionStats.totalMessages} messages
            </span>
          )}
        </div>
      </div>

      {/* Session info */}
      {currentSessionId && (
        <div style={{
          padding: '0.5rem 1rem',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '0',
          fontSize: '0.75rem',
          color: '#10b981',
          textAlign: 'center'
        }}>
          🎥 Live Session • {sessionStats.totalMessages} messages this stream
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          padding: '0.5rem',
          margin: '0.5rem 1rem',
          color: '#ef4444',
          fontSize: '0.8rem',
          textAlign: 'center'
        }}>
          ⚠️ {error}
        </div>
      )}
      
      <div className="chat-messages">
        {isLoading && messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255, 255, 255, 0.6)' }}>
            ⏳ Loading chat messages...
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={message.id} 
              className={`chat-message ${message.isOwnMessage ? 'own-message' : ''}`}
              style={{
                // Welcome message gets special styling and stays at top
                ...(message.isSystem && index === 0 ? {
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderColor: 'rgba(16, 185, 129, 0.3)',
                  marginBottom: '1rem',
                  order: -1 // Ensure it stays at top
                } : {})
              }}
            >
              {message.isSystem ? (
                <div className="chat-system-message" style={{ 
                  textAlign: 'center',
                  color: '#10b981',
                  fontWeight: '600'
                }}>
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
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-input-form">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder={error ? "Chat may be offline..." : "Type a message..."}
            className="chat-input"
            maxLength={500}
            disabled={!isLive || !currentSessionId}
          />
          <button 
            type="button" 
            className="chat-emoji-btn"
            onClick={() => setCurrentMessage(prev => prev + "🔥")}
            disabled={!isLive || !currentSessionId}
          >
            🔥
          </button>
          <button 
            type="submit" 
            className="chat-send-btn" 
            disabled={!currentMessage.trim() || !isLive || !currentSessionId}
          >
            ➤
          </button>
        </form>
      </div>
    </div>
  );
};

export default LiveChat;