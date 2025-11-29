import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUser } from "./contexts/UserContext";
import Navbar from "./components/Navbar";

export default function RequireAuth() {
  const { isAuthenticated, isLoading } = useUser();
  const location = useLocation();

  // Still checking session (loading localStorage)
  if (isLoading) {
    return <div>Loading...</div>; // you can replace with a spinner
  }

  // If not authenticated → redirect to login
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login"
        replace
        state={{ from: location.pathname }} 
      />
    );
  }

  // If authenticated → allow access
  return (
    <div>

        <Navbar />
        <main style={{ paddingTop: "4rem" }}>
        <Outlet />
        </main>
        <Outlet />
    </div>
  );
}
