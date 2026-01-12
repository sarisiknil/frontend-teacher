import { Routes, Route, Outlet } from "react-router-dom";
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

import MyLecturesPage from "./pages/Lectures/MyLecturesPage";
import PublishedLecturesPage from "./pages/Lectures/PublishedTab";
import UnpublishedLecturesPage from "./pages/Lectures/UnpublishedTab";

import { CourseProvider } from "./contexts/CourseContext";
import CoursePage from "./pages/Courses/CoursePage";
import { useParams } from "react-router-dom";
import { LiveLectureProvider } from "./contexts/LiveLectureContext";
import LiveLecturePage from "./pages/Courses/LiveLecturePage";
import { AnnouncementProvider } from "./contexts/Announcements/AnnouncementProvider";
import TeacherMaterialsLibraryPage from "./pages/TeacherMaterialsAllCourses";
function CourseRouteWrapper() {
  const { courseId } = useParams();

  if (!courseId) {
    return <div>Invalid course id</div>;
  }

  return (
    <CourseProvider courseId={courseId}>
      <AnnouncementProvider>
        <LiveLectureProvider courseId={courseId}>
          <Outlet />
        </LiveLectureProvider>
      </AnnouncementProvider>
    </CourseProvider>
  );
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-page" element={<VerifyPage />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Protected routes */}
      <Route element={<RequireAuth />}>
        <Route
          element={
            <ProfileProvider>
              <ProfileSetupModal />
              <Outlet />
            </ProfileProvider>
          }
        >
          <Route path="/materials" element={<TeacherMaterialsLibraryPage />} />
          <Route path="/my-lectures" element={<MyLecturesPage />} />
          <Route path="/my-lectures/unpublished" element={<UnpublishedLecturesPage />} />
          <Route path="/my-lectures/published" element={<PublishedLecturesPage />} />

          {/*  COURSE ROUTES */}
          <Route path="/course/:courseId" element={<CourseRouteWrapper />}>
            <Route index element={<CoursePage />} />
            <Route path="live-lecture" element={<LiveLecturePage />} />
          </Route>

          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
