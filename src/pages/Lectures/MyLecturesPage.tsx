import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getCoursesByTeacher, type CourseRead } from "../../api/CourseApi";
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

  // 1. Define fetch logic as a reusable function
  const fetchCourses = useCallback(async () => {
    if (!teacherId) return;
    try {
      setLoading(true);
      const res = await getCoursesByTeacher(teacherId);
      setCourses(res.items);
    } catch (error) {
      console.error("Failed to load courses", error);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  // 2. Initial Fetch
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // SUMMARY COUNTS
  const publishedCount = courses.filter(
    (c) => c.course_status === "PUBLISHED" || c.course_status === "ONGOING"
  ).length;

  const unpublishedCount = courses.filter(
    (c) =>
      c.course_status === "DRAFT" ||
      c.course_status === "CANCELLED" ||
      c.course_status === "COMPLETED"
  ).length;

  const constraintsCount = 0;

  return (
    <div className="my-lectures-page">
      <div className="header-section">
        <h2>Tekrar Hoş Geldiniz!</h2>
        <p>Ders yönetim panelinize genel bir bakış.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card lavender">
          <span className="stat-title">Toplam Ders</span>
          <span className="stat-number">{loading ? "..." : courses.length}</span>
        </div>
        <div className="stat-card pink">
          <span className="stat-title">Aktif Öğrenci</span>
          <span className="stat-number">0</span>
        </div>
      </div>

      <div className="section-title-row">
        <h3 className="section-title">Ders Kategorileri</h3>
        <button
          className="add-course-circle"
          onClick={() => setShowCreateModal(true)}
          title="Yeni Ders Ekle"
        >
          +
        </button>
      </div>

      <div className="category-grid">
        <div
          className="category-card"
          onClick={() => navigate("/my-lectures/published")}
        >
          <span className="category-label">Yayında</span>
          <span className="category-number">{publishedCount}</span>
        </div>

        <div
          className="category-card"
          onClick={() => navigate("/my-lectures/unpublished")}
        >
          <span className="category-label">Pasif</span>
          <span className="category-number">{unpublishedCount}</span>
        </div>

        <div
          className="category-card"
          onClick={() => navigate("/my-lectures/contraints")}
        >
          <span className="category-label">Kısıtlamalar</span>
          <span className="category-number">{constraintsCount}</span>
        </div>
      </div>

      {/* 3. Pass refresh function to Modal */}
      {showCreateModal && (
        <CreateCourseModal 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={fetchCourses} 
        />
      )}
    </div>
  );
}