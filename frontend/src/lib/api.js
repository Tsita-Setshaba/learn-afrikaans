import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

// Users
export const usersAPI = {
  updateProfile: (data) => api.put('/users/profile', data),
  updateStreak: () => api.post('/users/update-streak'),
};

// Lessons
export const lessonsAPI = {
  getTopics: () => api.get('/lessons/topics'),
  getLesson: (topicId) => api.get(`/lessons/${topicId}`),
  completeLesson: (topicId) => api.post(`/lessons/${topicId}/complete`),
};

// Quiz
export const quizAPI = {
  generate: (data) => api.post('/quiz/generate', data),
  submit: (data) => api.post('/quiz/submit', data),
};

// Chatbot
export const chatbotAPI = {
  sendMessage: (data) => api.post('/chatbot/message', data),
};

// Leaderboard
export const leaderboardAPI = {
  get: () => api.get('/leaderboard'),
};

// Progress
export const progressAPI = {
  get: () => api.get('/progress'),
};

// Dashboard
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

// Badges
export const badgesAPI = {
  getAll: () => api.get('/badges'),
};

// Word of Day
export const wordOfDayAPI = {
  get: () => api.get('/word-of-day'),
};
