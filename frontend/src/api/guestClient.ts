import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL;
const API_BASE_URL = (rawApiUrl && !rawApiUrl.includes('your-hotel-backend'))
  ? rawApiUrl
  : (import.meta.env.PROD ? 'https://grand-view-hotel-backend.onrender.com/api' : '/api');

// Dedicated Axios client for In-Room Guest Portal
// Fully isolated from PMS staff auth tokens and PMS session storage
const guestClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Automatically inject guest portal token if present
guestClient.interceptors.request.use((config) => {
  const guestToken = localStorage.getItem('guest_portal_token');
  if (guestToken && config.headers) {
    config.headers.set('Authorization', `Bearer ${guestToken}`);
  }
  return config;
});

// Automatically handle checkout or expired sessions: wipe token and dispatch checkout event
guestClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('guest_portal_token');
      window.dispatchEvent(
        new CustomEvent('guest_checkout_detected', {
          detail: {
            message:
              error.response?.data?.error ||
              'Your stay has concluded and you have been checked out. Thank you for staying with Grand View Hotel.'
          }
        })
      );
    }
    return Promise.reject(error);
  }
);

export default guestClient;
