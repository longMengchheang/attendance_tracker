'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => User | null;
  signup: (name: string, email: string, password: string, role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'attendance_users';
const CURRENT_USER_KEY = 'attendance_current_user';

// Mock user storage helpers
function getStoredUsers(): Record<string, User & { password: string }> {
  if (typeof window === 'undefined') return {};
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : {};
}

function saveUsers(users: Record<string, User & { password: string }>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
}

function setCurrentUser(user: User | null) {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    const storedUser = getCurrentUser();
    setUser(storedUser);
    setIsLoading(false);
  }, []);

  const signup = (name: string, email: string, password: string, role: UserRole) => {
    const users = getStoredUsers();
    const newUser: User & { password: string } = {
      name,
      email,
      password,
      role,
    };
    users[email] = newUser;
    saveUsers(users);
  };

  const login = (email: string, password: string): User | null => {
    const users = getStoredUsers();
    const storedUser = users[email];
    
    if (storedUser && storedUser.password === password) {
      const { password: _, ...userWithoutPassword } = storedUser;
      setUser(userWithoutPassword);
      setCurrentUser(userWithoutPassword);
      return userWithoutPassword;
    }
    
    // For demo purposes: if user not found, create a default teacher account
    // This allows existing users to still login without signup
    const defaultUser: User = {
      name: email.split('@')[0],
      email,
      role: 'teacher', // Default to teacher for backwards compatibility
    };
    setUser(defaultUser);
    setCurrentUser(defaultUser);
    return defaultUser;
  };

  const logout = () => {
    setUser(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
