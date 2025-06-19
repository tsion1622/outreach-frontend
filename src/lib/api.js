import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (userData) => api.post('/auth/register/', userData),
  logout: () => api.post('/auth/logout/'),
};

// Domain Discovery API
export const domainDiscoveryAPI = {
  initiate: (data) => api.post('/domain-discovery/initiate/', data),
  getStatus: (taskId) => api.get(`/domain-discovery/status/${taskId}/`),
};

// Scraping API
export const scrapingAPI = {
  initiate: (data) => api.post('/scraper/initiate/', data),
  getStatus: (taskId) => api.get(`/scraper/status/${taskId}/`),
};

// Contacts API
export const contactsAPI = {
  getAll: (params) => api.get('/contacts/', { params }),
  getById: (id) => api.get(`/contacts/${id}/`),
  create: (data) => api.post('/contacts/', data),
  update: (id, data) => api.patch(`/contacts/${id}/`, data),
  delete: (id) => api.delete(`/contacts/${id}/`),
  bulkDelete: (contactIds) => api.post('/contacts/bulk-delete/', { contact_ids: contactIds }),
  uploadCSV: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/contacts/upload-csv/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Email Campaigns API
export const campaignsAPI = {
  getAll: () => api.get('/mailer/campaigns/'),
  getById: (id) => api.get(`/mailer/campaigns/${id}/`),
  create: (data) => api.post('/mailer/campaigns/', data),
  update: (id, data) => api.patch(`/mailer/campaigns/${id}/`, data),
  delete: (id) => api.delete(`/mailer/campaigns/${id}/`),
  send: (campaignId) => api.post(`/mailer/campaigns/${campaignId}/send/`),
  getSendingStatus: (campaignId, sendingTaskId) => 
    api.get(`/mailer/campaigns/${campaignId}/status/${sendingTaskId}/`),
};

// SMTP Configuration API
export const smtpAPI = {
  get: () => api.get('/smtp-config/'),
  update: (data) => api.patch('/smtp-config/', data),
};

// Tracking API
export const trackingAPI = {
  getSummary: (campaignId) => api.get(`/tracking/${campaignId}/summary/`),
  getOpens: (campaignId) => api.get(`/tracking/${campaignId}/opens/`),
  getClicks: (campaignId) => api.get(`/tracking/${campaignId}/clicks/`),
  getSkipped: (campaignId) => api.get(`/tracking/${campaignId}/skipped/`),
};

export default api;

