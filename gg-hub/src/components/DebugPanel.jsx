// src/components/DebugPanel.jsx
import { useState, useEffect } from 'react';
import ChatService from '../services/chatService';

const DebugPanel = () => {
  const [status, setStatus] = useState({
    loading: true,
    connectionTest: null,
    config: null,
    error: null
  });

  useEffect(() => {
    const checkConfiguration = async () => {
      try {
        setStatus(prev => ({ ...prev, loading: true }));

        // Get connection status
        const config = ChatService.getConnectionStatus();
        
        // Test connection
        let connectionTest = null;
        if (config.isConnected) {
          try {
            connectionTest = await ChatService.testConnection();
          } catch (error) {
            connectionTest = false;
            console.error("Connection test failed:", error);
          }
        }

        setStatus({
          loading: false,
          connectionTest,
          config,
          error: null
        });

      } catch (error) {
        setStatus({
          loading: false,
          connectionTest: false,
          config: null,
          error: error.message
        });
      }
    };

    checkConfiguration();
  }, []);

  const getStatusIcon = (condition) => {
    if (condition === null) return "⏳";
    return condition ? "✅" : "❌";
  };

  const getStatusColor = (condition) => {
    if (condition === null) return "#fbbf24";
    return condition ? "#10b981" : "#ef4444";
  };

  const testMessage = async () => {
    try {
      const testMsg = {
        id: `test_${Date.now()}`,
        username: "TestUser",
        content: "Test message from debug panel",
        timestamp: new Date(),
        badges: [],
        isSystem: false
      };

      await ChatService.saveMessage(testMsg, "debug-test-stream");
      alert("✅ Test message saved successfully!");
      
    } catch (error) {
      alert(`❌ Test failed: ${error.message}`);
    }
  };

  const loadMessages = async () => {
    try {
      const result = await ChatService.getMessages("debug-test-stream", 5);
      console.log("Loaded messages:", result);
      alert(`✅ Loaded ${result.messages.length} messages. Check console for details.`);
      
    } catch (error) {
      alert(`❌ Load failed: ${error.message}`);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '1rem',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      fontSize: '0.8rem',
      fontFamily: 'monospace',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>🔍 DynamoDB Debug Panel</h3>
      
      {status.loading ? (
        <div>⏳ Checking configuration...</div>
      ) : (
        <>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Configuration:</strong>
          </div>
          
          <div style={{ marginLeft: '1rem', marginBottom: '0.5rem' }}>
            <div style={{ color: getStatusColor(status.config?.hasCredentials) }}>
              {getStatusIcon(status.config?.hasCredentials)} AWS Credentials
            </div>
            <div style={{ color: getStatusColor(status.config?.isConnected) }}>
              {getStatusIcon(status.config?.isConnected)} Client Initialized
            </div>
            <div style={{ color: getStatusColor(status.connectionTest) }}>
              {getStatusIcon(status.connectionTest)} Table Connection
            </div>
          </div>

          <div style={{ marginBottom: '0.5rem', fontSize: '0.7rem', opacity: 0.8 }}>
            <div>Region: {status.config?.region}</div>
            <div>Table: {status.config?.tableName}</div>
          </div>

          {status.error && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.2)', 
              padding: '0.5rem', 
              borderRadius: '4px',
              marginBottom: '0.5rem',
              fontSize: '0.7rem'
            }}>
              ❌ {status.error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
            <button 
              onClick={testMessage}
              style={{
                background: '#10b981',
                border: 'none',
                color: 'white',
                padding: '0.3rem 0.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.7rem'
              }}
            >
              🧪 Test Save Message
            </button>
            <button 
              onClick={loadMessages}
              style={{
                background: '#3b82f6',
                border: 'none',
                color: 'white',
                padding: '0.3rem 0.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.7rem'
              }}
            >
              📥 Test Load Messages
            </button>
          </div>

          <div style={{ marginTop: '0.5rem', fontSize: '0.6rem', opacity: 0.6 }}>
            Check browser console for detailed logs
          </div>
        </>
      )}
    </div>
  );
};

export default DebugPanel;