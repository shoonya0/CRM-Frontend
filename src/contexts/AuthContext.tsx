import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '@/services/api';

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'sales_rep';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  tokenClaims?: TokenClaims | null;
}

interface TokenClaims {
  id: string;
  username: string;
  role: 'admin' | 'sales_rep';
  iat?: number;
  exp?: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenClaims, setTokenClaims] = useState<TokenClaims | null>(null);

  interface TokenClaims {
    id: string;
    username: string;
    role: 'admin' | 'sales_rep';
    iat?: number;
    exp?: number;
  }

  const decodeJwt = (jwtToken: string): TokenClaims | null => {
    try {
      const parts = jwtToken.split('.');
      if (parts.length !== 3) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '==='.slice((base64.length + 3) % 4);
      const jsonPayload = decodeURIComponent(atob(padded).split('').map(c => {
        const code = c.charCodeAt(0).toString(16).padStart(2, '0');
        return '%' + code;
      }).join(''));
      const obj = JSON.parse(jsonPayload);
      return obj as TokenClaims;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('crm_token');
    const storedUser = localStorage.getItem('crm_user');
    
    if (storedToken) {
      setToken(storedToken);
      const claims = decodeJwt(storedToken);
      setTokenClaims(claims);
      if (claims) {
        setUser({ id: claims.id, username: claims.username, role: claims.role });
      } else if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } else if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const claims = decodeJwt(data.token);
        setToken(data.token);
        setTokenClaims(claims);
        if (claims) {
          const derivedUser: User = { id: claims.id, username: claims.username, role: claims.role };
          setUser(derivedUser);
          localStorage.setItem('crm_user', JSON.stringify(derivedUser));
        } else {
          setUser(data.user);
          localStorage.setItem('crm_user', JSON.stringify(data.user));
        }
        localStorage.setItem('crm_token', data.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, tokenClaims }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};