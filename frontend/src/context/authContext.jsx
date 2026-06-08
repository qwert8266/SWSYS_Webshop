import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import authApi from "../api/authApi";

const AuthContext = createContext(null);
const ACCESS_TOKEN_KEY = "Schmidt-Soehne_AT";
const REFRESH_TOKEN_KEY = "Schmidt-Soehne_RT";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(() => 
    localStorage.getItem(ACCESS_TOKEN_KEY)
  );

  // Stores the backend authResponse after login or registration
  const saveAuthResponse = useCallback((authResponse) => {
    setUser(authResponse.user);
    setAccessToken(authResponse.accessToken);
    localStorage.setItem(ACCESS_TOKEN_KEY, authResponse.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, authResponse.refreshToken);
    return authResponse;
  }, []);

  // Removes all authentication data
  const clearAuthState = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }, []);


  const register = useCallback(async (formData) => {
    const authResponse = await authApi.register(formData);
    return saveAuthResponse(authResponse);
    }, [saveAuthResponse]
  );
  /*const register = useCallback(async (formData) => {
    const registeredUser = await authApi.register(formData);
    setUser(registeredUser);
    return registeredUser;
  }, []);
  */

  const login = useCallback(async (credentials) => {
    const authResponse = await authApi.login(credentials);
    return saveAuthResponse(authResponse);
    }, [saveAuthResponse]
  );

  const logout = useCallback(async () => { 
    const tokenForLogout = accessToken;

    try {
      if (tokenForLogout) {
        await authApi.logout(tokenForLogout);
      }
    } finally {
      // always remove the token locally, 
      // even if the backend is temporarily unreachable or token has already expired
      clearAuthState();
    }
  }, [accessToken, clearAuthState]);


  // When page is reloaded, the user is loaded using the token stored in loaclStorage
  // via the protected backend endpoint  
  useEffect(() => {
    if (!accessToken || user) {
      return;
    }

    async function loadCurrentUser() {
      try {
        const currentUser = await authApi.getCurrentUser(accessToken);
        setUser(currentUser);
      } catch (error) {
        clearAuthState();
      }
    }

    loadCurrentUser();
  }, [accessToken, user, clearAuthState]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      register,
      login,
      logout,
      isAuthenticated: Boolean(accessToken),
    }),
    [user, accessToken, register, login, logout]
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