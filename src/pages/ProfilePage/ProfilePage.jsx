import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchUserStats } from '../../store/slices/userStatsSlice';
import { getUserStats as getRewardsStats, getAvailableBadges, getXPForNextLevel, getLeaderboard } from '../../services/rewardsService';
import { logoutUser } from '../../services/authService';
import { clearUser } from '../../store/slices/authSlice';
import './ProfilePage.css';

function ProfilePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { totalXP, currentLevel, totalTasksCompleted, totalProjectsCreated, totalProjectsCompleted, currentStreak, longestStreak, unlockedBadges, loading } = useSelector(state => state.userStats);
  const [badgeData, setBadgeData] = React.useState({ available: [], locked: [] });
  const [leaderboard, setLeaderboard] = React.useState([]);
  const [activeTab, setActiveTab] = React.useState('overview');

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchUserStats(user.uid));
      loadBadgeData();
      loadLeaderboard();
    }
  }, [user?.uid, dispatch]);

  const loadBadgeData = async () => {
    try {
      const stats = await getRewardsStats(user.uid);
      const data = getAvailableBadges(stats);
      setBadgeData(data);
    } catch (error) {
      console.error('Error loading badges:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const data = await getLeaderboard(10);
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    dispatch(clearUser());
    navigate('/');
  };

  const xpForNext = getXPForNextLevel(currentLevel);
  const calculateLevelXP = () => {
    let xpNeeded = 0;
    for (let i = 1; i < currentLevel; i++) {
      xpNeeded += Math.floor(100 * Math.pow(1.5, i - 1));
    }
    return totalXP - xpNeeded;
  };
  const currentLevelXP = calculateLevelXP();
  const progressPercent = Math.min(100, Math.max(0, (currentLevelXP / xpForNext) * 100));

  if (loading) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          ← Back
        </button>
        <h1>Profile</h1>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-avatar">
            {user?.displayName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <h2>{user?.displayName || 'User'}</h2>
          <p className="profile-email">{user?.email}</p>

          <div className="level-display">
            <div className="level-badge-profile">
              <span className="level-number">{currentLevel}</span>
            </div>
            <div className="level-info">
              <span className="level-title">Level {currentLevel}</span>
              <div className="xp-bar">
                <div className="xp-fill" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <span className="xp-text">{currentLevelXP.toLocaleString()} / {xpForNext.toLocaleString()} XP</span>
            </div>
          </div>
        </div>

        <div className="profile-tabs">
          <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            Overview
          </button>
          <button className={`tab-btn ${activeTab === 'badges' ? 'active' : ''}`} onClick={() => setActiveTab('badges')}>
            Badges
          </button>
          <button className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
            Leaderboard
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon xp-icon"></div>
                <span className="stat-value">{totalXP.toLocaleString()}</span>
                <span className="stat-label">Total XP</span>
              </div>
              <div className="stat-card">
                <div className="stat-icon task-icon"></div>
                <span className="stat-value">{totalTasksCompleted}</span>
                <span className="stat-label">Tasks Done</span>
              </div>
              <div className="stat-card">
                <div className="stat-icon project-icon"></div>
                <span className="stat-value">{totalProjectsCreated}</span>
                <span className="stat-label">Projects</span>
              </div>
              <div className="stat-card">
                <div className="stat-icon complete-icon"></div>
                <span className="stat-value">{totalProjectsCompleted}</span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="stat-card">
                <div className="stat-icon streak-icon"></div>
                <span className="stat-value">{currentStreak}</span>
                <span className="stat-label">Day Streak</span>
              </div>
              <div className="stat-card">
                <div className="stat-icon best-streak-icon"></div>
                <span className="stat-value">{longestStreak}</span>
                <span className="stat-label">Best Streak</span>
              </div>
              <div className="stat-card">
                <div className="stat-icon badge-count-icon"></div>
                <span className="stat-value">{unlockedBadges.length}</span>
                <span className="stat-label">Badges</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="badges-section">
            <div className="badges-header-info">
              <h3>Achievements</h3>
              <span className="badge-count">{unlockedBadges.length} / 12 Unlocked</span>
            </div>
            <div className="badges-list">
              {badgeData.available.map((badge) => (
                <div key={badge.id} className="badge-item unlocked">
                  <div className={`badge-icon ${badge.icon}`}></div>
                  <div className="badge-info">
                    <span className="badge-name">{badge.name}</span>
                    <span className="badge-description">{badge.description}</span>
                  </div>
                  <span className="badge-xp">+{badge.xpReward} XP</span>
                </div>
              ))}
              {badgeData.locked.map((badge) => (
                <div key={badge.id} className="badge-item locked">
                  <div className={`badge-icon ${badge.icon}`}></div>
                  <div className="badge-info">
                    <span className="badge-name">{badge.name}</span>
                    <span className="badge-description">{badge.description}</span>
                  </div>
                  <div className="badge-locked"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="leaderboard-section">
            <h3>Top Users</h3>
            <div className="leaderboard-list">
              {leaderboard.map((entry) => (
                <div key={entry.uid} className={`leaderboard-item ${entry.uid === user?.uid ? 'current-user' : ''}`}>
                  <span className="rank">#{entry.rank}</span>
                  <span className="level-badge-small">{entry.currentLevel}</span>
                  <span className="username">{entry.uid === user?.uid ? 'You' : entry.displayName || 'User'}</span>
                  <span className="xp-amount">{entry.totalXP.toLocaleString()} XP</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
