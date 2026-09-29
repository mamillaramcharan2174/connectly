/**
 * Connectly API Client Service
 */

const API_BASE_URL = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) 
  ? process.env.EXPO_PUBLIC_API_URL 
  : 'http://localhost:5000';

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();
    if (!response.ok) {
      const errorMsg = data?.error?.message || `HTTP ${response.status} Request failed`;
      const error = new Error(errorMsg);
      error.code = data?.error?.code || 'API_ERROR';
      error.status = response.status;
      throw error;
    }

    return data;
  } catch (err) {
    console.warn(`[API] Error on ${options.method || 'GET'} ${endpoint}:`, err.message);
    throw err;
  }
}

export const api = {
  // Authentication
  login: (identifier, password) => 
    request('/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) }),
  
  register: (payload) => 
    request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  
  forgotPassword: (email) => 
    request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  
  resetPassword: (email, otp, newPassword) => 
    request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, otp, newPassword }) }),
  
  getMe: () => 
    request('/auth/me'),
  
  logout: () => 
    request('/auth/logout', { method: 'POST' }),

  // Feed & Posts
  getFeed: (page = 1, limit = 10) => 
    request(`/feed?page=${page}&limit=${limit}`),
  
  getPostById: (id) => 
    request(`/posts/${id}`),
  
  createPost: (postData) => 
    request('/posts', { method: 'POST', body: JSON.stringify(postData) }),
  
  updatePostCaption: (id, caption) => 
    request(`/posts/${id}`, { method: 'PATCH', body: JSON.stringify({ caption }) }),
  
  deletePost: (id) => 
    request(`/posts/${id}`, { method: 'DELETE' }),
  
  toggleLikePost: (id) => 
    request(`/posts/${id}/like`, { method: 'POST' }),
  
  getComments: (postId) => 
    request(`/posts/${postId}/comments`),
  
  addComment: (postId, content, parentId = null) => 
    request(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content, parentId }) }),
  
  toggleSavePost: (id) => 
    request(`/posts/${id}/save`, { method: 'POST' }),
  
  getSavedPosts: () => 
    request('/posts/saved'),

  // Stories
  getStoriesFeed: () => 
    request('/stories'),
  
  createStory: (storyData) => 
    request('/stories', { method: 'POST', body: JSON.stringify(storyData) }),
  
  recordStoryView: (id) => 
    request(`/stories/${id}/view`, { method: 'POST' }),
  
  reactToStory: (id, emoji) => 
    request(`/stories/${id}/reaction`, { method: 'POST', body: JSON.stringify({ emoji }) }),
  
  getStoryAnalytics: (id) => 
    request(`/stories/${id}/analytics`),
  
  deleteStory: (id) => 
    request(`/stories/${id}`, { method: 'DELETE' }),

  // Direct & Group Chat
  getConversations: () => 
    request('/conversations'),
  
  getOrCreateDirectConversation: (targetUserId) => 
    request('/conversations/direct', { method: 'POST', body: JSON.stringify({ targetUserId }) }),
  
  createGroupConversation: (name, memberIds = [], avatarUrl = '') => 
    request('/conversations/group', { method: 'POST', body: JSON.stringify({ name, memberIds, avatarUrl }) }),
  
  getMessages: (conversationId) => 
    request(`/conversations/${conversationId}/messages`),
  
  sendMessage: (conversationId, messageData) => 
    request(`/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify(messageData) }),
  
  reactToMessage: (messageId, emoji) => 
    request(`/conversations/messages/${messageId}/react`, { method: 'POST', body: JSON.stringify({ emoji }) }),
  
  deleteMessage: (messageId) => 
    request(`/conversations/messages/${messageId}`, { method: 'DELETE' }),

  // User Profiles & Relationships
  getProfile: (username) => 
    request(`/users/${username}`),
  
  updateProfile: (profileData) => 
    request('/users/me', { method: 'PATCH', body: JSON.stringify(profileData) }),
  
  followUser: (userId) => 
    request(`/users/${userId}/follow`, { method: 'POST' }),
  
  unfollowUser: (userId) => 
    request(`/users/${userId}/follow`, { method: 'DELETE' }),
  
  blockUser: (userId) => 
    request(`/users/${userId}/block`, { method: 'POST' }),
  
  unblockUser: (userId) => 
    request(`/users/${userId}/block`, { method: 'DELETE' }),
  
  muteUser: (userId) => 
    request(`/users/${userId}/mute`, { method: 'POST' }),
  
  searchUsers: (query) => 
    request(`/users/search?q=${encodeURIComponent(query)}`),

  // Notifications
  getNotifications: () => 
    request('/notifications'),
  
  markNotificationRead: (id) => 
    request(`/notifications/${id}/read`, { method: 'PATCH' }),
  
  markAllNotificationsRead: () => 
    request('/notifications/read-all', { method: 'POST' }),

  // Reports
  createReport: (targetType, targetId, reason, description = '') => 
    request('/reports', { method: 'POST', body: JSON.stringify({ targetType, targetId, reason, description }) }),

  // Admin Dashboard
  getAdminOverview: () => 
    request('/admin/overview'),
  
  listAdminUsers: () => 
    request('/admin/users'),
  
  toggleUserSuspension: (userId, suspend, reason) => 
    request(`/admin/users/${userId}/suspension`, { method: 'POST', body: JSON.stringify({ suspend, reason }) }),
  
  getAdminReports: (status = 'pending') => 
    request(`/admin/reports?status=${status}`),
  
  resolveAdminReport: (reportId, status, resolutionNotes, actionTaken) => 
    request(`/admin/reports/${reportId}/resolve`, { method: 'POST', body: JSON.stringify({ status, resolutionNotes, actionTaken }) }),

  // Upload
  uploadFile: async (formData) => {
    const url = `${API_BASE_URL}/upload`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      },
      body: formData
    });
    return response.json();
  }
};
