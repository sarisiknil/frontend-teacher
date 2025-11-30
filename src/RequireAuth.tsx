import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUser } from "./contexts/UserContext";
import Navbar from "./components/Navbar";

export default function RequireAuth() {
  const { isAuthenticated, isLoading } = useUser();
  const location = useLocation();

  if (isLoading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    );
  }

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: "4rem" }}>
        <Outlet /> {/* authenticated content */}
      </div>
    </>
  );
}
