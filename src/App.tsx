import { Routes, Route, Outlet} from "react-router-dom";
import './App.css'
import LandingPage from './pages/LandingPage';
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyPage from "./pages/VerifyPage";
import Layout from "./Layout";
import RequireAuth from "./RequireAuth";
import Home from "./pages/HomePage";
import { ProfileProvider } from "./contexts/ProfileContext";
import ProfileSetupModal from "./modals/ProfileSetupModal";
import Profile from "./pages/ProfilePage";

function App() {

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-page" element={<VerifyPage />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route
          element={
            <ProfileProvider>
              <ProfileSetupModal />
              <Outlet />
            </ProfileProvider>
          }
        >
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>


    </Routes>
  )
}

export default App
