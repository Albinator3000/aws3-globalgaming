// src/components/BadgeSystem.jsx - Fixed with download functionality
import { useState, useEffect } from 'react';

const BadgeSystem = ({ userCommentCount = 0 }) => {
  const [currentBadge, setCurrentBadge] = useState(null);
  const [nextBadge, setNextBadge] = useState(null);
  const [commentsToNext, setCommentsToNext] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  // Badge configuration
  const badges = [
    {
      id: 1,
      name: "Newcomer",
      description: "Welcome to GlobalGaming! Your journey begins here.",
      requiredComments: 0,
      fileName: "banana1.png",
      color: "#F4A261"
    },
    {
      id: 2,
      name: "Chatter",
      description: "Made your first comment! You're part of the conversation now.",
      requiredComments: 1,
      fileName: "banana2.png",
      color: "#F4A261"
    },
    {
      id: 3,
      name: "Active Voice",
      description: "2+ comments - Getting engaged with the community!",
      requiredComments: 2,
      fileName: "banana3.png",
      color: "#FF6B35"
    },
    {
      id: 4,
      name: "Community Member",
      description: "3+ comments - You're a valued member of our community!",
      requiredComments: 3,
      fileName: "banana4.png",
      color: "#4ECDC4"
    },
    {
      id: 5,
      name: "Chat Champion",
      description: "4+ comments - You're really part of the conversation!",
      requiredComments: 4,
      fileName: "banana5.png",
      color: "#45B7D1"
    },
    {
      id: 6,
      name: "Legend",
      description: "5+ comments - You're a true GlobalGaming legend!",
      requiredComments: 5,
      fileName: "banana6.png",
      color: "#9B59B6"
    }
  ];

  useEffect(() => {
    // Find current badge (highest earned badge)
    const earned = badges.filter(badge => userCommentCount >= badge.requiredComments);
    const current = earned[earned.length - 1];
    setCurrentBadge(current);

    // Find next badge
    const next = badges.find(badge => userCommentCount < badge.requiredComments);
    setNextBadge(next);

    // Calculate comments needed for next badge
    if (next) {
      setCommentsToNext(next.requiredComments - userCommentCount);
    } else {
      setCommentsToNext(0); // Already at max level
    }
  }, [userCommentCount]);

  const getBadgeImageUrl = (fileName) => {
    const cloudFrontDomain = import.meta.env.VITE_CLOUDFRONT_DOMAIN;
    return `https://${cloudFrontDomain}/${fileName}`;
  };

  const getProgressPercentage = () => {
    if (!nextBadge) return 100; // Max level reached
    
    const currentProgress = userCommentCount - (currentBadge?.requiredComments || 0);
    const totalNeeded = nextBadge.requiredComments - (currentBadge?.requiredComments || 0);
    
    return Math.min((currentProgress / totalNeeded) * 100, 100);
  };

  // Download badge function - restored from your old version
  const downloadBadge = async (badge) => {
    if (!badge) return;
    
    setIsDownloading(true);
    
    try {
      const imageUrl = getBadgeImageUrl(badge.fileName);
      const fileName = `GlobalGaming_Level${badge.id}_${badge.name.replace(' ', '_')}_Badge.png`;
      
      console.log(`🔄 Attempting to download badge: ${fileName}`);
      console.log(`📡 Image URL: ${imageUrl}`);
      
      try {
        // Try to fetch the image first
        const response = await fetch(imageUrl, {
          method: 'GET',
          mode: 'cors'
        });
        
        if (response.ok) {
          // If fetch succeeds, create blob and download
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          window.URL.revokeObjectURL(url);
          console.log(`✅ Badge downloaded successfully: ${fileName}`);
          
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
      } catch (corsError) {
        console.warn('🔄 CORS download failed, trying direct link method:', corsError.message);
        
        // Fallback: Open in new tab for manual download
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = fileName;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log(`✅ Badge opened for download: ${fileName}`);
      }
      
    } catch (error) {
      console.error('❌ Error downloading badge:', error);
      
      // Final fallback: just open the image URL
      window.open(getBadgeImageUrl(badge.fileName), '_blank');
      console.log(`⚠️ Opened badge image in new tab as fallback`);
      
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle image load errors
  const handleImageError = (badgeId) => {
    console.warn(`⚠️ Image failed to load for badge ${badgeId}`);
    setImageErrors(prev => ({ ...prev, [badgeId]: true }));
  };

  if (!currentBadge) return null;

  return (
    <div className="badge-system">
      {/* Main Badge Display - Always Visible */}
      <div 
        className="badge-header"
        style={{ 
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: isExpanded ? '1rem' : '0'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <img
              src={getBadgeImageUrl(currentBadge.fileName)}
              alt={currentBadge.name}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                border: `3px solid #F4A261`,
                boxShadow: `0 0 15px #F4A26140`
              }}
              onError={() => handleImageError(currentBadge.id)}
            />
            {userCommentCount > 0 && (
              <div style={{
                position: 'absolute',
                bottom: '-5px',
                right: '-5px',
                background: currentBadge.color,
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                border: '2px solid #1a1a2e'
              }}>
                {currentBadge.id}
              </div>
            )}
          </div>
          
          <div>
            <div style={{ 
              fontSize: '1.2rem', 
              fontWeight: 'bold', 
              color: '#F4A261',
              marginBottom: '0.25rem',
              display: 'flex',
              alignItems: 'center'
            }}>
              Badges Earned
            </div>
            <div style={{ 
              fontSize: '1rem', 
              color: 'white',
              marginBottom: '0.25rem'
            }}>
              {currentBadge.name}
            </div>
            <div style={{ 
              fontSize: '0.85rem', 
              color: 'rgba(255, 255, 255, 0.7)',
              lineHeight: '1.3'
            }}>
              {currentBadge.description}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ 
              fontSize: '0.8rem', 
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '0.25rem'
            }}>
              LVL.{currentBadge.id}
            </div>
            {nextBadge && (
              <div style={{ 
                fontSize: '0.8rem', 
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                {/* Progress info */}
              </div>
            )}
            {!nextBadge && (
              <div style={{ 
                fontSize: '0.8rem', 
                color: '#FFD700',
                fontWeight: 'bold'
              }}>
                Max Level Achieved! 🌟
              </div>
            )}
          </div>
          <span style={{ 
            fontSize: '0.8rem', 
            color: 'rgba(255, 255, 255, 0.6)',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}>
            ▼
          </span>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '1rem'
        }}>
          {/* Progress to Next Badge */}
          {nextBadge && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
              }}>
                <span style={{ fontSize: '0.9rem', color: 'white' }}>
                  Next: {nextBadge.name}
                </span>
                <img
                  src={getBadgeImageUrl(nextBadge.fileName)}
                  alt={nextBadge.name}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    opacity: 0.7
                  }}
                  onError={() => handleImageError(nextBadge.id)}
                />
              </div>
              
              <div style={{
                width: '100%',
                height: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '0.5rem'
              }}>
                <div style={{
                  width: `${getProgressPercentage()}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${currentBadge.color}, ${nextBadge.color})`,
                  borderRadius: '4px',
                  transition: 'width 0.5s ease'
                }} />
              </div>
              
              <div style={{ 
                fontSize: '0.8rem', 
                color: 'rgba(255, 255, 255, 0.6)',
                textAlign: 'center'
              }}>
                {commentsToNext} more comment{commentsToNext !== 1 ? 's' : ''} needed
              </div>
            </div>
          )}

          {/* Badge Collection */}
          <div>
            <h4 style={{ 
              margin: '0 0 1rem 0', 
              fontSize: '1rem', 
              color: 'white',
              textAlign: 'center'
            }}>
              Badge Collection
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'rgba(255, 255, 255, 0.6)',
                fontWeight: 'normal',
                marginTop: '0.25rem'
              }}>
                *Click on the ones you've unlocked to download*
              </div>
            </h4>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              justifyItems: 'center'
            }}>
              {badges.map((badge) => {
                const isEarned = userCommentCount >= badge.requiredComments;
                const isCurrentBadge = currentBadge?.id === badge.id;
                
                return (
                  <div
                    key={badge.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      background: isEarned ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                      border: isCurrentBadge 
                        ? `2px solid ${badge.color}` 
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: isEarned ? 'pointer' : 'default',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                    onClick={() => {
                      if (isEarned && !isDownloading) {
                        downloadBadge(badge);
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (isEarned) {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = `0 5px 15px ${badge.color}40`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    title={isEarned ? `Click to download ${badge.name} badge` : `Locked: Need ${badge.requiredComments} comments`}
                  >
                    {isCurrentBadge && (
                      <div style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: '#10b981',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem'
                      }}>
                        ✓
                      </div>
                    )}
                    
                    {isDownloading && isEarned && (
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'rgba(0, 0, 0, 0.8)',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        zIndex: 1
                      }}>
                        ⏳
                      </div>
                    )}
                    
                    <img
                      src={getBadgeImageUrl(badge.fileName)}
                      alt={badge.name}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        marginBottom: '0.5rem',
                        opacity: isEarned ? 1 : 0.3,
                        filter: isEarned ? 'none' : 'grayscale(100%)'
                      }}
                      onError={() => handleImageError(badge.id)}
                    />
                    
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: isEarned ? badge.color : 'rgba(255, 255, 255, 0.4)',
                      textAlign: 'center',
                      marginBottom: '0.25rem'
                    }}>
                      LVL{badge.id}
                    </div>
                    
                    <div style={{
                      fontSize: '0.65rem',
                      color: isEarned ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)',
                      textAlign: 'center'
                    }}>
                      {badge.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgeSystem;