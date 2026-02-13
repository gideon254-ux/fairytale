export const ENCOURAGEMENT_MESSAGES = {
  onboarding: {
    firstLogin: {
      title: 'Welcome to Fairytale!',
      message: 'Start your productivity journey today. Complete your first task to earn your first badge!',
      type: 'success',
      icon: 'sparkles'
    },
    firstProject: {
      title: 'Project Created!',
      message: 'Great start! You\'ve created your first project. Keep up the momentum!',
      type: 'success',
      icon: 'folder'
    },
    firstTask: {
      title: 'Task Created!',
      message: 'You\'re on your way! Complete this task to earn +10 XP and unlock your first badge.',
      type: 'info',
      icon: 'check'
    },
    firstTaskCompleted: {
      title: 'First Task Complete!',
      message: 'You\'ve earned 10 XP and unlocked the "Getting Started" badge! 🎉',
      type: 'success',
      icon: 'trophy'
    }
  },
  achievements: {
    levelUp: {
      title: 'Level Up!',
      message: (level) => `Congratulations! You've reached Level ${level}! Keep pushing! 🚀`,
      type: 'celebration',
      icon: 'star'
    },
    badgeUnlocked: {
      title: 'Badge Unlocked!',
      message: (badgeName, xpReward) => `You've earned the "${badgeName}" badge! +${xpReward} XP`,
      type: 'celebration',
      icon: 'badge'
    },
    streakMilestone: {
      title: 'Streak Milestone!',
      message: (days) => `${days} day streak! You're on fire! 🔥`,
      type: 'celebration',
      icon: 'fire',
      milestones: [3, 7, 14, 30, 60, 100]
    }
  },
  struggling: {
    streakAtRisk: {
      title: 'Streak at Risk!',
      message: 'You haven\'t completed a task today. Complete one now to keep your streak alive!',
      type: 'warning',
      icon: 'warning',
      condition: (streak) => streak > 2
    },
    noActivity: {
      title: 'We Miss You!',
      message: 'It\'s been a while since your last task. Come back and keep your progress going!',
      type: 'warning',
      icon: 'heart',
      condition: (lastActiveDays) => lastActiveDays >= 2
    },
    almostThere: {
      title: 'Almost There!',
      message: (tasksLeft, xpNeeded) => `Just ${tasksLeft} more task(s) to unlock your next badge! ${xpNeeded} XP away from your goal.`,
      type: 'info',
      icon: 'target'
    },
    secondPlace: {
      title: 'So Close!',
      message: 'You\'re #2 on the leaderboard! One more push to take the top spot! 💪',
      type: 'info',
      icon: 'competition',
      condition: (rank) => rank === 2
    }
  },
  timeBased: {
    morning: {
      title: 'Good Morning!',
      message: 'Start your day with a task and build your streak early! ☀️',
      type: 'info',
      icon: 'sun',
      condition: () => {
        const hour = new Date().getHours();
        return hour >= 5 && hour < 10;
      }
    },
    earlyBird: {
      title: 'Early Bird! 🐦',
      message: 'Completing tasks before 8 AM? You\'re unstoppable! Keep it up!',
      type: 'success',
      icon: 'bird',
      condition: () => {
        const hour = new Date().getHours();
        return hour >= 5 && hour < 8;
      }
    },
    nightOwl: {
      title: 'Night Owl! 🦉',
      message: 'Working late? You\'re dedicated! Don\'t forget to complete a task to maintain your streak.',
      type: 'info',
      icon: 'moon',
      condition: () => {
        const hour = new Date().getHours();
        return hour >= 22 || hour < 2;
      }
    },
    weekend: {
      title: 'Weekend Warrior!',
      message: 'Use your weekend time to crush your goals while others rest! 💪',
      type: 'info',
      icon: 'zap',
      condition: () => {
        const day = new Date().getDay();
        return day === 0 || day === 6;
      }
    }
  },
  competitive: {
    topThree: {
      title: 'You\'re in the Top 3!',
      message: 'Amazing work! You\'re among the top performers. Can you reach #1?',
      type: 'celebration',
      icon: 'trophy',
      condition: (rank) => rank >= 1 && rank <= 3
    },
    leaderboardEntry: {
      title: 'You\'re on the Leaderboard!',
      message: 'You\'ve ranked in the top 15 users! Keep climbing! 📈',
      type: 'success',
      icon: 'chart'
    },
    passedSomeone: {
      title: 'You Passed Someone!',
      message: 'You just moved up on the leaderboard. Can you catch the next one?',
      type: 'success',
      icon: 'arrow-up'
    },
    someonePassedYou: {
      title: 'Someone\'s Chasing You!',
      message: 'A competitor just passed you. Reclaim your spot! 💪',
      type: 'warning',
      icon: 'alert'
    },
    centuryClub: {
      title: '100+ XP Today!',
      message: 'You\'ve earned over 100 XP today! You\'re in the zone! 🔥',
      type: 'celebration',
      icon: 'fire',
      condition: (todayXP) => todayXP >= 100
    }
  },
  motivational: {
    keepGoing: {
      title: 'You\'ve Got This!',
      message: 'Every task completed is progress. Keep going, you\'re doing amazing! ✨',
      type: 'info',
      icon: 'heart'
    },
    smallWins: {
      title: 'Small Wins Matter!',
      message: 'Don\'t underestimate the power of small progress. You\'re building momentum! 📈',
      type: 'info',
      icon: 'star'
    },
    consistency: {
      title: 'Consistency is Key!',
      message: 'Showing up every day builds habits. Your future self will thank you! 🌟',
      type: 'info',
      icon: 'calendar'
    },
    breakthrough: {
      title: 'Breakthrough Mode!',
      message: 'You\'re on a roll! This is the perfect time to tackle that big project! 🚀',
      type: 'info',
      icon: 'rocket'
    }
  },
  festive: {
    valentine: {
      name: 'Valentine\'s Day',
      dateRange: { month: 1, dayStart: 14, duration: 1 },
      title: 'Happy Valentine\'s Day! 💕',
      message: 'Love your productivity! Complete tasks for your special someone today!',
      theme: 'valentine',
      color: '#ec4899'
    },
    easter: {
      name: 'Easter',
      dateRange: { month: 3, dayStart: 1, duration: 2 },
      title: 'Happy Easter! 🐰',
      message: 'Hop to it! Complete tasks and find productivity eggs everywhere!',
      theme: 'easter',
      color: '#f59e0b'
    },
    halloween: {
      name: 'Halloween',
      dateRange: { month: 9, dayStart: 31, duration: 1 },
      title: 'Happy Halloween! 🎃',
      message: 'Spooktacular productivity! Don\'t let your tasks haunt you!',
      theme: 'halloween',
      color: '#f97316'
    },
    christmas: {
      name: 'Christmas',
      dateRange: { month: 11, dayStart: 24, duration: 3 },
      title: 'Merry Christmas! 🎄',
      message: 'The gift of productivity! Complete tasks and make your list twice as nice!',
      theme: 'christmas',
      color: '#10b981'
    },
    newYearsEve: {
      name: 'New Year\'s Eve',
      dateRange: { month: 11, dayStart: 31, duration: 1 },
      title: 'New Year\'s Eve Countdown! 🎉',
      message: 'The year is ending! Make every minute count!',
      theme: 'newyear',
      color: '#8b5cf6',
      hasCountdown: true
    }
  }
};

export const getFestiveMessage = () => {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();

  const festiveConfigs = [
    { key: 'valentine', month: 1, startDay: 14, endDay: 14 },
    { key: 'easter', month: 3, startDay: 1, endDay: 2 },
    { key: 'halloween', month: 9, startDay: 31, endDay: 31 },
    { key: 'christmas', month: 11, startDay: 24, endDay: 26 },
    { key: 'newYearsEve', month: 11, startDay: 31, endDay: 31 }
  ];

  for (const config of festiveConfigs) {
    if (month === config.month && day >= config.startDay && day <= config.endDay) {
      return ENCOURAGEMENT_MESSAGES.festive[config.key];
    }
  }

  return null;
};

export const isFestiveSeason = () => {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();

  const isValentine = month === 1 && day === 14;
  const isEaster = month === 3 && day >= 1 && day <= 2;
  const isHalloween = month === 9 && day === 31;
  const isChristmas = month === 11 && day >= 24 && day <= 26;
  const isNewYearsEve = month === 11 && day === 31;

  return isValentine || isEaster || isHalloween || isChristmas || isNewYearsEve;
};

export const isNewYearsEve = () => {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();
  return month === 11 && day === 31;
};

export const shouldShowCountdown = () => {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();
  const hour = now.getHours();

  if (month === 11 && day === 31) {
    return hour >= 23 && hour <= 23;
  }
  return false;
};

export const getRandomMotivationalMessage = () => {
  const messages = [
    'Every expert was once a beginner. Keep learning!',
    'Progress, not perfection. Every task counts!',
    'The secret to getting ahead is getting started.',
    'Small steps every day lead to big results.',
    'You\'re building something great, one task at a time.',
    'Don\'t wait for perfect. Do it now!',
    'Your future self will thank you for showing up today.',
    'Discipline is choosing what you want most over what you want now.',
    'The best time to start is now.',
    'One task at a time, one day at a time.'
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};

export const STREAK_MESSAGES = [
  { streak: 3, message: '3-day streak! You\'re building momentum! 🔥' },
  { streak: 7, message: 'One week strong! Your dedication is impressive! ⭐' },
  { streak: 14, message: 'Two weeks! You\'re unstoppable! 🚀' },
  { streak: 30, message: 'A full month! You\'re a consistency champion! 👑' },
  { streak: 60, message: '60 days! This is amazing commitment! 🏆' },
  { streak: 100, message: '100 days! You\'re legendary! 🌟' }
];

export const getStreakMessage = (streak) => {
  const milestone = STREAK_MESSAGES.filter(m => streak >= m.streak).pop();
  return milestone ? milestone.message : `${streak} day streak! Keep going! 🔥`;
};

export const LEVEL_UP_MESSAGES = [
  'Level up! You\'re climbing the ranks! 📈',
  'Level up! Your dedication is paying off! ⭐',
  'Level up! The sky\'s the limit! 🚀',
  'Level up! You\'re getting stronger! 💪',
  'Level up! Keep that momentum going! 🔥'
];

export const getRandomLevelUpMessage = () => {
  return LEVEL_UP_MESSAGES[Math.floor(Math.random() * LEVEL_UP_MESSAGES.length)];
};

export const FESTIVE_THEMES = {
  valentine: {
    primary: '#ec4899',
    secondary: '#f472b6',
    accent: '#be185d',
    emoji: '💕',
    bg: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)'
  },
  easter: {
    primary: '#f59e0b',
    secondary: '#fbbf24',
    accent: '#d97706',
    emoji: '🐰',
    bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
  },
  halloween: {
    primary: '#f97316',
    secondary: '#fb923c',
    accent: '#ea580c',
    emoji: '🎃',
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
  },
  christmas: {
    primary: '#10b981',
    secondary: '#34d399',
    accent: '#059669',
    emoji: '🎄',
    bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
  },
  newyear: {
    primary: '#8b5cf6',
    secondary: '#a78bfa',
    accent: '#7c3aed',
    emoji: '🎉',
    bg: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)'
  }
};
