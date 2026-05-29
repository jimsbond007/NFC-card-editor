/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContext } from 'react';
import { AuthContext } from './AuthContext';

interface AuthContextType {
  user: any;
  role: string | null;
  loading: boolean;
  logout: () => Promise<void>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context as AuthContextType;
}