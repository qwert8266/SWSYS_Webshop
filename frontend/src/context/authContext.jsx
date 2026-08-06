import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import authApi from "../api/authApi";
import {ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, AUTH_SESSION_EXPIRED_EVENT, AUTH_TOKENS_UPDATED_EVENT } from '../api/baseApi';


const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(() => 
    localStorage.getItem(ACCESS_TOKEN_KEY)
  );
  const [isAuthLoading, setIsAuthLoading] = useState(() =>
    Boolean(localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY))
  );

  // synchronizes the token pair and public user data after authentication
  const saveAuthResponse = useCallback((authResponse) => {
    setUser(authResponse.user);
    setAccessToken(authResponse.accessToken);
    setIsAuthLoading(false);
    localStorage.setItem(ACCESS_TOKEN_KEY, authResponse.accessToken);
    if (authResponse.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, authResponse.refreshToken);
    }
    return authResponse;
  }, []);

  // Removes all authentication data
  const clearAuthState = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setIsAuthLoading(false);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }, []);


  const register = useCallback(async (formData) => {
    const authResponse = await authApi.register(formData);
    return saveAuthResponse(authResponse);
    }, [saveAuthResponse]
  );
  

  const login = useCallback(async (credentials) => {
    const authResponse = await authApi.login(credentials);
    return saveAuthResponse(authResponse);
    }, [saveAuthResponse]
  );

  const logout = useCallback(async () => { 
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } finally {
      // always remove the token locally, 
      // even if the backend is temporarily unreachable or token has already expired
      clearAuthState();
    }
  }, [clearAuthState]);


  // Keep React state synchronized when BaseApi rotates tokens during an automatic retry
  useEffect(() => {
    const handleTokensUpdated = (event) => saveAuthResponse(event.detail);
    const handleSessionExpired = () => clearAuthState();

    window.addEventListener(AUTH_TOKENS_UPDATED_EVENT, handleTokensUpdated);
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => {
      window.removeEventListener(AUTH_TOKENS_UPDATED_EVENT, handleTokensUpdated);
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [saveAuthResponse, clearAuthState])

  // When page is reloaded, the user is restored using the access or refresh token stored in loaclStorage
  useEffect(() => {
    if (user) {
      setIsAuthLoading(false);
      return;
    }

    async function restoreSession() {
      setIsAuthLoading(true);

      try {
        let token = accessToken;
        if (!token) {
          const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
          if (!refreshToken) {
            clearAuthState();
            return;
          }
          const authResponse = await authApi.refresh(refreshToken);
          saveAuthResponse(authResponse);
          token = authResponse.accessToken;
        }

        const currentUser = await authApi.getCurrentUser(token);
        setUser(currentUser);
      } catch (error) {
        // only delete tokens when error is serious enough  
        if (error.status === 401 || error.status === 403) {
          clearAuthState();
        } else {
          console.warn("Benutzerdaten konnten nicht geladen werden.", error);
        }
      } finally {
        setIsAuthLoading(false);
      }
    }

    restoreSession();
  }, [accessToken, user, saveAuthResponse, clearAuthState]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      register,
      login,
      logout,
      isAuthLoading,
      isAuthenticated: Boolean(accessToken),
    }),
    [user, accessToken, register, login, logout, isAuthLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth muss innerhalb eines AuthProvider verwendet werden.");
  }

  return context;
}