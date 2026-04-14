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
    
    if (token && storedUser) {
      setSession(token);
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const response = await authApi.register({ email, password });
      authApi.storeAuthData(response);
      if (response.user && response.token) {
        setUser(response.user);
        setSession(response.token);
      }
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      debugger;
      const response = await authApi.login({ email, password });
      authApi.storeAuthData(response);
      if (response.user && response.token) {
        setUser(response.user);
        setSession(response.token);
      }
      return { error: null };
    } catch (error) {
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
