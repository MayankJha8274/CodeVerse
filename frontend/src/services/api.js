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

  async getRatingGrowth() {
    const data = await authFetch('/analytics/rating-history/leetcode?days=90');
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
    const data = await authFetch('/analytics/achievements');
    return data.data;
  },

  async getInsights() {
    const data = await authFetch('/analytics/insights');
    return data.data;
  },

  // Daily Challenge API (placeholder)
  async getDailyChallenge() {
    return {
      title: "Two Sum Problem",
      difficulty: "Easy",
      description: "Find two numbers that add up to target"
    };
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
  }
};

export default api;
