import React, { useState, useEffect, useCallback } from 'react';
import type { User } from '../../types/auth';
import { apiClient } from '../../lib/api';
import { API_ENDPOINTS } from '../../lib/endpoints';
import { useDevPreview } from '../../dev-preview/devPreviewState';
import { AuthContext } from './AuthContextDefinition';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Dev preview integration
  const devPreview = useDevPreview();

  const refreshSession = useCallback(async () => {
    try {
      const data = await apiClient.get<{ user: User }>(API_ENDPOINTS.auth.me);
      if (data?.user) {
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      // Backend offline or 401 unauthenticated
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    apiClient
      .get<{ user: User }>(API_ENDPOINTS.auth.me)
      .then((data) => {
        if (!ignore && data?.user) {
          setUser(data.user);
          setIsAuthenticated(true);
        }
      })
      .catch(() => {
        if (!ignore) {
          setUser(null);
          setIsAuthenticated(false);
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post<{ user: User }>(API_ENDPOINTS.auth.login, {
        email,
        password,
      });
      setUser(res.user);
      setIsAuthenticated(true);
      // Disable preview mode if real login succeeds
      if (devPreview.isActive) {
        devPreview.exitPreview();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post<{ user: User }>(API_ENDPOINTS.auth.register, {
        name,
        email,
        password,
      });
      setUser(res.user);
      setIsAuthenticated(true);
      if (devPreview.isActive) {
        devPreview.exitPreview();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (isAuthenticated) {
        await apiClient.post(API_ENDPOINTS.auth.logout);
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      if (devPreview.isActive) {
        devPreview.exitPreview();
      }
      setIsLoading(false);
    }
  };

  // Determine effective user: Real authenticated user takes precedence; otherwise preview user if preview mode is active
  const effectiveUser = isAuthenticated ? user : (devPreview.isActive ? devPreview.previewUser : null);
  const isPreview = !isAuthenticated && devPreview.isActive;

  return (
    <AuthContext.Provider
      value={{
        user: effectiveUser,
        isLoading,
        isAuthenticated,
        isPreview,
        login,
        register,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
