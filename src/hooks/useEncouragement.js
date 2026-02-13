import { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useToast } from '../components/Toast';
import { fetchUserStats } from '../store/slices/userStatsSlice';
import {
  ENCOURAGEMENT_MESSAGES,
  getRandomMotivationalMessage,
  getStreakMessage,
  getRandomLevelUpMessage
} from '../services/encouragementMessages';

export const useEncouragement = () => {
  const dispatch = useDispatch();
  const { showCelebration, showSuccess, showInfo, showWarning } = useToast();
  const { user } = useSelector(state => state.auth);
  const {
    totalXP,
    currentLevel,
    currentStreak,
    longestStreak,
    unlockedBadges,
    totalTasksCompleted,
    totalProjectsCreated,
    totalProjectsCompleted,
    lastActiveDate
  } = useSelector(state => state.userStats);

  const checkOnboardingMessages = useCallback((prevStats) => {
    if (!user?.uid) return;

    if (totalTasksCompleted === 1 && (!prevStats || prevStats.totalTasksCompleted === 0)) {
      showSuccess(ENCOURAGEMENT_MESSAGES.onboarding.firstTaskCompleted.title, ENCOURAGEMENT_MESSAGES.onboarding.firstTaskCompleted.message);
    }

    if (totalProjectsCreated === 1 && (!prevStats || prevStats.totalProjectsCreated === 0)) {
      showSuccess(ENCOURAGEMENT_MESSAGES.onboarding.firstProject.title, ENCOURAGEMENT_MESSAGES.onboarding.firstProject.message);
    }
  }, [user, totalTasksCompleted, totalProjectsCreated, showSuccess]);

  const checkLevelUp = useCallback((prevLevel) => {
    if (currentLevel > prevLevel) {
      showCelebration(
        ENCOURAGEMENT_MESSAGES.achievements.levelUp.title,
        `${getRandomLevelUpMessage()} You're now Level ${currentLevel}!`
      );
    }
  }, [currentLevel, showCelebration]);

  const checkNewBadges = useCallback((prevBadges) => {
    if (!prevBadges) return;

    const newBadges = unlockedBadges.filter(badge => !prevBadges.includes(badge));
    if (newBadges.length > 0) {
      newBadges.forEach(badgeId => {
        const badgeNames = {
          first_task: 'Getting Started',
          ten_tasks: 'Task Master',
          fifty_tasks: 'Productivity Pro',
          hundred_tasks: 'Task Champion',
          first_project: 'Project Starter',
          five_projects: 'Project Manager',
          project_completed: 'Goal Getter',
          streak_7: 'Consistency King',
          streak_30: 'Unstoppable',
          team_player: 'Team Player',
          early_bird: 'Early Bird',
          night_owl: 'Night Owl'
        };
        const badgeXP = {
          first_task: 50, ten_tasks: 100, fifty_tasks: 250, hundred_tasks: 500,
          first_project: 75, five_projects: 200, project_completed: 150,
          streak_7: 150, streak_30: 500, team_player: 75,
          early_bird: 50, night_owl: 50
        };
        showCelebration(
          ENCOURAGEMENT_MESSAGES.achievements.badgeUnlocked.title,
          `You've earned the "${badgeNames[badgeId] || badgeId}" badge! +${badgeXP[badgeId] || 0} XP`
        );
      });
    }
  }, [unlockedBadges, showCelebration]);

  const checkStreakMilestones = useCallback((prevStreak) => {
    if (currentStreak > prevStreak && currentStreak > 0) {
      const milestones = [3, 7, 14, 30, 60, 100];
      const reachedMilestone = milestones.find(m => currentStreak === m);
      if (reachedMilestone) {
        showCelebration(
          ENCOURAGEMENT_MESSAGES.achievements.streakMilestone.title,
          ENCOURAGEMENT_MESSAGES.achievements.streakMilestone.message(currentStreak)
        );
      } else if (currentStreak > 2 && currentStreak % 7 === 0) {
        showInfo('Streak Update', `${currentStreak} days strong! Keep it going! 🔥`);
      }
    }
  }, [currentStreak, showCelebration, showInfo]);

  const checkTimeBasedMessages = useCallback(() => {
    const hour = new Date().getHours();
    const day = new Date().getDay();

    if (hour >= 5 && hour < 8) {
      showInfo(ENCOURAGEMENT_MESSAGES.timeBased.earlyBird.title, ENCOURAGEMENT_MESSAGES.timeBased.earlyBird.message);
    } else if (hour >= 8 && hour < 10) {
      showInfo(ENCOURAGEMENT_MESSAGES.timeBased.morning.title, ENCOURAGEMENT_MESSAGES.timeBased.morning.message);
    } else if (hour >= 22 || hour < 2) {
      showInfo(ENCOURAGEMENT_MESSAGES.timeBased.nightOwl.title, ENCOURAGEMENT_MESSAGES.timeBased.nightOwl.message);
    } else if (day === 0 || day === 6) {
      showInfo(ENCOURAGEMENT_MESSAGES.timeBased.weekend.title, ENCOURAGEMENT_MESSAGES.timeBased.weekend.message);
    }
  }, [showInfo]);

  const checkStrugglingUser = useCallback(() => {
    if (!lastActiveDate) return;

    const today = new Date().toISOString().split('T')[0];
    const lastActive = new Date(lastActiveDate);
    const now = new Date();
    const diffDays = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24));

    if (diffDays >= 1 && currentStreak > 2) {
      showWarning(
        ENCOURAGEMENT_MESSAGES.struggling.streakAtRisk.title,
        ENCOURAGEMENT_MESSAGES.struggling.streakAtRisk.message
      );
    } else if (diffDays >= 2) {
      showWarning(
        ENCOURAGEMENT_MESSAGES.struggling.noActivity.title,
        ENCOURAGEMENT_MESSAGES.struggling.noActivity.message
      );
    }
  }, [lastActiveDate, currentStreak, showWarning]);

  const showRandomMotivation = useCallback(() => {
    showInfo('Motivation', getRandomMotivationalMessage());
  }, [showInfo]);

  return {
    checkOnboardingMessages,
    checkLevelUp,
    checkNewBadges,
    checkStreakMilestones,
    checkTimeBasedMessages,
    checkStrugglingUser,
    showRandomMotivation
  };
};

export const EncouragementChecker = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const stats = useSelector(state => state.userStats);
  const prevStatsRef = React.useRef(null);
  const {
    checkOnboardingMessages,
    checkLevelUp,
    checkNewBadges,
    checkStreakMilestones,
    checkTimeBasedMessages,
    checkStrugglingUser
  } = useEncouragement();

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchUserStats(user.uid));
    }
  }, [user?.uid, dispatch]);

  useEffect(() => {
    if (prevStatsRef.current) {
      checkOnboardingMessages(prevStatsRef.current);
      checkLevelUp(prevStatsRef.current.currentLevel);
      checkNewBadges(prevStatsRef.current.unlockedBadges);
      checkStreakMilestones(prevStatsRef.current.currentStreak);
    }
    prevStatsRef.current = { ...stats };
  }, [stats, checkOnboardingMessages, checkLevelUp, checkNewBadges, checkStreakMilestones]);

  useEffect(() => {
    const checkEveryHour = setInterval(() => {
      checkTimeBasedMessages();
      checkStrugglingUser();
    }, 60 * 60 * 1000);

    checkTimeBasedMessages();

    return () => clearInterval(checkEveryHour);
  }, [checkTimeBasedMessages, checkStrugglingUser]);

  return null;
};

import React from 'react';
