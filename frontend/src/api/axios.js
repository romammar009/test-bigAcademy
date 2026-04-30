import axios from 'axios';

const API = axios.create({
  baseURL: '/api/',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && !config.url.includes('/auth/login/')) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// If the server returns 401, the token is invalid/expired — clear session and redirect to login
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login/')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/bigacademy-login2026';
    }
    return Promise.reject(error);
  }
);

export default API;