import axios from 'axios';
import { logger } from '../lib/logger';

const API_URL = import.meta.env.VITE_API_URL || '';

export const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      logger.error('API Error:', error.response.data);
    } else if (error.request) {
      logger.error('Network Error:', error.message);
    } else {
      logger.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);
