import {
  mockUser,
  mockStats,
  mockPlatformStats,
  mockProblemsOverTime,
  mockRatingGrowth,
  mockTopicHeatmap,
  mockDailyChallenge,
  mockRooms,
  mockRoomLeaderboard,
  mockComparisonUsers
} from '../data/mockData';

// Simulate API delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Simulate random failures for testing
const shouldFail = () => Math.random() < 0.05; // 5% failure rate

// API Service
export const api = {
  // User APIs
  async getUser() {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch user data');
    return mockUser;
  },

  async updateUser(userData) {
    await delay();
    if (shouldFail()) throw new Error('Failed to update user');
    return { ...mockUser, ...userData };
  },

  // Stats APIs
  async getStats() {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch stats');
    return mockStats;
  },

  async getPlatformStats(platform) {
    await delay();
    if (shouldFail()) throw new Error(`Failed to fetch ${platform} stats`);
    return mockPlatformStats[platform];
  },

  async getAllPlatformStats() {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch platform stats');
    return mockPlatformStats;
  },

  // Analytics APIs
  async getProblemsOverTime() {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch problems over time');
    return mockProblemsOverTime;
  },

  async getRatingGrowth() {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch rating growth');
    return mockRatingGrowth;
  },

  async getTopicHeatmap() {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch topic heatmap');
    return mockTopicHeatmap;
  },

  // Daily Challenge API
  async getDailyChallenge() {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch daily challenge');
    return mockDailyChallenge;
  },

  // Room/Society APIs
  async getRooms() {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch rooms');
    return mockRooms;
  },

  async getRoom(roomId) {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch room');
    return mockRooms.find(room => room.id === roomId);
  },

  async getRoomLeaderboard(roomId, filter = 'weekly') {
    await delay();
    if (shouldFail()) throw new Error('Failed to fetch leaderboard');
    return mockRoomLeaderboard;
  },

  // Comparison APIs
  async compareUsers(userIds) {
    await delay();
    if (shouldFail()) throw new Error('Failed to compare users');
    return mockComparisonUsers.filter(user => userIds.includes(user.id));
  },

  // Auth APIs (mock)
  async login(email, password) {
    await delay(800);
    if (shouldFail()) throw new Error('Login failed');
    if (!email || !password) throw new Error('Email and password required');
    return { user: mockUser, token: 'mock-jwt-token' };
  },

  async register(userData) {
    await delay(800);
    if (shouldFail()) throw new Error('Registration failed');
    return { user: { ...mockUser, ...userData }, token: 'mock-jwt-token' };
  },

  async logout() {
    await delay(300);
    return { success: true };
  },

  // Data refresh API
  async refreshData(platform) {
    await delay(1500);
    if (shouldFail()) throw new Error(`Failed to refresh ${platform} data`);
    return { success: true, message: `${platform} data refreshed successfully` };
  }
};

export default api;
