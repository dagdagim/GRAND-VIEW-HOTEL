import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token from localStorage if present and not already provided
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hotel_pms_token');
  if (token && config.headers && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 unauthenticated errors for PMS routes
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized on a protected PMS route, clear token
      if (window.location.pathname.startsWith('/pms') && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('hotel_pms_token');
        localStorage.removeItem('hotel_pms_user');
        window.location.href = '/pms/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
