// src/components/BadgeSystem.jsx - Fixed CloudFront Integration
import { useState, useEffect } from 'react';

const BadgeSystem = ({ userCommentCount = 0 }) => {
  const [currentBadge, setCurrentBadge] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [cdnStatus, setCdnStatus] = useState('checking');

  // CloudFront and S3 URLs from environment variables
  const CLOUDFRONT_URL = `https://${import.meta.env.VITE_CLOUDFRONT_DOMAIN}`;
  const S3_BUCKET = import.meta.env.VITE_S3_BUCKET_NAME || 'gg-hub-badges';
  const S3_REGION = import.meta.env.VITE_S3_REGION || 'us-west-2';
  const IMAGE_PREFIX = import.meta.env.VITE_BADGE_IMAGE_PREFIX || 'banana';
  const IMAGE_EXTENSION = import.meta.env.VITE_BADGE_IMAGE_EXTENSION || 'png';
  
  // Fallback S3 URLs
  const FALLBACK_URLS = [
    `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`,
    `https://${S3_BUCKET}.s3.amazonaws.com`
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

  // Generate fallback SVG badge - Pure ASCII only
  const generateFallbackBadge = (level) => {
    const colors = {
      1: '#6b7280', // Gray for newcomer
      2: '#10b981', // Green for chatter
      3: '#3b82f6', // Blue for active voice
      4: '#8b5cf6', // Purple for community member
      5: '#f59e0b', // Orange for champion
      6: '#ef4444'  // Red for legend
    };
    
    // Pure ASCII symbols only
    const badgeSymbols = {
      1: 'o', // Simple circle for newcomer
      2: '+', // Plus for chatter
      3: '*', // Star for active voice
      4: 'M', // M for community member
      5: 'C', // C for champion
      6: 'L'  // L for legend
    };
    
    const svgContent = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="32" r="30" fill="${colors[level]}" stroke="white" stroke-width="2"/>
  <text x="32" y="20" fill="white" text-anchor="middle" font-size="8" font-weight="bold">LVL</text>
  <text x="32" y="35" fill="white" text-anchor="middle" font-size="16" font-weight="bold">${level}</text>
  <text x="32" y="48" fill="white" text-anchor="middle" font-size="14" font-weight="bold">${badgeSymbols[level] || 'o'}</text>
</svg>`;
    
    return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
  };

  // Test CloudFront connectivity
  useEffect(() => {
    const testCloudFront = async () => {
      try {
        setCdnStatus('checking');
        console.log('🔍 Testing CloudFront connectivity...');
        
        // Try different possible image names in your bucket
        const testImages = [
          `${IMAGE_PREFIX}1.${IMAGE_EXTENSION}`,
          `${IMAGE_PREFIX}2.${IMAGE_EXTENSION}`,
          'badge1.png', 
          'level1.png',
          'lvl1.png',
          '1.png'
        ];
        
        for (const imageName of testImages) {
          try {
            const testUrl = `${CLOUDFRONT_URL}/${imageName}`;
            console.log(`Testing: ${testUrl}`);
            
            const response = await fetch(testUrl, { 
              method: 'HEAD',
              mode: 'cors'
            });
            
            if (response.ok) {
              setCdnStatus('cloudfront');
              console.log(`✅ CloudFront is working with image: ${imageName}`);
              // Store the working image pattern for later use
              window.workingImagePattern = imageName.replace('1', '{level}');
              return;
            }
          } catch (err) {
            console.log(`❌ Failed to load ${imageName}:`, err.message);
          }
        }
        
        throw new Error('No working images found on CloudFront');
        
      } catch (error) {
        console.warn('⚠️ CloudFront not accessible, trying S3 fallback...', error);
        
        // Try S3 fallback
        try {
          const testUrl = `${FALLBACK_URLS[0]}/banana1.png`;
          await fetch(testUrl, { method: 'HEAD', mode: 'no-cors' });
          setCdnStatus('s3');
          console.log('✅ S3 fallback working');
        } catch (s3Error) {
          setCdnStatus('fallback');
          console.log('⚠️ Using generated fallback badges');
        }
      }
    };

    testCloudFront();
  }, []);

  // Get image URL based on current CDN status
  const getImageUrl = (level) => {
    if (imageErrors[level] || cdnStatus === 'fallback') {
      return generateFallbackBadge(level);
    }
    
    switch (cdnStatus) {
      case 'cloudfront':
        // Use the working pattern if found, otherwise try common patterns
        const pattern = window.workingImagePattern || `${IMAGE_PREFIX}{level}.${IMAGE_EXTENSION}`;
        return `${CLOUDFRONT_URL}/${pattern.replace('{level}', level)}`;
      case 's3':
        return `${FALLBACK_URLS[0]}/${IMAGE_PREFIX}${level}.${IMAGE_EXTENSION}`;
      default:
        return generateFallbackBadge(level);
    }
  };

  // Download badge function
  const downloadBadge = async (badgeLevel) => {
    setIsDownloading(true);
    
    try {
      const imageUrl = getImageUrl(badgeLevel);
      const fileName = `GlobalGaming_Level${badgeLevel}_Badge.png`;
      
      // If it's a fallback SVG, convert to download
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
        const response = await fetch(imageUrl);
        
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
        console.warn('CORS download failed, opening in new tab');
      }
      
      // Fallback: Open in new tab
      window.open(imageUrl, '_blank');
      console.log(`✅ Badge opened in new tab: ${fileName}`);
      
    } catch (error) {
      console.error('❌ Error downloading badge:', error);
      alert(`Badge download failed: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle image load errors
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
              onLoad={() => console.log(`✅ Badge image loaded for level ${currentBadge}`)}
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

        {/* <button 
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
                Download Badge
            </>
          )}
        </button> */}
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
        <h4 className="all-badges-title">Badge Collection: *click on the ones you've unlocked to download*</h4>
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

      {/* Enhanced CDN Status Info */}
      {/* <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: cdnStatus === 'cloudfront' ? 'rgba(16, 185, 129, 0.1)' : 
                   cdnStatus === 's3' ? 'rgba(245, 158, 11, 0.1)' : 
                   'rgba(239, 68, 68, 0.1)',
        border: `1px solid ${
          cdnStatus === 'cloudfront' ? 'rgba(16, 185, 129, 0.3)' : 
          cdnStatus === 's3' ? 'rgba(245, 158, 11, 0.3)' : 
          'rgba(239, 68, 68, 0.3)'
        }`,
        borderRadius: '8px',
        fontSize: '0.75rem',
        color: cdnStatus === 'cloudfront' ? '#10b981' : 
               cdnStatus === 's3' ? '#f59e0b' : '#ef4444'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>
            {cdnStatus === 'checking' ? '⏳' : 
             cdnStatus === 'cloudfront' ? '🚀' : 
             cdnStatus === 's3' ? '☁️' : '⚠️'}
          </span>
          <strong>
            {cdnStatus === 'checking' ? 'Testing CDN connectivity...' :
             cdnStatus === 'cloudfront' ? 'CloudFront CDN Active' :
             cdnStatus === 's3' ? 'S3 Direct Access' :
             'Generated Badges'}
          </strong>
        </div>
        
        <div style={{ marginTop: '0.25rem', opacity: 0.8, fontSize: '0.7rem' }}>
          {cdnStatus === 'cloudfront' && 'Fast global delivery via CloudFront edge locations'}
          {cdnStatus === 's3' && 'Direct S3 access - consider enabling CloudFront for better performance'}
          {cdnStatus === 'fallback' && 'Using SVG fallbacks - check your S3 bucket contents'}
          {cdnStatus === 'checking' && 'Detecting the best delivery method for your badges...'}
        </div>
        
        {cdnStatus !== 'checking' && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.65rem', opacity: 0.6 }}>
            CDN: {cdnStatus === 'cloudfront' ? CLOUDFRONT_URL : 
                  cdnStatus === 's3' ? FALLBACK_URLS[0] : 'Local Generation'}
            <br />
            Pattern: {IMAGE_PREFIX}[1-6].{IMAGE_EXTENSION}
          </div>
        )}
      </div> */}
    </div>
  );
};

export default BadgeSystem;