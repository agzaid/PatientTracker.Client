import axios, { AxiosInstance } from 'axios';
import { toast } from 'sonner';

// const API_BASE_URL = 'http://agzaidtp34-001-site3.rtempurl.com/api';
// const API_BASE_URL = 'http://api.sehty.org/api';
// const API_BASE_URL = 'https://api.sehty.org/api';
const API_BASE_URL = 'http://localhost:7000/api';


// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 unauthorized, 500 errors, and validation errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      window.location.href = '/'; // Redirect to login
    } else if (error.response?.status === 500) {
      // Internal server error - show toast instead of redirecting
      console.error('Server error:', error.response?.data);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'An error occurred on the server';
      toast.error(errorMessage);
    } else if (error.response?.status === 400 && error.response?.data?.errors) {
      // Validation errors
      const errors = error.response.data.errors;
      Object.keys(errors).forEach((field) => {
        const errorMessages = errors[field];
        if (Array.isArray(errorMessages)) {
          errorMessages.forEach((message) => {
            toast.error(`${field}: ${message}`);
          });
        } else {
          toast.error(`${field}: ${errorMessages}`);
        }
      });
    }
    return Promise.reject(error);
  }
);

export default apiClient;
