import axios, { AxiosInstance } from 'axios';
import { languageApi } from './languageApi';

const API_BASE_URL = 'https://localhost:62427/api';

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token?: string;
  accessToken?: string;
  jwt?: string;
  user?: {
    id: string;
    email: string;
  };
  userInfo?: {
    id: string;
    email: string;
  };
  profile?: {
    id: string;
    email: string;
  };
  preferredLanguage?: string;
}

export interface ApiError {
  errors?: Array<{
    property?: string;
    message?: string;
  }>;
  error?: string;
}

export const authApi = {
  async register(request: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/register`, request, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.data) {
        throw error.response.data as ApiError;
      }
      throw { error: 'Network error occurred' };
    }
  },

  async login(request: LoginRequest): Promise<AuthResponse> {
    try {
      debugger;
      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/login`, request, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      debugger;
      console.log('Raw API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('API error:', error.response?.data);
      if (axios.isAxiosError(error) && error.response?.data) {
        throw error.response.data as ApiError;
      }
      throw { error: 'Network error occurred' };
    }
  },

  storeAuthData(authResponse: AuthResponse) {
    console.log('Storing auth data:', authResponse);
    // Handle different possible token field names
    const token = authResponse.token || authResponse.accessToken || authResponse.jwt;
    if (token) {
      localStorage.setItem('authToken', token);
    }
    // Handle different possible user field names
    const user = authResponse.user || authResponse.userInfo || authResponse.profile;
    if (user) {
      localStorage.setItem('authUser', JSON.stringify(user));
    }
  },

  getStoredToken(): string | null {
    return localStorage.getItem('authToken');
  },

  getStoredUser(): any {
    const userStr = localStorage.getItem('authUser');
    return userStr ? JSON.parse(userStr) : null;
  },

  clearAuthData() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  },

  // Set user language preference
  setUserLanguage(language: string) {
    // This will be called when login response includes language preference
    languageApi.setLanguageSession(language);
  }
};
