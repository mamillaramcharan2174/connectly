import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken } from '../services/api';
import { socketService } from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session on mount
  useEffect(() => {
    async function initAuth() {
      try {
        let savedToken = null;
        let savedUser = null;
        if (typeof window !== 'undefined' && window.localStorage) {
          savedToken = window.localStorage.getItem('connectly_token');
          const uStr = window.localStorage.getItem('connectly_user');
          if (uStr) savedUser = JSON.parse(uStr);
        }

        if (savedToken) {
          setAuthToken(savedToken);
          setToken(savedToken);
          if (savedUser) setUser(savedUser);

          // Verify token and fetch fresh profile
          try {
            const res = await api.getMe();
            if (res.success && res.data) {
              setUser(res.data);
              if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem('connectly_user', JSON.stringify(res.data));
              }
              socketService.connect(savedToken);
            }
          } catch (_) {
            // Token might be expired, fallback
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Init error:', err);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (identifier, password) => {
    const res = await api.login(identifier, password);
    if (res.success && res.data) {
      const { user: loggedInUser, tokens } = res.data;
      setAuthToken(tokens.accessToken);
      setToken(tokens.accessToken);
      setUser(loggedInUser);

      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('connectly_token', tokens.accessToken);
        window.localStorage.setItem('connectly_refresh', tokens.refreshToken);
        window.localStorage.setItem('connectly_user', JSON.stringify(loggedInUser));
      }

      socketService.connect(tokens.accessToken);
      return res;
    }
    return res;
  };

  const register = async (formData) => {
    const res = await api.register(formData);
    if (res.success && res.data) {
      const { user: registeredUser, tokens } = res.data;
      setAuthToken(tokens.accessToken);
      setToken(tokens.accessToken);
      setUser(registeredUser);

      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('connectly_token', tokens.accessToken);
        window.localStorage.setItem('connectly_refresh', tokens.refreshToken);
        window.localStorage.setItem('connectly_user', JSON.stringify(registeredUser));
      }

      socketService.connect(tokens.accessToken);
      return res;
    }
    return res;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (_) {}

    socketService.disconnect();
    setAuthToken(null);
    setToken(null);
    setUser(null);

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('connectly_token');
      window.localStorage.removeItem('connectly_refresh');
      window.localStorage.removeItem('connectly_user');
    }
  };

  const updateUser = (updatedFields) => {
    setUser(prev => {
      const next = { ...prev, ...updatedFields };
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('connectly_user', JSON.stringify(next));
      }
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
