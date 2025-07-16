// src/components/AIMetricsWidget.jsx - AWS Bedrock-powered chat analytics
import { useState, useEffect, useCallback } from 'react';
import ChatService from '../services/chatService';
import BedrockService from '../services/bedrockService';

const AIMetricsWidget = ({ streamId, currentSessionId, isLive, isExpanded, onToggle }) => {
  const [metrics, setMetrics] = useState({
    sentiment: {
      overall: 'neutral',
      score: 0,
      confidence: 0,
      summary: '',
      highlights: [],
      topics: [],
      engagement: { level: 'low' },
      recommendations: []
    },
    badges: {
      distribution: {},
      total_users: 0,
      analysis: null
    },
    activity: {
      totalMessages: 0,
      uniqueUsers: 0,
      lastUpdated: null
    },
    isAnalyzing: false,
    lastAnalysis: null
  });
  
  const [error, setError] = useState(null);
  const [bedrockStatus, setBedrockStatus] = useState('checking');

  // Test Bedrock connection on mount
  useEffect(() => {
    const testBedrock = async () => {
      try {
        const isConnected = await BedrockService.testConnection();
        setBedrockStatus(isConnected ? 'connected' : 'disconnected');
      } catch (err) {
        setBedrockStatus('error');
        console.error("Bedrock connection test failed:", err);
      }
    };

    testBedrock();
  }, []);

  // Auto-refresh metrics every 2 minutes when live
  useEffect(() => {
    if (!isLive || !currentSessionId) return;

    const interval = setInterval(() => {
      refreshMetrics();
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [isLive, currentSessionId]);

  // Get sentiment emoji and color
  const getSentimentDisplay = (sentiment) => {
    switch (sentiment) {
      case 'very positive':
        return { emoji: '🤩', color: '#10b981', label: 'Very Positive' };
      case 'positive':
        return { emoji: '😊', color: '#10b981', label: 'Positive' };
      case 'excited':
        return { emoji: '🔥', color: '#f59e0b', label: 'Excited' };
      case 'mixed':
        return { emoji: '🤔', color: '#6b7280', label: 'Mixed' };
      case 'negative':
        return { emoji: '😕', color: '#ef4444', label: 'Negative' };
      case 'neutral':
      default:
        return { emoji: '😐', color: '#6b7280', label: 'Neutral' };
    }
  };

  // Get engagement level color
  const getEngagementColor = (level) => {
    switch (level) {
      case 'very_high': return '#10b981';
      case 'high': return '#059669';
      case 'medium': return '#f59e0b';
      case 'low': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Refresh all metrics
  const refreshMetrics = useCallback(async () => {
    if (!currentSessionId || !isLive) {
      console.log("⚠️ Cannot refresh metrics: no active session");
      return;
    }

    setMetrics(prev => ({ ...prev, isAnalyzing: true }));
    setError(null);

    try {
      console.log("🔄 Refreshing AI metrics for session:", currentSessionId);

      // Get session messages
      const messagesResult = await ChatService.getSessionMessages(streamId, currentSessionId, 100);
      const messages = messagesResult.messages || [];

      if (messages.length === 0) {
        setMetrics(prev => ({
          ...prev,
          isAnalyzing: false,
          sentiment: {
            overall: 'neutral',
            score: 0,
            confidence: 0,
            summary: 'No messages in this session yet.',
            highlights: [],
            topics: [],
            engagement: { level: 'low' },
            recommendations: ['Start engaging with viewers to build community!']
          },
          activity: {
            totalMessages: 0,
            uniqueUsers: 0,
            lastUpdated: new Date()
          }
        }));
        return;
      }

      // Run sentiment analysis and badge analysis in parallel
      const [sentimentAnalysis, badgeAnalysis] = await Promise.all([
        BedrockService.analyzeChatSentiment(messages, `GlobalGaming esports stream session ${currentSessionId}`),
        BedrockService.analyzeBadgeDistribution(messages)
      ]);

      // Calculate activity metrics
      const userMessages = messages.filter(msg => !msg.isSystem);
      const uniqueUsers = new Set(userMessages.map(msg => msg.username)).size;

      setMetrics({
        sentiment: sentimentAnalysis,
        badges: badgeAnalysis,
        activity: {
          totalMessages: userMessages.length,
          uniqueUsers: uniqueUsers,
          lastUpdated: new Date()
        },
        isAnalyzing: false,
        lastAnalysis: new Date()
      });

      console.log("✅ AI metrics refreshed successfully");

    } catch (err) {
      console.error("❌ Error refreshing AI metrics:", err);
      setError(`Analysis failed: ${err.message}`);
      setMetrics(prev => ({ ...prev, isAnalyzing: false }));
    }
  }, [streamId, currentSessionId, isLive]);

  // Format badge distribution for display
  const formatBadgeDistribution = () => {
    const { distribution, total_users } = metrics.badges;
    if (!distribution || total_users === 0) return [];

    const badgeNames = {
      1: '🥉 Newcomer',
      2: '💬 Chatter', 
      3: '🗣️ Active Voice',
      4: '👥 Community Member',
      5: '🏆 Chat Champion',
      6: '⭐ Legend'
    };

    return Object.entries(distribution)
      .filter(([level, count]) => count > 0)
      .map(([level, count]) => ({
        level: parseInt(level),
        name: badgeNames[level] || `Level ${level}`,
        count: count,
        percentage: Math.round((count / total_users) * 100)
      }))
      .sort((a, b) => b.level - a.level);
  };

  if (!isLive) {
    return (
      <div className="stream-details">
        <div 
          className="dropdown-header"
          style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          onClick={onToggle}
        >
          <span>Stream Analytics Powered by Amazon Bedrock• Stream Offline</span>
          <span style={{ fontSize: '0.8rem' }}>{isExpanded ? '▼' : '▶'}</span>
        </div>
        
        {isExpanded && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>GG Analytics</div>
            <div>AI analytics will activate when stream goes live</div>
          </div>
        )}
      </div>
    );
  }

  const sentimentDisplay = getSentimentDisplay(metrics.sentiment.overall);
  const badgeData = formatBadgeDistribution();

  return (
    <div className="stream-details">
      <div 
        className="dropdown-header"
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        onClick={onToggle}
      >
        <span>
          🤖 AI Stream Analytics • 
          <span style={{ color: sentimentDisplay.color, marginLeft: '0.5rem' }}>
            {sentimentDisplay.emoji} {sentimentDisplay.label}
          </span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              refreshMetrics();
            }}
            disabled={metrics.isAnalyzing}
            style={{
              background: 'rgba(124, 58, 237, 0.8)',
              border: 'none',
              color: 'white',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              cursor: metrics.isAnalyzing ? 'not-allowed' : 'pointer',
              fontSize: '0.7rem',
              opacity: metrics.isAnalyzing ? 0.6 : 1
            }}
          >
            {metrics.isAnalyzing ? '⏳' : '🔄'} Refresh
          </button>
          <span style={{ fontSize: '0.8rem' }}>{isExpanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {isExpanded && (
        <div style={{ marginTop: '1rem' }}>
          {/* Bedrock Status */}
          <div style={{
            padding: '0.5rem',
            background: bedrockStatus === 'connected' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${bedrockStatus === 'connected' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            borderRadius: '6px',
            marginBottom: '1rem',
            fontSize: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>{bedrockStatus === 'connected' ? '🟢' : '🔴'}</span>
              <strong>
                AWS Bedrock: {bedrockStatus === 'connected' ? 'Connected' : 'Disconnected'}
              </strong>
            </div>
            {bedrockStatus === 'connected' && (
              <div style={{ opacity: 0.8, marginTop: '0.25rem' }}>
                Claude 3 Haiku • Real-time AI analysis active
              </div>
            )}
          </div>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              padding: '0.75rem',
              marginBottom: '1rem',
              color: '#ef4444',
              fontSize: '0.8rem'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Sentiment Analysis */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '0.75rem'
            }}>
              <h4 style={{ 
                margin: 0, 
                fontSize: '1rem', 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1.25rem' }}>{sentimentDisplay.emoji}</span>
                Chat Sentiment
              </h4>
              <div style={{
                background: sentimentDisplay.color,
                color: 'white',
                padding: '0.25rem 0.5rem',
                borderRadius: '12px',
                fontSize: '0.7rem',
                fontWeight: 'bold'
              }}>
                {Math.round(metrics.sentiment.score * 100)}% {sentimentDisplay.label}
              </div>
            </div>
            
            <div style={{ 
              fontSize: '0.85rem', 
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: '1.4',
              marginBottom: '0.75rem'
            }}>
              {metrics.sentiment.summary}
            </div>

            {/* Engagement Level */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Engagement: 
                <span style={{ 
                  color: getEngagementColor(metrics.sentiment.engagement?.level),
                  fontWeight: 'bold',
                  marginLeft: '0.25rem'
                }}>
                  {metrics.sentiment.engagement?.level?.replace('_', ' ').toUpperCase() || 'MEDIUM'}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                {metrics.activity.uniqueUsers} users • {metrics.activity.totalMessages} messages
              </div>
            </div>

            {/* Top Topics */}
            {metrics.sentiment.topics && metrics.sentiment.topics.length > 0 && (
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.5rem' }}>
                  Trending Topics:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {metrics.sentiment.topics.slice(0, 5).map((topic, idx) => (
                    <span key={idx} style={{
                      background: 'rgba(124, 58, 237, 0.2)',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      border: '1px solid rgba(124, 58, 237, 0.3)'
                    }}>
                      {topic.topic} ({topic.mentions})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {metrics.sentiment.recommendations && metrics.sentiment.recommendations.length > 0 && (
              <div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.5rem' }}>
                  AI Recommendations:
                </div>
                <ul style={{ 
                  margin: 0, 
                  paddingLeft: '1rem', 
                  fontSize: '0.75rem', 
                  color: 'rgba(255, 255, 255, 0.8)',
                  lineHeight: '1.3'
                }}>
                  {metrics.sentiment.recommendations.map((rec, idx) => (
                    <li key={idx} style={{ marginBottom: '0.25rem' }}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Badge Distribution */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h4 style={{ 
              margin: '0 0 0.75rem 0', 
              fontSize: '1rem', 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🏆 Live Badge Distribution
              <span style={{
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#f59e0b',
                padding: '0.125rem 0.375rem',
                borderRadius: '8px',
                fontSize: '0.7rem',
                fontWeight: 'normal'
              }}>
                {metrics.badges.total_users} users
              </span>
            </h4>

            {badgeData.length > 0 ? (
              <div>
                <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {badgeData.map((badge) => (
                    <div key={badge.level} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <span style={{ fontSize: '0.8rem', color: 'white' }}>
                        {badge.name}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                          {badge.count} ({badge.percentage}%)
                        </span>
                        <div style={{
                          width: '40px',
                          height: '4px',
                          background: 'rgba(255, 255, 255, 0.2)',
                          borderRadius: '2px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${badge.percentage}%`,
                            height: '100%',
                            background: '#f59e0b',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Badge Analysis Insights */}
                {metrics.badges.analysis && (
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.5rem' }}>
                      Community Health: 
                      <span style={{ 
                        color: metrics.badges.analysis.community_health?.overall_score > 75 ? '#10b981' : 
                              metrics.badges.analysis.community_health?.overall_score > 50 ? '#f59e0b' : '#ef4444',
                        fontWeight: 'bold',
                        marginLeft: '0.25rem'
                      }}>
                        {metrics.badges.analysis.community_health?.overall_score || 'N/A'}/100
                      </span>
                    </div>
                    
                    {metrics.badges.analysis.insights && metrics.badges.analysis.insights.length > 0 && (
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'rgba(255, 255, 255, 0.8)',
                        lineHeight: '1.3',
                        fontStyle: 'italic'
                      }}>
                        💡 {metrics.badges.analysis.insights[0]}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                color: 'rgba(255, 255, 255, 0.6)', 
                fontSize: '0.8rem',
                padding: '1rem'
              }}>
                No user activity to analyze yet
              </div>
            )}
          </div>

          {/* Notable Chat Highlights */}
          {metrics.sentiment.highlights && metrics.sentiment.highlights.length > 0 && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h4 style={{ 
                margin: '0 0 0.75rem 0', 
                fontSize: '1rem', 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                ✨ Notable Messages
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {metrics.sentiment.highlights.slice(0, 3).map((highlight, idx) => {
                  const typeEmoji = {
                    positive: '😊',
                    negative: '😕', 
                    excitement: '🔥',
                    question: '❓'
                  };
                  
                  return (
                    <div key={idx} style={{
                      padding: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        marginBottom: '0.25rem'
                      }}>
                        <span style={{ fontSize: '0.9rem' }}>
                          {typeEmoji[highlight.type] || '💬'}
                        </span>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 'bold',
                          color: 'white'
                        }}>
                          {highlight.username}
                        </span>
                        <span style={{ 
                          fontSize: '0.65rem', 
                          color: 'rgba(255, 255, 255, 0.5)',
                          textTransform: 'capitalize'
                        }}>
                          {highlight.type}
                        </span>
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: 'rgba(255, 255, 255, 0.8)',
                        lineHeight: '1.3'
                      }}>
                        "{highlight.content}"
                      </div>
                      {highlight.reason && (
                        <div style={{ 
                          fontSize: '0.65rem', 
                          color: 'rgba(255, 255, 255, 0.6)',
                          marginTop: '0.25rem',
                          fontStyle: 'italic'
                        }}>
                          {highlight.reason}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Analysis Metadata */}
          {metrics.lastAnalysis && (
            <div style={{
              fontSize: '0.7rem',
              color: 'rgba(255, 255, 255, 0.5)',
              textAlign: 'center',
              marginTop: '1rem',
              padding: '0.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <div>Last AI analysis: {metrics.lastAnalysis.toLocaleTimeString()}</div>
              <div>Session: {currentSessionId?.slice(-8) || 'N/A'} • Bedrock: {bedrockStatus}</div>
              {metrics.sentiment.metadata?.model_used && (
                <div>Model: {metrics.sentiment.metadata.model_used.split('.')[1]}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIMetricsWidget;