// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper to get auth token
const getAuthToken = () => localStorage.getItem('token');

// Helper to make authenticated requests
const authFetch = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    console.warn('No auth token found in localStorage');
  }

  const fullUrl = `${API_BASE_URL}${url}`;
  console.log(`API Request: ${options.method || 'GET'} ${fullUrl}`);
  if (options.body) {
    console.log('Request body:', options.body);
  }

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers
    });

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Failed to parse response:', parseError);
      data = { message: 'Invalid server response' };
    }
    
    console.log('API Response status:', response.status);
    console.log('API Response data:', data);

    if (!response.ok) {
      // Handle token expiration - auto redirect to login
      if (response.status === 401 && data.message && data.message.includes('token expired')) {
        console.warn('🔐 Token expired, clearing auth and redirecting to login...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => {
          window.location.href = '/login?error=session_expired';
        }, 500);
      }
      
      const error = new Error(data.message || `API request failed with status ${response.status}`);
      error.response = { data, status: response.status };
      throw error;
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    // Re-throw with response data if available
    if (!error.response) {
      error.response = { data: { message: error.message }, status: 0 };
    }
    throw error;
  }
};

// API Service
export const api = {
  // Auth APIs
  async register(userData) {
    // Clear any old tokens first
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    const data = await authFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    if (data.data?.token) {
      console.log('✅ New token received from registration, saving to localStorage');
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
    } else {
      console.error('❌ No token received from register API');
    }
    return data.data;
  },

  async login(credentials) {
    // Clear any old tokens first
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    const data = await authFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    if (data.data?.token) {
      console.log('✅ New token received, saving to localStorage');
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
    } else {
      console.error('❌ No token received from login API');
    }
    return data.data;
  },

  async logout() {
    // Force clear all auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Also clear any cached data
    localStorage.removeItem('userCache');
    console.log('🚪 Logged out - all auth data cleared');
  },

  // User/Dashboard APIs
  async getUser() {
    const data = await authFetch('/dashboard/summary');
    // Return the user object with all fields including platforms
    return data.data?.user || data.data;
  },

  async getUserProfile(userId) {
    const data = await authFetch(`/dashboard/profile/${userId}`);
    return data.data;
  },

  async updateUser(userData) {
    const data = await authFetch('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
    return data.data;
  },

  // Stats APIs
  async getStats() {
    const data = await authFetch('/dashboard/summary');
    return data.data;
  },

  async getTimeline(days = 30) {
    const data = await authFetch(`/dashboard/timeline?days=${days}`);
    return data.data;
  },

  async getPlatformStats(platform) {
    const data = await authFetch(`/platforms/stats/${platform}`);
    // Return the stats object directly for easier access in components
    return data.data?.stats || data.data;
  },

  async getAllPlatformStats() {
    const data = await authFetch('/platforms/stats');
    return data.data;
  },

  // Analytics APIs
  async getProblemsOverTime() {
    const data = await authFetch('/dashboard/timeline?days=30');
    return data.data.timeline;
  },

  async getContributionCalendar() {
    const data = await authFetch('/dashboard/calendar');
    return data.data;
  },

  async getRatingGrowth() {
    const data = await authFetch('/analytics/rating-history/leetcode?days=90');
    return data.data;
  },

  async getAllRatingHistory(days = 90) {
    const data = await authFetch(`/analytics/all-rating-history?days=${days}`);
    return data.data;
  },

  async getTopicHeatmap() {
    const data = await authFetch('/analytics/languages');
    return data.data;
  },

  async getStreaks() {
    const data = await authFetch('/analytics/streaks');
    return data.data;
  },

  async getWeeklyProgress() {
    const data = await authFetch('/analytics/weekly-progress');
    return data.data;
  },

  async getAchievements() {
    const data = await authFetch('/platforms/achievements');
    return data.data;
  },

  async getTopicAnalysis() {
    const data = await authFetch('/platforms/topics');
    return data.data;
  },

  async getBadges() {
    const data = await authFetch('/platforms/badges');
    return data.data;
  },

  async getInsights() {
    const data = await authFetch('/analytics/insights');
    return data.data;
  },

  // Daily Challenge APIs
  async getDailyChallenge() {
    const data = await authFetch('/daily-challenge/today');
    return data;
  },

  async completeDailyChallenge() {
    const data = await authFetch('/daily-challenge/complete', {
      method: 'POST'
    });
    return data;
  },

  async verifyDailyChallenge() {
    const data = await authFetch('/daily-challenge/verify', {
      method: 'POST'
    });
    return data;
  },

  async skipDailyChallenge() {
    const data = await authFetch('/daily-challenge/skip', {
      method: 'POST'
    });
    return data;
  },

  async getDailyChallengeStreak() {
    const data = await authFetch('/daily-challenge/streak');
    return data;
  },

  async getDailyChallengeHistory(limit = 30) {
    const data = await authFetch(`/daily-challenge/history?limit=${limit}`);
    return data;
  },

  async getDailyChallengeTopics() {
    const data = await authFetch('/daily-challenge/topics');
    return data;
  },

  // Platform sync APIs
  async syncPlatforms() {
    const data = await authFetch('/platforms/sync', {
      method: 'POST'
    });
    return data;
  },

  async linkPlatform(platform, username) {
    const data = await authFetch('/platforms/connect', {
      method: 'PUT',
      body: JSON.stringify({ platform, username })
    });
    return data;
  },

  async unlinkPlatform(platform) {
    const data = await authFetch(`/platforms/disconnect/${platform}`, {
      method: 'DELETE'
    });
    return data;
  },

  async syncPlatform(platform) {
    const data = await authFetch('/platforms/sync', {
      method: 'POST',
      body: JSON.stringify({ platform })
    });
    return data;
  },

  async refreshData(platform) {
    const data = await authFetch('/platforms/sync', {
      method: 'POST',
      body: JSON.stringify({ platform })
    });
    return data;
  },

  // Room/Society APIs
  async getRooms() {
    const data = await authFetch('/dashboard/rooms');
    return data.data;
  },

  async getRoom(roomId) {
    const data = await authFetch(`/rooms/${roomId}`);
    return data.data;
  },

  async createRoom(roomData) {
    const data = await authFetch('/rooms', {
      method: 'POST',
      body: JSON.stringify(roomData)
    });
    return data.data;
  },

  async joinRoom(inviteCode) {
    const data = await authFetch('/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode })
    });
    return data.data;
  },

  async leaveRoom(roomId) {
    const data = await authFetch(`/rooms/${roomId}/leave`, {
      method: 'POST'
    });
    return data;
  },

  async updateRoom(roomId, roomData) {
    const data = await authFetch(`/rooms/${roomId}`, {
      method: 'PUT',
      body: JSON.stringify(roomData)
    });
    return data.data;
  },

  async deleteRoom(roomId) {
    const data = await authFetch(`/rooms/${roomId}`, {
      method: 'DELETE'
    });
    return data;
  },

  async getRoomLeaderboard(roomId, period = 'weekly') {
    const data = await authFetch(`/rooms/${roomId}/leaderboard?period=${period}`);
    return data.data;
  },

  async getRoomAnalytics(roomId) {
    const data = await authFetch(`/rooms/${roomId}/analytics`);
    return data.data;
  },

  // Comparison APIs
  async compareUsers(u1, u2) {
    const data = await authFetch(`/compare/users?u1=${u1}&u2=${u2}`);
    return data.data;
  },

  async compareWithRoom(roomId) {
    const data = await authFetch(`/compare/room/${roomId}`);
    return data.data;
  },

  async getTopPerformers(limit = 10, roomId = null) {
    const url = roomId 
      ? `/compare/top?limit=${limit}&roomId=${roomId}`
      : `/compare/top?limit=${limit}`;
    const data = await authFetch(url);
    return data.data;
  },

  // Leaderboard APIs
  async getGlobalLeaderboard(page = 1, sortBy = 'cScore', limit = 100) {
    const data = await authFetch(`/leaderboard?page=${page}&limit=${limit}&sortBy=${sortBy}`);
    return data.data;
  },

  async getUserRank() {
    const data = await authFetch('/leaderboard/rank');
    return data.data;
  },

  async getInstitutionLeaderboard(institution, page = 1, sortBy = 'cScore', limit = 50) {
    const data = await authFetch(`/leaderboard/institution/${encodeURIComponent(institution)}?page=${page}&limit=${limit}&sortBy=${sortBy}`);
    return data.data;
  },

  // Avatar upload
  async uploadAvatar(file) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/auth/upload-avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to upload avatar');
    }
    return data.data;
  },

  // Contest APIs
  async getContests(platform = 'all', limit = 50) {
    const data = await authFetch(`/contests?platform=${platform}&limit=${limit}`);
    return data.data;
  },

  async getContestsCalendar(month, year) {
    const data = await authFetch(`/contests/calendar?month=${month}&year=${year}`);
    return data;
  },

  async refreshContests() {
    const data = await authFetch('/contests/refresh', {
      method: 'POST'
    });
    return data;
  },

  async setContestReminder(contestId) {
    const data = await authFetch(`/contests/${contestId}/reminder`, {
      method: 'POST'
    });
    return data;
  },

  async removeContestReminder(contestId) {
    const data = await authFetch(`/contests/${contestId}/reminder`, {
      method: 'DELETE'
    });
    return data;
  },

  async getUserReminders() {
    const data = await authFetch('/contests/reminders');
    return data.data;
  },

  // ============== HOSTED CONTEST APIs ==============

  // Create a new contest
  async createHostedContest(contestData) {
    const data = await authFetch('/hosted-contests', {
      method: 'POST',
      body: JSON.stringify(contestData)
    });
    return data.data;
  },

  // Get all my contests (owned + moderated)
  async getMyHostedContests() {
    const data = await authFetch('/hosted-contests/my-contests');
    return data;
  },

  // Get public contests
  async getPublicHostedContests(status = null) {
    const query = status ? `?status=${status}` : '';
    const data = await authFetch(`/hosted-contests/public${query}`);
    return data;
  },

  // Get single contest by slug
  async getHostedContest(slug) {
    const data = await authFetch(`/hosted-contests/${slug}`);
    return data;
  },

  // Update contest
  async updateHostedContest(slug, contestData) {
    const data = await authFetch(`/hosted-contests/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(contestData)
    });
    return data.data;
  },

  // Delete contest
  async deleteHostedContest(slug) {
    const data = await authFetch(`/hosted-contests/${slug}`, {
      method: 'DELETE'
    });
    return data;
  },

  // Add moderator
  async addContestModerator(slug, userIdentifier, role = 'moderator') {
    const data = await authFetch(`/hosted-contests/${slug}/moderators`, {
      method: 'POST',
      body: JSON.stringify({ userIdentifier, role })
    });
    return data;
  },

  // Remove moderator
  async removeContestModerator(slug, userId) {
    const data = await authFetch(`/hosted-contests/${slug}/moderators/${userId}`, {
      method: 'DELETE'
    });
    return data;
  },

  // Send notification
  async sendContestNotification(slug, message, type = 'info') {
    const data = await authFetch(`/hosted-contests/${slug}/notifications`, {
      method: 'POST',
      body: JSON.stringify({ message, type })
    });
    return data;
  },

  // Get notifications
  async getContestNotifications(slug) {
    const data = await authFetch(`/hosted-contests/${slug}/notifications`);
    return data.data;
  },

  // Sign up for contest
  async signUpForContest(slug) {
    const data = await authFetch(`/hosted-contests/${slug}/signup`, {
      method: 'POST'
    });
    return data;
  },

  // Get signups
  async getContestSignups(slug) {
    const data = await authFetch(`/hosted-contests/${slug}/signups`);
    return data;
  },

  // Get statistics
  async getContestStatistics(slug) {
    const data = await authFetch(`/hosted-contests/${slug}/statistics`);
    return data.data;
  },

  // Get leaderboard
  async getContestLeaderboard(slug) {
    const data = await authFetch(`/hosted-contests/${slug}/leaderboard`);
    return data;
  },

  // ============== PROBLEM APIs ==============

  // Get all problems for a contest
  async getContestProblems(slug) {
    const data = await authFetch(`/hosted-contests/${slug}/problems`);
    return data;
  },

  // Get single problem
  async getContestProblem(slug, problemSlug) {
    const data = await authFetch(`/hosted-contests/${slug}/problems/${problemSlug}`);
    return data;
  },

  // Create problem
  async createContestProblem(slug, problemData) {
    const data = await authFetch(`/hosted-contests/${slug}/problems`, {
      method: 'POST',
      body: JSON.stringify(problemData)
    });
    return data.data;
  },

  // Update problem
  async updateContestProblem(slug, problemSlug, problemData) {
    const data = await authFetch(`/hosted-contests/${slug}/problems/${problemSlug}`, {
      method: 'PUT',
      body: JSON.stringify(problemData)
    });
    return data.data;
  },

  // Delete problem
  async deleteContestProblem(slug, problemSlug) {
    const data = await authFetch(`/hosted-contests/${slug}/problems/${problemSlug}`, {
      method: 'DELETE'
    });
    return data;
  },

  // Reorder problems
  async reorderContestProblems(slug, problemOrders) {
    const data = await authFetch(`/hosted-contests/${slug}/problems/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ problemOrders })
    });
    return data;
  },

  // Add test case
  async addTestCase(slug, problemSlug, testCaseData) {
    const data = await authFetch(`/hosted-contests/${slug}/problems/${problemSlug}/testcases`, {
      method: 'POST',
      body: JSON.stringify(testCaseData)
    });
    return data.data;
  },

  // Delete test case
  async deleteTestCase(slug, problemSlug, testCaseId) {
    const data = await authFetch(`/hosted-contests/${slug}/problems/${problemSlug}/testcases/${testCaseId}`, {
      method: 'DELETE'
    });
    return data;
  },

  // ============== SUBMISSION APIs ==============

  // Submit solution
  async submitSolution(slug, problemSlug, code, language) {
    const data = await authFetch(`/hosted-contests/${slug}/problems/${problemSlug}/submit`, {
      method: 'POST',
      body: JSON.stringify({ code, language })
    });
    return data;
  },

  // Get submission status
  async getSubmissionStatus(submissionId) {
    const data = await authFetch(`/submissions/${submissionId}`);
    return data.data;
  },

  // Get my submissions in a contest
  async getMyContestSubmissions(slug) {
    const data = await authFetch(`/hosted-contests/${slug}/my-submissions`);
    return data;
  },

  // Get problem submissions
  async getProblemSubmissions(slug, problemSlug) {
    const data = await authFetch(`/hosted-contests/${slug}/problems/${problemSlug}/submissions`);
    return data;
  },

  // Run code (live compiler)
  async runCode(code, language, input = '') {
    const data = await authFetch('/run-code', {
      method: 'POST',
      body: JSON.stringify({ code, language, input })
    });
    return data;
  },

  // ============== PROBLEM SET APIs ==============

  // Get public problems
  async getPublicProblems(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const data = await publicFetch(`/problem-set/public${queryString ? `?${queryString}` : ''}`);
    return data;
  },

  // Get my problems
  async getMyProblems() {
    const data = await authFetch('/problem-set/my-problems');
    return data;
  },

  // Get single problem
  async getProblem(slug) {
    const data = await authFetch(`/problem-set/${slug}`);
    return data;
  },

  // Create problem
  async createProblem(problemData) {
    const data = await authFetch('/problem-set', {
      method: 'POST',
      body: JSON.stringify(problemData)
    });
    return data;
  },

  // Update problem
  async updateProblem(slug, problemData) {
    const data = await authFetch(`/problem-set/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(problemData)
    });
    return data;
  },

  // Delete problem
  async deleteProblem(slug) {
    const data = await authFetch(`/problem-set/${slug}`, {
      method: 'DELETE'
    });
    return data;
  },

  // Add moderator
  async addProblemModerator(slug, userIdentifier, role = 'editor') {
    const data = await authFetch(`/problem-set/${slug}/moderators`, {
      method: 'POST',
      body: JSON.stringify({ userIdentifier, role })
    });
    return data;
  },

  // Remove moderator
  async removeProblemModerator(slug, userId) {
    const data = await authFetch(`/problem-set/${slug}/moderators/${userId}`, {
      method: 'DELETE'
    });
    return data;
  },

  // Add test case
  async addProblemTestCase(slug, testCaseData) {
    const data = await authFetch(`/problem-set/${slug}/testcases`, {
      method: 'POST',
      body: JSON.stringify(testCaseData)
    });
    return data;
  },

  // Delete test case
  async deleteProblemTestCase(slug, testCaseId) {
    const data = await authFetch(`/problem-set/${slug}/testcases/${testCaseId}`, {
      method: 'DELETE'
    });
    return data;
  },

  // Search problems for contest
  async searchProblems(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const data = await authFetch(`/problem-set/search${queryString ? `?${queryString}` : ''}`);
    return data;
  }
};

export default api;
