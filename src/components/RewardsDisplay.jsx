import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserStats } from '../store/slices/userStatsSlice';
import { getAvailableBadges, getXPForNextLevel } from '../services/rewardsService';
import './RewardsDisplay.css';

function RewardsDisplay({ compact = false }) {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { totalXP, currentLevel, currentStreak, longestStreak, unlockedBadges, loading } = useSelector(state => state.userStats);
  const [showBadges, setShowBadges] = useState(false);
  const [badgeData, setBadgeData] = useState({ available: [], locked: [] });

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchUserStats(user.uid));
    }
  }, [user?.uid, dispatch]);

  useEffect(() => {
    const loadBadges = async () => {
      if (totalXP !== undefined) {
        const stats = {
          totalXP,
          currentLevel,
          totalTasksCompleted: 0,
          totalProjectsCreated: 0,
          totalProjectsCompleted: 0,
          totalTeamMembers: 0,
          longestStreak,
          unlockedBadges,
        };
        const data = getAvailableBadges(stats);
        setBadgeData(data);
      }
    };
    loadBadges();
  }, [totalXP, currentLevel, longestStreak, unlockedBadges]);

  const xpForNext = getXPForNextLevel(currentLevel);
  const currentLevelXP = totalXP - Math.floor(100 * Math.pow(1.5, currentLevel - 1) * ((Math.pow(1.5, currentLevel - 1) - 1) / (1.5 - 1)));
  const progressPercent = Math.min(100, Math.max(0, (currentLevelXP / xpForNext) * 100));

  if (loading) {
    return <div className="rewards-loading">Loading...</div>;
  }

  if (compact) {
    return (
      <div className="rewards-display compact">
        <div className="xp-section">
          <div className="level-badge">
            <span className="level-number">{currentLevel}</span>
          </div>
          <div className="xp-info">
            <div className="xp-bar">
              <div className="xp-fill" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <span className="xp-text">{Math.floor(currentLevelXP)} / {xpForNext} XP</span>
          </div>
        </div>
        <div className="streak-badge">
          <div className="streak-icon"></div>
          <span className="streak-count">{currentStreak}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rewards-display">
      <div className="rewards-header">
        <h2>Your Progress</h2>
        <span className="total-xp">{totalXP.toLocaleString()} XP</span>
      </div>

      <div className="progress-items">
        <div className="progress-item level-item">
          <span className="progress-label">Level</span>
          <span className="progress-value level-value">{currentLevel}</span>
        </div>
        <div className="progress-item xp-item">
          <div className="xp-bar">
            <div className="xp-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
          <span className="xp-text">
            {Math.floor(currentLevelXP).toLocaleString()} / {xpForNext.toLocaleString()} XP to Level {currentLevel + 1}
          </span>
        </div>
        <div className="progress-item streak-item">
          <span className="progress-label">Day Streak</span>
          <span className="progress-value">{currentStreak}</span>
        </div>
        <div className="progress-item best-streak-item">
          <span className="progress-label">Best Streak</span>
          <span className="progress-value">{longestStreak}</span>
        </div>
      </div>

      <div className="badges-section">
        <div className="badges-header" onClick={() => setShowBadges(!showBadges)}>
          <h3>Achievements</h3>
          <span className="badge-count">{unlockedBadges.length} / 12</span>
          <span className={`toggle-icon ${showBadges ? 'open' : ''}`}></span>
        </div>

        {showBadges && (
          <div className="badges-grid">
            {badgeData.available.map((badge) => (
              <div key={badge.id} className="badge-card unlocked">
                <div className={`badge-icon ${badge.icon}`}></div>
                <span className="badge-name">{badge.name}</span>
                <span className="badge-xp">+{badge.xpReward} XP</span>
              </div>
            ))}
            {badgeData.locked.map((badge) => (
              <div key={badge.id} className="badge-card locked">
                <div className={`badge-icon ${badge.icon}`}></div>
                <span className="badge-name">{badge.name}</span>
                <span className="badge-description">{badge.description}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RewardsDisplay;
