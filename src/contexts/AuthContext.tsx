import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, type AuthResponse, type ApiError } from '@/services/authApi';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  session: string | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}
debugger;
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data on app load
    const token = authApi.getStoredToken();
    const storedUser = authApi.getStoredUser();
    
    console.log('Stored token:', token);
    console.log('Stored user:', storedUser);
    
    if (token && storedUser) {
      setSession(token);
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const response = await authApi.register({ email, password });
      console.log('Register response:', response);
      authApi.storeAuthData(response);
      
      // Handle different possible response structures
      const token = response.token || response.accessToken || response.jwt;
      const user = response.user || response.userInfo || response.profile;
      
      if (user && token) {
        setUser(user);
        setSession(token);
        
        // Set language preference if returned from backend
        if (response.preferredLanguage) {
          authApi.setUserLanguage(response.preferredLanguage);
          // Update i18n language
          const i18nInstance = (await import('react-i18next')).useTranslation().i18n;
          i18nInstance.changeLanguage(response.preferredLanguage);
        }
      }
      return { error: null };
    } catch (error) {
      console.error('Register error:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      debugger;
      const response = await authApi.login({ email, password });
      console.log('Login response:', response);
      authApi.storeAuthData(response);
      
      // Handle different possible response structures
      const token = response.token || response.accessToken || response.jwt;
      const user = response.user || response.userInfo || response.profile;
      
      console.log('Extracted token:', token);
      console.log('Extracted user:', user);
      
      if (user && token) {
        setUser(user);
        setSession(token);
        
        // Set language preference if returned from backend
        if (response.preferredLanguage) {
          authApi.setUserLanguage(response.preferredLanguage);
          // Update i18n language
          const i18nInstance = (await import('react-i18next')).useTranslation().i18n;
          i18nInstance.changeLanguage(response.preferredLanguage);
        }
      } else {
        console.error('Missing token or user in response');
      }
      return { error: null };
    } catch (error) {
      console.error('Login error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    authApi.clearAuthData();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
