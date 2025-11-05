import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (userData) => api.post('/users/register', userData),
  login: (credentials) => api.post('/users/login', credentials),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData),
};

// Match API calls
export const matchAPI = {
  getMatches: () => api.get('/match'),
};

// AI API calls
export const aiAPI = {
  getSkillRecommendations: (skills) => api.post('/ai/recommend', { skills }),
};

// Session API calls
export const sessionAPI = {
  startSession: (guestId, topic) => api.post('/sessions/start', { guestId, topic }),
  getPendingInvites: (userId) => api.get(`/sessions/pending/${userId || ''}`),
  acceptSession: (sessionId) => api.post(`/sessions/accept/${sessionId}`),
  declineSession: (sessionId) => api.post(`/sessions/decline/${sessionId}`),
  joinSession: (sessionId) => api.post(`/sessions/join/${sessionId}`),
  endSession: (sessionId) => api.post(`/sessions/end/${sessionId}`),
  getActiveSessions: () => api.get('/sessions/active'),
  getSessionHistory: () => api.get('/sessions/history'),
};

export default api;