import axios from 'axios';

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
  user?: {
    id: string;
    email: string;
  };
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
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.data) {
        throw error.response.data as ApiError;
      }
      throw { error: 'Network error occurred' };
    }
  },

  storeAuthData(authResponse: AuthResponse) {
    if (authResponse.token) {
      localStorage.setItem('authToken', authResponse.token);
    }
    if (authResponse.user) {
      localStorage.setItem('authUser', JSON.stringify(authResponse.user));
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
  }
};
