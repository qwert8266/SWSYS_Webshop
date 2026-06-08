//import { createContext, useContext, useEffect, useMemo, useState } from "react";
//import { login as loginRequest, signup, validateSession } from "../api/authApi";
//
//const AuthContext = createContext(null);
//
//function normalizeUser(validateResponse) {
//  const user = validateResponse?.message;
//
//  if (!user) {   
//    return null;
//  }
//
//  return {
//    id: user.ID || user.id,
//    email: user.Email || user.email,
//    createdAt: user.CreatedAt || user.createdAt,
//  };
//}
//
//export function AuthProvider({ children }) {
//  const [user, setUser] = useState(null);
//  const [isAuthLoading, setIsAuthLoading] = useState(true);
//
//  useEffect(() => {
//    let isMounted = true;
//
//    async function loadSession() {
//      try {
//        const data = await validateSession();
//
//        if (isMounted) {
//          setUser(normalizeUser(data));
//        }
//      } catch (_) {
//        if (isMounted) {
//          setUser(null);
//        }
//      } finally {
//        if (isMounted) {
//          setIsAuthLoading(false);
//        }
//      }
//    }
//
//    loadSession();
//
//    return () => {
//        isMounted = false;
//    };
//
//  }, []);
//
//  async function register(email, password) {
//    await signup(email, password);
//    await login(email, password);
//    const data = await validateSession();
//    setUser(normalizeUser(data));
//  }
//
//  async function login(email, password) {
//    await loginRequest(email, password);
//    const data = await validateSession();
//    setUser(normalizeUser(data));
//  }
//
//  function logout() {
//    setUser(null);
//  }
//
//  const value = useMemo(
//    () => ({
//        user,
//        isAuthenticated: Boolean(user),
//        isAuthLoading,
//        register,
//        login,
//        logout,
//    }),
//    [user, isAuthLoading, register]
//  );
//
//  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
//}
//
//export function useAuth() {
//    const context = useContext(AuthContext);
//
//    if (!context) {
//        throw new Error("useAuth muss innerhalb des AuthProviders verwendet werden.");
//    }
//
//    return context;
//}