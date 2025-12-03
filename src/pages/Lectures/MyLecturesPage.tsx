import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getCoursesByTeacher,
  type CourseRead,
} from "../../api/CourseApi";

import { useProfile } from "../../contexts/ProfileContext";

import CreateCourseModal from "../../components/lectures/CreateCourseModal";

import "./MyLecturesPage.css";

export default function MyLecturesPage() {
  const { profile } = useProfile();
  const teacherId = profile?.teacher_id;
  const navigate = useNavigate();


  const [courses, setCourses] = useState<CourseRead[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);




  // FETCH COURSES
  useEffect(() => {
    if (!teacherId) return;

    (async () => {
      const res = await getCoursesByTeacher(teacherId);
      setCourses(res.items);
      setLoading(false);
    })();
  }, [teacherId]);




  // SUMMARY COUNTS
  const publishedCount = courses.filter(
    c => c.course_status === "PUBLISHED" || c.course_status === "ONGOING"
  ).length;

  const unpublishedCount = courses.filter(
    c =>
      c.course_status === "DRAFT" ||
      c.course_status === "CANCELLED" ||
      c.course_status === "COMPLETED"
  ).length;

  const constraintsCount = 0;

  return (
    <div className="my-lectures-page">
      {/* ========================== HEADER ========================== */}
      <div className="header-section">
        <h2>Welcome back, Instructor!</h2>
        <p>Here’s a quick overview of your lecture management dashboard.</p>
      </div>

      {/* ========================== STATS ========================== */}
      <div className="stats-grid">
        <div className="stat-card lavender">
          <span className="stat-title">Total Courses</span>
          <span className="stat-number">    {courses.length}</span>
        </div>

        <div className="stat-card pink">
          <span className="stat-title">Active Students</span>
          <span className="stat-number"> 0</span>
        </div>
      </div>

      {/* ========================== CATEGORY CARDS ========================== */}
      <div className="section-title-row">
        <h3 className="section-title">Lecture Categories</h3>

        <button 
            className="add-course-circle" 
            onClick={() => setShowCreateModal(true)}
        >
            +
        </button>
      </div>


      <div className="category-grid">
        <div
          className="category-card"
          onClick={() => navigate("/my-lectures/published")}

        >
          <span className="category-label">Published</span>
          <span className="category-number">    {publishedCount}</span>
        </div>

        <div
          className="category-card"
          onClick={() => navigate("/my-lectures/unpublished")}

        >
          <span className="category-label">Unpublished</span>
          <span className="category-number">    {unpublishedCount}</span>
        </div>

        <div
          className="category-card"
          onClick={() => navigate("/my-lectures/contraints")}

        >
          <span className="category-label">Constraints</span>
          <span className="category-number">    {constraintsCount}</span>
        </div>
      </div>




      {/* ========================== CREATE COURSE MODAL ========================== */}
      {showCreateModal && (
        <CreateCourseModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
