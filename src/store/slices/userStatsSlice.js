import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getUserStats } from '../../services/rewardsService';

export const fetchUserStats = createAsyncThunk(
  'userStats/fetchUserStats',
  async (uid) => {
    const stats = await getUserStats(uid);
    return stats;
  }
);

const initialState = {
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
  loading: false,
  error: null,
};

const userStatsSlice = createSlice({
  name: 'userStats',
  initialState,
  reducers: {
    setXP: (state, action) => {
      state.totalXP = action.payload.totalXP;
      state.currentLevel = action.payload.currentLevel;
    },
    addXP: (state, action) => {
      state.totalXP += action.payload;
    },
    incrementTasksCompleted: (state) => {
      state.totalTasksCompleted += 1;
    },
    incrementProjectsCreated: (state) => {
      state.totalProjectsCreated += 1;
    },
    incrementProjectsCompleted: (state) => {
      state.totalProjectsCompleted += 1;
    },
    setStreak: (state, action) => {
      state.currentStreak = action.payload.currentStreak;
      if (action.payload.longestStreak > state.longestStreak) {
        state.longestStreak = action.payload.longestStreak;
      }
    },
    addBadge: (state, action) => {
      if (!state.unlockedBadges.includes(action.payload)) {
        state.unlockedBadges.push(action.payload);
      }
    },
    setUserStats: (state, action) => {
      return { ...state, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.loading = false;
        state.totalXP = action.payload.totalXP || 0;
        state.currentLevel = action.payload.currentLevel || 1;
        state.totalTasksCompleted = action.payload.totalTasksCompleted || 0;
        state.totalTasksCreated = action.payload.totalTasksCreated || 0;
        state.totalProjectsCreated = action.payload.totalProjectsCreated || 0;
        state.totalProjectsCompleted = action.payload.totalProjectsCompleted || 0;
        state.totalTeamMembers = action.payload.totalTeamMembers || 0;
        state.currentStreak = action.payload.currentStreak || 0;
        state.longestStreak = action.payload.longestStreak || 0;
        state.lastActiveDate = action.payload.lastActiveDate || null;
        state.unlockedBadges = action.payload.unlockedBadges || [];
        state.earlyBirdTasks = action.payload.earlyBirdTasks || 0;
        state.nightOwlTasks = action.payload.nightOwlTasks || 0;
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const {
  setXP,
  addXP,
  incrementTasksCompleted,
  incrementProjectsCreated,
  incrementProjectsCompleted,
  setStreak,
  addBadge,
  setUserStats,
} = userStatsSlice.actions;

export default userStatsSlice.reducer;
