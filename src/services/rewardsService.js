import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  Timestamp,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase.config';
import { getCurrentUser } from './authService';

export const XP_VALUES = {
  TASK_COMPLETED: 10,
  TASK_CREATED: 5,
  PROJECT_CREATED: 50,
  PROJECT_COMPLETED: 100,
  DAY_STREAK_BONUS: 5,
  WEEK_STREAK_BONUS: 25,
  INVITE_MEMBER: 25,
};

export const BADGES = {
  FIRST_TASK: {
    id: 'first_task',
    name: 'Getting Started',
    description: 'Complete your first task',
    icon: 'badge-1',
    xpReward: 50,
    condition: (stats) => stats.totalTasksCompleted >= 1,
  },
  TEN_TASKS: {
    id: 'ten_tasks',
    name: 'Task Master',
    description: 'Complete 10 tasks',
    icon: 'badge-2',
    xpReward: 100,
    condition: (stats) => stats.totalTasksCompleted >= 10,
  },
  FIFTY_TASKS: {
    id: 'fifty_tasks',
    name: 'Productivity Pro',
    description: 'Complete 50 tasks',
    icon: 'badge-3',
    xpReward: 250,
    condition: (stats) => stats.totalTasksCompleted >= 50,
  },
  HUNDRED_TASKS: {
    id: 'hundred_tasks',
    name: 'Task Champion',
    description: 'Complete 100 tasks',
    icon: 'badge-4',
    xpReward: 500,
    condition: (stats) => stats.totalTasksCompleted >= 100,
  },
  FIRST_PROJECT: {
    id: 'first_project',
    name: 'Project Starter',
    description: 'Create your first project',
    icon: 'badge-5',
    xpReward: 75,
    condition: (stats) => stats.totalProjectsCreated >= 1,
  },
  FIVE_PROJECTS: {
    id: 'five_projects',
    name: 'Project Manager',
    description: 'Create 5 projects',
    icon: 'badge-6',
    xpReward: 200,
    condition: (stats) => stats.totalProjectsCreated >= 5,
  },
  PROJECT_COMPLETED_BADGE: {
    id: 'project_completed',
    name: 'Goal Getter',
    description: 'Complete your first project',
    icon: 'badge-7',
    xpReward: 150,
    condition: (stats) => stats.totalProjectsCompleted >= 1,
  },
  STREAK_7_DAYS: {
    id: 'streak_7',
    name: 'Consistency King',
    description: 'Maintain a 7-day streak',
    icon: 'badge-8',
    xpReward: 150,
    condition: (stats) => stats.longestStreak >= 7,
  },
  STREAK_30_DAYS: {
    id: 'streak_30',
    name: 'Unstoppable',
    description: 'Maintain a 30-day streak',
    icon: 'badge-9',
    xpReward: 500,
    condition: (stats) => stats.longestStreak >= 30,
  },
  TEAM_PLAYER: {
    id: 'team_player',
    name: 'Team Player',
    description: 'Add your first team member',
    icon: 'badge-10',
    xpReward: 75,
    condition: (stats) => stats.totalTeamMembers >= 1,
  },
  EARLY_BIRD: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete a task before 8 AM',
    icon: 'badge-11',
    xpReward: 50,
    condition: (stats) => stats.earlyBirdTasks >= 1,
  },
  NIGHT_OWL: {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Complete a task after 11 PM',
    icon: 'badge-12',
    xpReward: 50,
    condition: (stats) => stats.nightOwlTasks >= 1,
  },
};

export const getUserStats = async (uid) => {
  try {
    const docRef = doc(db, 'userStats', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    
    const initialStats = {
      uid,
      totalXP: 0,
      currentLevel: 1,
      totalTasksCompleted: 0,
      totalTasksCreated: 0,
      totalProjectsCreated: 0,
      totalProjectsCompleted: 0,
      totalTeamMembers: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      unlockedBadges: [],
      earlyBirdTasks: 0,
      nightOwlTasks: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    await setDoc(docRef, initialStats);
    return initialStats;
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw error;
  }
};

export const addXP = async (uid, amount) => {
  try {
    const stats = await getUserStats(uid);
    const newXP = (stats.totalXP || 0) + amount;
    const newLevel = calculateLevel(newXP);
    
    const docRef = doc(db, 'userStats', uid);
    await updateDoc(docRef, {
      totalXP: newXP,
      currentLevel: newLevel,
      updatedAt: Timestamp.now(),
    });
    
    return { newXP, newLevel };
  } catch (error) {
    console.error('Error adding XP:', error);
    throw error;
  }
};

export const calculateLevel = (xp) => {
  let level = 1;
  let xpForNextLevel = 100;
  let totalXPNeeded = 0;
  
  while (totalXPNeeded + xpForNextLevel <= xp) {
    totalXPNeeded += xpForNextLevel;
    level++;
    xpForNextLevel = Math.floor(100 * Math.pow(1.5, level - 1));
  }
  
  return level;
};

export const getXPForNextLevel = (level) => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

export const getCurrentLevelXP = (totalXP, currentLevel) => {
  let xpForPreviousLevels = 0;
  for (let i = 1; i < currentLevel; i++) {
    xpForPreviousLevels += Math.floor(100 * Math.pow(1.5, i - 1));
  }
  return totalXP - xpForPreviousLevels;
};

export const updateStreak = async (uid) => {
  try {
    const stats = await getUserStats(uid);
    const today = new Date().toISOString().split('T')[0];
    const lastActive = stats.lastActiveDate;
    
    let newStreak = stats.currentStreak || 0;
    let xpBonus = 0;
    
    if (lastActive === today) {
      return { streak: newStreak, xpEarned: 0 };
    }
    
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (lastActive === yesterday) {
      newStreak += 1;
      xpBonus = XP_VALUES.DAY_STREAK_BONUS;
      
      if (newStreak % 7 === 0) {
        xpBonus += XP_VALUES.WEEK_STREAK_BONUS;
      }
    } else {
      newStreak = 1;
      xpBonus = 5;
    }
    
    const newLongestStreak = Math.max(stats.longestStreak || 0, newStreak);
    
    const docRef = doc(db, 'userStats', uid);
    await updateDoc(docRef, {
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastActiveDate: today,
      updatedAt: Timestamp.now(),
    });
    
    if (xpBonus > 0) {
      await addXP(uid, xpBonus);
    }
    
    return { streak: newStreak, xpEarned: xpBonus };
  } catch (error) {
    console.error('Error updating streak:', error);
    throw error;
  }
};

export const completeTask = async (uid) => {
  try {
    const stats = await getUserStats(uid);
    const xpEarned = XP_VALUES.TASK_COMPLETED;
    
    const hour = new Date().getHours();
    const updateData = {
      totalTasksCompleted: increment(1),
      updatedAt: Timestamp.now(),
    };
    
    if (hour < 8) {
      updateData.earlyBirdTasks = increment(1);
    } else if (hour >= 23) {
      updateData.nightOwlTasks = increment(1);
    }
    
    const docRef = doc(db, 'userStats', uid);
    await updateDoc(docRef, updateData);
    
    const result = await addXP(uid, xpEarned);
    await checkAndUnlockBadges(uid);
    
    return { xpEarned, ...result };
  } catch (error) {
    console.error('Error completing task:', error);
    throw error;
  }
};

export const createProject = async (uid) => {
  try {
    const docRef = doc(db, 'userStats', uid);
    await updateDoc(docRef, {
      totalProjectsCreated: increment(1),
      updatedAt: Timestamp.now(),
    });
    
    const result = await addXP(uid, XP_VALUES.PROJECT_CREATED);
    await checkAndUnlockBadges(uid);
    
    return result;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

export const completeProject = async (uid) => {
  try {
    const docRef = doc(db, 'userStats', uid);
    await updateDoc(docRef, {
      totalProjectsCompleted: increment(1),
      updatedAt: Timestamp.now(),
    });
    
    const result = await addXP(uid, XP_VALUES.PROJECT_COMPLETED);
    await checkAndUnlockBadges(uid);
    
    return result;
  } catch (error) {
    console.error('Error completing project:', error);
    throw error;
  }
};

export const addTeamMember = async (uid) => {
  try {
    const docRef = doc(db, 'userStats', uid);
    await updateDoc(docRef, {
      totalTeamMembers: increment(1),
      updatedAt: Timestamp.now(),
    });
    
    const result = await addXP(uid, XP_VALUES.INVITE_MEMBER);
    await checkAndUnlockBadges(uid);
    
    return result;
  } catch (error) {
    console.error('Error adding team member:', error);
    throw error;
  }
};

export const checkAndUnlockBadges = async (uid) => {
  try {
    const stats = await getUserStats(uid);
    const unlockedBadgeIds = stats.unlockedBadges || [];
    const newBadges = [];
    
    for (const [key, badge] of Object.entries(BADGES)) {
      if (!unlockedBadgeIds.includes(badge.id) && badge.condition(stats)) {
        unlockedBadgeIds.push(badge.id);
        newBadges.push(badge);
        
        await addXP(uid, badge.xpReward);
      }
    }
    
    if (newBadges.length > 0) {
      const docRef = doc(db, 'userStats', uid);
      await updateDoc(docRef, {
        unlockedBadges: unlockedBadgeIds,
        updatedAt: Timestamp.now(),
      });
    }
    
    return newBadges;
  } catch (error) {
    console.error('Error checking badges:', error);
    throw error;
  }
};

export const getAvailableBadges = (stats) => {
  const unlockedBadgeIds = stats.unlockedBadges || [];
  const available = [];
  const locked = [];
  
  for (const [key, badge] of Object.entries(BADGES)) {
    if (unlockedBadgeIds.includes(badge.id)) {
      available.push({ ...badge, unlocked: true });
    } else {
      locked.push({ ...badge, unlocked: false });
    }
  }
  
  return { available, locked };
};

export const getLeaderboard = async (limitCount = 10) => {
  try {
    const DEMO_USERS_KEY = 'fairytale_demo_users';
    const DEMO_USERS = [
      { uid: 'demo_1', displayName: 'Alex Chen', totalXP: 15420, currentLevel: 12, totalTasksCompleted: 234, longestStreak: 45 },
      { uid: 'demo_2', displayName: 'Sarah Miller', totalXP: 12850, currentLevel: 11, totalTasksCompleted: 189, longestStreak: 32 },
      { uid: 'demo_3', displayName: 'Jordan Kim', totalXP: 11200, currentLevel: 10, totalTasksCompleted: 156, longestStreak: 21 },
      { uid: 'demo_4', displayName: 'Morgan Davis', totalXP: 9870, currentLevel: 9, totalTasksCompleted: 134, longestStreak: 18 },
      { uid: 'demo_5', displayName: 'Casey Taylor', totalXP: 8450, currentLevel: 8, totalTasksCompleted: 112, longestStreak: 14 },
      { uid: 'demo_6', displayName: 'Riley Johnson', totalXP: 7200, currentLevel: 8, totalTasksCompleted: 98, longestStreak: 19 },
      { uid: 'demo_7', displayName: 'Avery Williams', totalXP: 6100, currentLevel: 7, totalTasksCompleted: 82, longestStreak: 10 },
      { uid: 'demo_8', displayName: 'Quinn Brown', totalXP: 5200, currentLevel: 6, totalTasksCompleted: 68, longestStreak: 8 },
      { uid: 'demo_9', displayName: 'Cameron Lee', totalXP: 4300, currentLevel: 6, totalTasksCompleted: 56, longestStreak: 5 },
      { uid: 'demo_10', displayName: 'Drew Martinez', totalXP: 3500, currentLevel: 5, totalTasksCompleted: 45, longestStreak: 10 },
      { uid: 'demo_11', displayName: 'Skyler Garcia', totalXP: 2800, currentLevel: 5, totalTasksCompleted: 38, longestStreak: 4 },
      { uid: 'demo_12', displayName: 'Aubrey Anderson', totalXP: 2100, currentLevel: 4, totalTasksCompleted: 28, longestStreak: 6 },
      { uid: 'demo_13', displayName: 'Reese Wilson', totalXP: 1500, currentLevel: 3, totalTasksCompleted: 20, longestStreak: 4 },
      { uid: 'demo_14', displayName: 'Parker Moore', totalXP: 950, currentLevel: 3, totalTasksCompleted: 14, longestStreak: 3 },
      { uid: 'demo_15', displayName: 'Sage Thompson', totalXP: 500, currentLevel: 2, totalTasksCompleted: 8, longestStreak: 2 },
    ];

    let savedDemoUsers = localStorage.getItem(DEMO_USERS_KEY);
    let demoUsers = savedDemoUsers ? JSON.parse(savedDemoUsers) : DEMO_USERS;

    const { collection, getDocs, query, orderBy, limit: limitFn } = await import('firebase/firestore');
    const usersRef = collection(db, 'userStats');
    const q = query(usersRef, orderBy('totalXP', 'desc'), limitFn(50));
    const snapshot = await getDocs(q);

    const realUsers = [];
    let currentUser = null;
    let currentUserRank = null;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.uid) {
        const userEntry = {
          rank: 0,
          uid: data.uid,
          displayName: data.displayName || 'User',
          totalXP: data.totalXP || 0,
          currentLevel: data.currentLevel || 1,
          totalTasksCompleted: data.totalTasksCompleted || 0,
          longestStreak: data.longestStreak || 0,
          isDemo: false,
        };
        if (data.uid === (await getCurrentUser())?.uid) {
          currentUser = userEntry;
        }
        realUsers.push(userEntry);
      }
    }

    const allUsers = [...demoUsers, ...realUsers];
    allUsers.sort((a, b) => b.totalXP - a.totalXP);

    const topUsers = [];
    let rank = 1;
    let currentUserIncluded = false;

    for (const user of allUsers) {
      if (user.isDemo === false || !currentUser || user.totalXP > currentUser.totalXP || !currentUserIncluded) {
        if (!currentUserIncluded && currentUser && user.uid === currentUser.uid) {
          currentUserRank = rank;
          currentUserIncluded = true;
        }
        topUsers.push({ ...user, rank: rank++ });
        if (topUsers.length >= limitCount && currentUserIncluded) break;
      } else if (user.uid === currentUser.uid) {
        currentUserRank = rank;
        topUsers.push({ ...user, rank: rank++ });
        currentUserIncluded = true;
      }
      if (topUsers.length >= limitCount && currentUserIncluded) break;
    }

    if (currentUser && !currentUserIncluded) {
      currentUserRank = allUsers.findIndex(u => u.uid === currentUser.uid) + 1;
      const userWithRank = { ...currentUser, rank: currentUserRank };
      const insertIndex = topUsers.findIndex(u => u.rank > currentUserRank);
      if (insertIndex === -1) {
        topUsers.push(userWithRank);
        if (topUsers.length > limitCount) topUsers.shift();
      } else {
        topUsers.splice(insertIndex, 0, userWithRank);
        if (topUsers.length > limitCount) topUsers.pop();
      }
      topUsers.forEach((u, i) => u.rank = i + 1);
    }

    localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(demoUsers));

    return topUsers;
  } catch (error) {
    console.error('Error getting leaderboard:', error);

    const DEMO_USERS_FALLBACK = [
      { uid: 'demo_1', displayName: 'Alex Chen', totalXP: 15420, currentLevel: 12, totalTasksCompleted: 234, longestStreak: 45, isDemo: true },
      { uid: 'demo_2', displayName: 'Sarah Miller', totalXP: 12850, currentLevel: 11, totalTasksCompleted: 189, longestStreak: 32, isDemo: true },
      { uid: 'demo_3', displayName: 'Jordan Kim', totalXP: 11200, currentLevel: 10, totalTasksCompleted: 156, longestStreak: 21, isDemo: true },
      { uid: 'demo_4', displayName: 'Morgan Davis', totalXP: 9870, currentLevel: 9, totalTasksCompleted: 134, longestStreak: 18, isDemo: true },
      { uid: 'demo_5', displayName: 'Casey Taylor', totalXP: 8450, currentLevel: 8, totalTasksCompleted: 112, longestStreak: 14, isDemo: true },
      { uid: 'demo_6', displayName: 'Riley Johnson', totalXP: 7200, currentLevel: 8, totalTasksCompleted: 98, longestStreak: 19, isDemo: true },
      { uid: 'demo_7', displayName: 'Avery Williams', totalXP: 6100, currentLevel: 7, totalTasksCompleted: 82, longestStreak: 10, isDemo: true },
      { uid: 'demo_8', displayName: 'Quinn Brown', totalXP: 5200, currentLevel: 6, totalTasksCompleted: 68, longestStreak: 8, isDemo: true },
      { uid: 'demo_9', displayName: 'Cameron Lee', totalXP: 4300, currentLevel: 6, totalTasksCompleted: 56, longestStreak: 5, isDemo: true },
      { uid: 'demo_10', displayName: 'Drew Martinez', totalXP: 3500, currentLevel: 5, totalTasksCompleted: 45, longestStreak: 10, isDemo: true },
    ];

    return DEMO_USERS_FALLBACK.map((user, i) => ({ ...user, rank: i + 1 }));
  }
};