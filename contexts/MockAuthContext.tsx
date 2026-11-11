import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  uid: string;
  email: string;
  displayName: string;
  permissions?: {
    canControlTemperature: boolean;
    canControlSchedules: boolean;
    canControlMode: boolean;
    canReceiveNotifications: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on app start
    checkStoredUser();
  }, []);

  const checkStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('mockUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.log('Error checking stored user:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    // Mock sign in - just check if user exists in storage
    try {
      const storedUsers = await AsyncStorage.getItem('mockUsers');
      const users = storedUsers ? JSON.parse(storedUsers) : [];
      
      const foundUser = users.find((u: any) => u.email === email && u.password === password);
      
      if (!foundUser) {
        throw new Error('Invalid email or password');
      }

      const user: User = {
        uid: foundUser.uid,
        email: foundUser.email,
        displayName: foundUser.displayName,
        permissions: foundUser.permissions,
      };

      setUser(user);
      await AsyncStorage.setItem('mockUser', JSON.stringify(user));
      return user;
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      // Check if user already exists
      const storedUsers = await AsyncStorage.getItem('mockUsers');
      const users = storedUsers ? JSON.parse(storedUsers) : [];
      
      const existingUser = users.find((u: any) => u.email === email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Create new user
      const newUser = {
        uid: Date.now().toString(),
        email,
        password, // In real app, this would be hashed
        displayName,
        permissions: {
          canControlTemperature: true,
          canControlSchedules: true,
          canControlMode: true,
          canReceiveNotifications: true,
        },
      };

      users.push(newUser);
      await AsyncStorage.setItem('mockUsers', JSON.stringify(users));

      const user: User = {
        uid: newUser.uid,
        email: newUser.email,
        displayName: newUser.displayName,
        permissions: newUser.permissions,
      };

      setUser(user);
      await AsyncStorage.setItem('mockUser', JSON.stringify(user));
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('mockUser');
      setUser(null);
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    // Mock password reset
    const storedUsers = await AsyncStorage.getItem('mockUsers');
    const users = storedUsers ? JSON.parse(storedUsers) : [];
    
    const foundUser = users.find((u: any) => u.email === email);
    if (!foundUser) {
      throw new Error('No user found with this email address');
    }

    // In a real app, this would send an email
    console.log('Password reset email sent to:', email);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};