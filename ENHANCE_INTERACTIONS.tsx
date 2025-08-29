// 🚀 Enhanced Interactions for Your Baby Raffle
// Add these to your existing React components for amazing UX

// 1. Enhanced Slideshow with Progress Bar and Pause on Hover
const EnhancedSlideshow = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const { slideImages } = useDynamicSlideshow()

  useEffect(() => {
    if (!isPaused && slideImages.length > 0) {
      const progressTimer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setCurrentSlide((current) => (current + 1) % slideImages.length)
            return 0
          }
          return prev + 2 // 2% every 100ms = 5 seconds total
        })
      }, 100)
      
      return () => clearInterval(progressTimer)
    }
  }, [isPaused, slideImages.length])

  return (
    <div 
      className="slideshow-container relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div 
          className="h-full bg-white transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Pause indicator */}
      {isPaused && (
        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          ⏸️ Paused
        </div>
      )}
      
      {/* Existing slideshow content */}
    </div>
  )
}

// 2. Smart Betting Form with Real-time Validation and Suggestions
const SmartBettingForm = () => {
  const [bets, setBets] = useState([])
  const [suggestions, setSuggestions] = useState({})
  const [validationErrors, setValidationErrors] = useState({})

  // Real-time validation
  const validateBet = (category: string, value: string) => {
    const errors = []
    
    if (category === 'birth_date') {
      const date = new Date(value)
      const now = new Date()
      const futureLimit = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)) // 1 year
      
      if (date < now) errors.push("Birth date can't be in the past")
      if (date > futureLimit) errors.push("That's quite far in the future!")
    }
    
    if (category === 'birth_weight') {
      const weight = parseFloat(value)
      if (weight < 1 || weight > 15) {
        errors.push("Typical baby weight is 3-12 lbs")
      }
    }
    
    setValidationErrors(prev => ({
      ...prev,
      [category]: errors
    }))
  }

  // Fetch suggestions based on popular choices
  const fetchSuggestions = async (category: string) => {
    try {
      const response = await fetch(`/api/popular-choices/${category}`)
      const popularChoices = await response.json()
      setSuggestions(prev => ({
        ...prev,
        [category]: popularChoices
      }))
    } catch (error) {
      console.log('Could not fetch suggestions')
    }
  }

  return (
    <div className="smart-betting-form">
      {CATEGORIES.map(category => (
        <div key={category.key} className="bet-category-card">
          <input
            onChange={(e) => {
              validateBet(category.key, e.target.value)
              if (e.target.value.length > 2) {
                fetchSuggestions(category.key)
              }
            }}
            className={`bet-input ${validationErrors[category.key]?.length ? 'error' : ''}`}
          />
          
          {/* Real-time validation feedback */}
          {validationErrors[category.key]?.map(error => (
            <div key={error} className="error-message">
              ⚠️ {error}
            </div>
          ))}
          
          {/* Popular suggestions */}
          {suggestions[category.key] && (
            <div className="suggestions">
              <p className="suggestions-title">Popular choices:</p>
              {suggestions[category.key].map(suggestion => (
                <button
                  key={suggestion.value}
                  className="suggestion-chip"
                  onClick={() => fillInput(category.key, suggestion.value)}
                >
                  {suggestion.value} 
                  <span className="percentage">({suggestion.percentage}%)</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// 3. Live Prize Pool with Animation
const AnimatedPrizePool = () => {
  const [displayAmount, setDisplayAmount] = useState(0)
  const [actualAmount, setActualAmount] = useState(0)
  const [newBetAnimation, setNewBetAnimation] = useState(false)

  // Fetch real prize pool amount
  useEffect(() => {
    const fetchPrizePool = async () => {
      const response = await fetch('/api/stats')
      const data = await response.json()
      setActualAmount(data.totalPrizePool || 0)
    }
    
    fetchPrizePool()
    const interval = setInterval(fetchPrizePool, 10000) // Check every 10 seconds
    return () => clearInterval(interval)
  }, [])

  // Animate counter when amount changes
  useEffect(() => {
    if (actualAmount !== displayAmount) {
      setNewBetAnimation(true)
      
      const animateCounter = () => {
        const diff = actualAmount - displayAmount
        const step = Math.ceil(diff / 20) // 20 steps
        
        setDisplayAmount(prev => {
          const next = prev + step
          return next >= actualAmount ? actualAmount : next
        })
      }
      
      const timer = setInterval(animateCounter, 50)
      setTimeout(() => {
        clearInterval(timer)
        setDisplayAmount(actualAmount)
        setNewBetAnimation(false)
      }, 1000)
    }
  }, [actualAmount, displayAmount])

  return (
    <div className={`prize-pool-display ${newBetAnimation ? 'new-bet' : ''}`}>
      <div className="prize-amount">
        ${displayAmount.toFixed(2)}
      </div>
      {newBetAnimation && (
        <div className="new-bet-indicator">
          🎉 New bet placed!
        </div>
      )}
    </div>
  )
}

// 4. Interactive Bet Progress Tracker
const BetProgressTracker = ({ selectedBets, totalCategories }) => {
  const percentage = (selectedBets.length / totalCategories) * 100
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    if (percentage === 100 && !showCelebration) {
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 2000)
    }
  }, [percentage])

  return (
    <div className="bet-progress-tracker">
      <div className="progress-header">
        <span>Betting Progress</span>
        <span>{selectedBets.length} of {totalCategories}</span>
      </div>
      
      <div className="progress-bar-container">
        <div 
          className="progress-bar-fill"
          style={{ 
            width: `${percentage}%`,
            background: percentage === 100 ? '#10b981' : '#3b82f6'
          }}
        />
      </div>
      
      {showCelebration && (
        <div className="celebration-message">
          🎊 All categories complete! Ready to win big!
        </div>
      )}
      
      <div className="progress-milestones">
        {[25, 50, 75, 100].map(milestone => (
          <div 
            key={milestone}
            className={`milestone ${percentage >= milestone ? 'reached' : ''}`}
          >
            {milestone === 25 && '🌟'}
            {milestone === 50 && '🔥'}
            {milestone === 75 && '💪'}
            {milestone === 100 && '🏆'}
          </div>
        ))}
      </div>
    </div>
  )
}

// 5. Social Sharing with Custom Messages
const EnhancedSocialShare = ({ userBets }) => {
  const [shareMessage, setShareMessage] = useState('')
  
  const generateShareMessage = () => {
    const betCount = userBets.length
    const categories = userBets.map(bet => bet.category).join(', ')
    
    const messages = [
      `I just placed ${betCount} bets in the baby raffle! 🍼`,
      `Predicting ${categories} for the new baby! Join me! 👶`,
      `${betCount} bets placed - feeling lucky! 🎲`,
      `Made my predictions for baby's arrival! Your turn! 🌟`
    ]
    
    return messages[Math.floor(Math.random() * messages.length)]
  }

  const shareToSocial = (platform: string) => {
    const message = shareMessage || generateShareMessage()
    const url = window.location.href
    
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${encodeURIComponent(message)}`,
      instagram: `https://www.instagram.com/`,
    }
    
    window.open(shareUrls[platform], '_blank', 'width=600,height=400')
  }

  return (
    <div className="enhanced-social-share">
      <textarea
        value={shareMessage}
        onChange={(e) => setShareMessage(e.target.value)}
        placeholder={generateShareMessage()}
        className="share-message-input"
      />
      
      <div className="share-buttons">
        <button onClick={() => shareToSocial('twitter')} className="share-btn twitter">
          🐦 Tweet This
        </button>
        <button onClick={() => shareToSocial('facebook')} className="share-btn facebook">
          📘 Share on Facebook
        </button>
        <button onClick={() => shareToSocial('instagram')} className="share-btn instagram">
          📷 Instagram Story
        </button>
      </div>
    </div>
  )
}

// 6. Achievement System
const AchievementSystem = ({ userActions }) => {
  const [achievements, setAchievements] = useState([])
  const [showNotification, setShowNotification] = useState(null)

  const checkAchievements = () => {
    const newAchievements = []
    
    if (userActions.betsPlaced >= 1) {
      newAchievements.push({
        id: 'first_bet',
        title: 'First Prediction!',
        description: 'You placed your first bet',
        icon: '🎯'
      })
    }
    
    if (userActions.betsPlaced >= 5) {
      newAchievements.push({
        id: 'high_roller',
        title: 'High Roller',
        description: 'Placed 5 or more bets',
        icon: '🎲'
      })
    }
    
    if (userActions.categoriesCompleted === userActions.totalCategories) {
      newAchievements.push({
        id: 'completionist',
        title: 'Completionist',
        description: 'Bet on every category',
        icon: '🏆'
      })
    }
    
    // Show new achievements
    newAchievements.forEach(achievement => {
      if (!achievements.find(a => a.id === achievement.id)) {
        setShowNotification(achievement)
        setTimeout(() => setShowNotification(null), 3000)
      }
    })
    
    setAchievements(prev => [...prev, ...newAchievements])
  }

  useEffect(() => {
    checkAchievements()
  }, [userActions])

  return (
    <>
      {showNotification && (
        <div className="achievement-notification">
          <div className="achievement-content">
            <span className="achievement-icon">{showNotification.icon}</span>
            <div>
              <h3>{showNotification.title}</h3>
              <p>{showNotification.description}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="achievements-display">
        {achievements.map(achievement => (
          <div key={achievement.id} className="achievement-badge">
            <span className="badge-icon">{achievement.icon}</span>
            <span className="badge-title">{achievement.title}</span>
          </div>
        ))}
      </div>
    </>
  )
}

// CSS for all the enhanced interactions
const styles = `
.slideshow-container:hover .progress-bar {
  opacity: 0.3;
}

.bet-input.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 1px #ef4444;
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.suggestion-chip {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 1rem;
  padding: 0.5rem 1rem;
  margin: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.suggestion-chip:hover {
  background: #3b82f6;
  color: white;
}

.prize-pool-display.new-bet {
  animation: pulse 0.5s ease-in-out;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.achievement-notification {
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
  z-index: 1000;
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
`
