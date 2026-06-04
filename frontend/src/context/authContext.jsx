import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import authApi from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const register = useCallback(async (formData) => {
    const registeredUser = await authApi.register(formData);
    setUser(registeredUser);
    return registeredUser;
  }, []);

  //const logout = useCallback(() => { setUser(null); }, []);

  const value = useMemo(
    () => ({
      user,
      register,
      isAuthenticated: Boolean(user),
    }),
    [user, register]
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