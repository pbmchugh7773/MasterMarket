import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

interface User {
  id: number;
  email: string;
  role: string;
  is_premium: boolean;
}

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: true, // 👈 nuevo
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // 👈 nuevo

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        console.log("🔍 Usuario cargado desde storage:", storedUser);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error("Error cargando usuario desde storage:", err);
      } finally {
        setLoading(false); // 👈 termina la carga
      }
    };
    loadUser();
  }, []);

  const login = async (userData: User, token: string) => {
    console.log('🔐 Saving token to AsyncStorage:', token ? 'Token received' : 'No token');
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    await AsyncStorage.setItem('token', token);
    console.log('✅ Token saved successfully');
    setUser(userData);
    router.replace('/');
  };

  const logout = async () => {
    try {
      console.log('🚪 Logging out...');
      
      // Clear AsyncStorage
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      console.log('🗑️ AsyncStorage cleared');
      
      // Clear Google Sign-In if available
      try {
        const { GoogleSignin } = require('@react-native-google-signin/google-signin');
        if (await GoogleSignin.isSignedIn()) {
          await GoogleSignin.signOut();
          console.log('🔓 Google Sign-In session cleared');
        }
      } catch (error) {
        console.log('⚠️ Google Sign-In not available or already signed out');
      }
      
      setUser(null);
      router.replace('/login');
      console.log('✅ Logout completed');
    } catch (error) {
      console.error('❌ Error during logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
