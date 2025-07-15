// src/components/BadgeSystem.jsx - Fixed version
import { useState, useEffect } from 'react';

const BadgeSystem = ({ userCommentCount = 0 }) => {
  const [currentBadge, setCurrentBadge] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [cdnStatus, setCdnStatus] = useState('checking');

  // CloudFront CDN URL - Replace with your actual CloudFront domain
  const CLOUDFRONT_URL = "https://dmcp58riqkh5q.cloudfront.net";
  
  // Fallback S3 URLs (in case CloudFront fails)
  const FALLBACK_URLS = [
    "https://gg-hub-badges.s3.amazonaws.com",
    "https://gg-hub-badges.s3.us-west-2.amazonaws.com"
  ];

  // Badge configuration
  const badgeConfig = {
    1: { name: "Newcomer", description: "Welcome to GlobalGaming! Your journey begins here.", comments: 0 },
    2: { name: "Chatter", description: "Made your first comment! Keep the conversation going.", comments: 1 },
    3: { name: "Active Voice", description: "2+ comments - You're getting engaged with the community!", comments: 2 },
    4: { name: "Community Member", description: "3+ comments - A valued member of our chat community.", comments: 3 },
    5: { name: "Chat Champion", description: "4+ comments - You're really part of the conversation!", comments: 4 },
    6: { name: "Legend", description: "5+ comments - A true GlobalGaming legend!", comments: 5 }
  };

  // Calculate current badge level based on comment count
  useEffect(() => {
    let badgeLevel = 1;
    
    if (userCommentCount >= 5) badgeLevel = 6;
    else if (userCommentCount >= 4) badgeLevel = 5;
    else if (userCommentCount >= 3) badgeLevel = 4;
    else if (userCommentCount >= 2) badgeLevel = 3;
    else if (userCommentCount >= 1) badgeLevel = 2;
    else badgeLevel = 1;

    setCurrentBadge(badgeLevel);
  }, [userCommentCount]);

  // Generate fallback SVG badge (using manual base64 encoding)
  const generateFallbackBadge = (level) => {
    const colors = {
      1: '#6b7280', // Gray for newcomer
      2: '#10b981', // Green for chatter
      3: '#3b82f6', // Blue for active voice
      4: '#8b5cf6', // Purple for community member
      5: '#f59e0b', // Orange for champion
      6: '#ef4444'  // Red for legend
    };
    
    // Pre-encoded SVG badges to avoid btoa issues
    const encodedBadges = {
      1: 'PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzAiIGZpbGw9IiM2YjcyODAiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPgo8dGV4dCB4PSIzMiIgeT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjgiIGZvbnQtd2VpZ2h0PSJib2xkIj5MVkw8L3RleHQ+Cjx0ZXh0IHg9IjMyIiB5PSIzNSIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtd2VpZ2h0PSJib2xkIj4xPC90ZXh0Pgo8dGV4dCB4PSIzMiIgeT0iNDgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjgiPvCfjYw8L3RleHQ+Cjwvc3ZnPg==',
      2: 'PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzAiIGZpbGw9IiMxMGI5ODEiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPgo8dGV4dCB4PSIzMiIgeT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjgiIGZvbnQtd2VpZ2h0PSJib2xkIj5MVkw8L3RleHQ+Cjx0ZXh0IHg9IjMyIiB5PSIzNSIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtd2VpZ2h0PSJib2xkIj4yPC90ZXh0Pgo8dGV4dCB4PSIzMiIgeT0iNDgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjgiPvCfjYw8L3RleHQ+Cjwvc3ZnPg==',
      3: 'PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzAiIGZpbGw9IiMzYjgyZjYiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPgo8dGV4dCB4PSIzMiIgeT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjgiIGZvbnQtd2VpZ2h0PSJib2xkIj5MVkw8L3RleHQ+Cjx0ZXh0IHg9IjMyIiB5PSIzNSIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtd2VpZ2h0PSJib2xkIj4zPC90ZXh0Pgo8dGV4dCB4PSIzMiIgeT0iNDgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjgiPvCfjYw8L3RleHQ+Cjwvc3ZnPg==',
      4: 'PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzAiIGZpbGw9IiM4YjVjZjYiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPgo8dGV4dCB4PSIzMiIgeT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjgiIGZvbnQtd2VpZ2h0PSJib2xkIj5MVkw8L3RleHQ+Cjx0ZXh0IHg9IjMyIiB5PSIzNSIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtd2VpZ2h0PSJib2xkIj40PC90ZXh0Pgo8dGV4dCB4PSIzMiIgeT0iNDgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjgiPvCfjYw8L3RleHQ+Cjwvc3ZnPg==',
      5: 'PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzAiIGZpbGw9IiNmNTllMGIiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPgo8dGV4dCB4PSIzMiIgeT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjgiIGZvbnQtd2VpZ2h0PSJib2xkIj5MVkw8L3RleHQ+Cjx0ZXh0IHg9IjMyIiB5PSIzNSIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtd2VpZ2h0PSJib2xkIj41PC90ZXh0Pgo8dGV4dCB4PSIzMiIgeT0iNDgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjgiPvCfjYw8L3RleHQ+Cjwvc3ZnPg==',
      6: 'PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzAiIGZpbGw9IiNlZjQ0NDQiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPgo8dGV4dCB4PSIzMiIgeT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjgiIGZvbnQtd2VpZ2h0PSJib2xkIj5MVkw8L3RleHQ+Cjx0ZXh0IHg9IjMyIiB5PSIzNSIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtd2VpZ2h0PSJib2xkIj42PC90ZXh0Pgo8dGV4dCB4PSIzMiIgeT0iNDgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjgiPvCfjYw8L3RleHQ+Cjwvc3ZnPg=='
    };
    
    return `data:image/svg+xml;base64,${encodedBadges[level] || encodedBadges[1]}`;
  };

  // Test CloudFront connectivity
  useEffect(() => {
    const testCloudFront = async () => {
      try {
        setCdnStatus('checking');
        console.log('🔍 Testing CloudFront connectivity...');
        
        // Test if CloudFront URL is accessible
        const testUrl = `${CLOUDFRONT_URL}/banana1.png`;
        const response = await fetch(testUrl, { 
          method: 'HEAD',
          mode: 'cors'
        });
        
        if (response.ok) {
          setCdnStatus('cloudfront');
          console.log('✅ CloudFront is working!');
        } else {
          throw new Error('CloudFront response not OK');
        }
      } catch (error) {
        console.warn('⚠️ CloudFront not accessible, checking S3 fallback...', error);
        
        // Try S3 fallbacks
        for (let i = 0; i < FALLBACK_URLS.length; i++) {
          try {
            const testUrl = `${FALLBACK_URLS[i]}/banana1.png`;
            await fetch(testUrl, { method: 'HEAD', mode: 'no-cors' });
            setCdnStatus(`s3-${i}`);
            console.log(`✅ S3 fallback ${i + 1} working`);
            return;
          } catch (s3Error) {
            console.log(`❌ S3 fallback ${i + 1} failed`);
          }
        }
        
        setCdnStatus('fallback');
        console.log('⚠️ Using generated fallback badges');
      }
    };

    // Wait a bit for CloudFront to potentially be ready
    const timer = setTimeout(testCloudFront, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Get image URL based on current CDN status
  const getImageUrl = (level) => {
    if (imageErrors[level] || cdnStatus === 'fallback') {
      return generateFallbackBadge(level);
    }
    
    switch (cdnStatus) {
      case 'cloudfront':
        return `${CLOUDFRONT_URL}/banana${level}.png`;
      case 's3-0':
        return `${FALLBACK_URLS[0]}/banana${level}.png`;
      case 's3-1':
        return `${FALLBACK_URLS[1]}/banana${level}.png`;
      default:
        return generateFallbackBadge(level);
    }
  };

  // Download badge function with CloudFront support
  const downloadBadge = async (badgeLevel) => {
    setIsDownloading(true);
    
    try {
      const imageUrl = getImageUrl(badgeLevel);
      const fileName = `LVL${badgeLevel}User.png`;
      
      // If it's a fallback SVG, download that
      if (imageUrl.startsWith('data:image/svg+xml')) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = fileName.replace('.png', '.svg');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log(`✅ Fallback badge downloaded: ${fileName}`);
        return;
      }
      
      // Try to download the actual image
      try {
        const response = await fetch(imageUrl, { mode: 'cors' });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          window.URL.revokeObjectURL(url);
          console.log(`✅ Badge downloaded: ${fileName}`);
          return;
        }
      } catch (corsError) {
        console.warn('CORS download failed, trying alternative method');
      }
      
      // Fallback: Open in new tab
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`✅ Badge link opened: ${fileName}`);
      
    } catch (error) {
      console.error('❌ Error downloading badge:', error);
      alert(`Badge download failed: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle image load errors and try next URL format
  const handleImageError = (level) => {
    console.warn(`Image failed for level ${level}, using fallback`);
    setImageErrors(prev => ({ ...prev, [level]: true }));
  };

  // Get progress to next badge
  const getProgressToNext = () => {
    if (currentBadge >= 6) return { current: 5, needed: 5, isMaxLevel: true };
    
    const nextBadgeComments = badgeConfig[currentBadge + 1].comments;
    return {
      current: userCommentCount,
      needed: nextBadgeComments,
      isMaxLevel: false
    };
  };

  const progress = getProgressToNext();

  return (
    <div className="badge-system">
      <div className="badge-header">
        <h3 className="badge-title">🏆 Badges Earned</h3>
        <div className="badge-progress">
          {progress.isMaxLevel ? (
            <span className="max-level">Max Level Achieved! 🎉</span>
          ) : (
            <span className="progress-text">
              {progress.current}/{progress.needed} comments to next badge
            </span>
          )}
        </div>
      </div>

      <div className="current-badge-display">
        <div className="badge-container">
          <div 
            className="badge-image-wrapper"
            title={`${badgeConfig[currentBadge].name}: ${badgeConfig[currentBadge].description}`}
          >
            <img 
              src={getImageUrl(currentBadge)}
              alt={`${badgeConfig[currentBadge].name} Badge`}
              className="badge-image"
              onError={() => handleImageError(currentBadge)}
            />
            <div className="badge-glow"></div>
          </div>
          
          <div className="badge-info">
            <div className="badge-name">{badgeConfig[currentBadge].name}</div>
            <div className="badge-description">{badgeConfig[currentBadge].description}</div>
            <div className="badge-stats">
              Level {currentBadge} • {userCommentCount} comments
            </div>
          </div>
        </div>

        <button 
          className="download-badge-btn"
          onClick={() => downloadBadge(currentBadge)}
          disabled={isDownloading}
          title={`Download your ${badgeConfig[currentBadge].name} badge`}
        >
          {isDownloading ? (
            <>
              <span className="download-spinner">⏳</span>
              Downloading...
            </>
          ) : (
            <>
              📥 Download Badge
            </>
          )}
        </button>
      </div>

      {/* Progress bar to next level */}
      {!progress.isMaxLevel && (
        <div className="progress-section">
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill"
              style={{
                width: `${Math.min((progress.current / progress.needed) * 100, 100)}%`
              }}
            ></div>
          </div>
          <div className="next-badge-preview">
            <span className="next-badge-text">Next: {badgeConfig[currentBadge + 1]?.name}</span>
            <img 
              src={getImageUrl(currentBadge + 1)}
              alt="Next Badge"
              className="next-badge-image"
              onError={() => handleImageError(currentBadge + 1)}
            />
          </div>
        </div>
      )}

      {/* All badges earned display */}
      <div className="all-badges">
        <h4 className="all-badges-title">Badge Collection</h4>
        <div className="badge-grid">
          {Object.entries(badgeConfig).map(([level, config]) => {
            const isEarned = userCommentCount >= config.comments;
            const levelNum = parseInt(level);
            
            return (
              <div 
                key={level}
                className={`mini-badge ${isEarned ? 'earned' : 'locked'}`}
                title={isEarned ? `${config.name}: ${config.description}` : `Locked: Need ${config.comments} comments`}
                onClick={() => isEarned && downloadBadge(levelNum)}
              >
                <img 
                  src={getImageUrl(levelNum)}
                  alt={`${config.name} Badge`}
                  className="mini-badge-image"
                  style={{
                    filter: isEarned ? 'none' : 'grayscale(100%) brightness(0.3)'
                  }}
                  onError={() => handleImageError(levelNum)}
                />
                <div className="mini-badge-level">LVL{level}</div>
                {isEarned && (
                  <div className="earned-check">✓</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CDN Status Info */}
      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: cdnStatus === 'cloudfront' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
        border: `1px solid ${cdnStatus === 'cloudfront' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
        borderRadius: '8px',
        fontSize: '0.75rem',
        color: cdnStatus === 'cloudfront' ? '#10b981' : '#f59e0b'
      }}>
        🚀 CDN Status: {
          cdnStatus === 'checking' ? 'Testing connectivity...' :
          cdnStatus === 'cloudfront' ? '✅ CloudFront (Optimal)' :
          cdnStatus.startsWith('s3-') ? '⚠️ S3 Fallback' :
          '⚠️ Generated Badges'
        }
        {cdnStatus === 'cloudfront' && (
          <div style={{ marginTop: '0.25rem', opacity: 0.8 }}>
            Fast global delivery via CloudFront CDN
          </div>
        )}
      </div>
    </div>
  );
};

export default BadgeSystem;