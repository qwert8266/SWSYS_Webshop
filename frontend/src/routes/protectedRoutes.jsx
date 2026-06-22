import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/authContext";

function ProtectedRoutes({ children }) {
  const location = useLocation();
  const { isAuthenticated, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return <p className="m-4">Anmeldung wird geprüft...</p>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />; 
  }

  return children;
}

export default ProtectedRoutes;