import { useCourse } from "../../contexts/CourseContext";
import "./CourseHero.css";
import { useState, useRef, useEffect } from "react";
import {
  requestCourseDraftReview,
  uploadCourseBanner,
  getDraftsByCourse,
} from "../../api/CourseApi";
import type { CourseDraftRead } from "../../api/CourseApi";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function CourseHero() {
  const { course, refreshCourse } = useCourse();

  // Applicant comment
  const [comment, setApplicantComment] = useState("");

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Banner cache buster
  const [imgTimestamp, setImgTimestamp] = useState(Date.now());

  // Draft state
  const [draft, setDraft] = useState<CourseDraftRead | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  useEffect(() => {
    if (course?.banner_url) {
      setImgTimestamp(Date.now());
    }
  }, [course?.banner_url]);

  // Fetch draft by course
  useEffect(() => {
    if (!course?.course_id) return;

    async function loadDraft() {
      try {
        setDraftLoading(true);
        setDraftError(null);
        if(course){
          const res = await getDraftsByCourse(course.course_id);
          setDraft(res.items[0] ?? null);
        }

      } catch (err) {
        console.error(err);
        setDraftError("Taslak durumu alınamadı.");
      } finally {
        setDraftLoading(false);
      }
    }

    loadDraft();
  }, [course?.course_id]);

  const t = course?.teacher_overview;
  const p = t?.Profile;

  const avatarUrl = p?.AvatarLink
    ? `${API_BASE}/${p.AvatarLink}`
    : "/default-avatar.png";

  const bannerUrl = course?.banner_url
    ? `${API_BASE}/${course.banner_url}?t=${imgTimestamp}`
    : null;

  // ----------------- HANDLERS -----------------

  async function handleCourseApproval() {
    if (!course) return;

    try {
      await requestCourseDraftReview({
        course_id: course.course_id,
        applicant_comment: comment || null,
      });

      alert("İnceleme isteği gönderildi!");
      setApplicantComment("");
      if (refreshCourse) refreshCourse();
    } catch (err: any) {
      console.error(err);

      if (err.response?.status === 422) {
        alert("Eksik veya hatalı bilgi gönderildi.");
        return;
      }

      const backendError =
        err.response?.data?.errors?.[0]?.detail ||
        err.response?.data?.message ||
        "İstek gönderilemedi.";

      alert(backendError);
    }
  }

  const handleBannerClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !course) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Dosya çok büyük. Max 5MB.");
      return;
    }
    console.log(draftLoading);
    console.log(draftError);

    try {
      setIsUploading(true);
      await uploadCourseBanner(course.course_id, file);
      alert("Kapak fotoğrafı güncellendi!");
      setImgTimestamp(Date.now());
      if (refreshCourse) await refreshCourse();
    } catch (error: any) {
      console.error("Upload failed", error);
      const msg =
        error.response?.data?.detail || "Yükleme başarısız.";
      alert(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ----------------- RENDER -----------------

  return (
    <div
      className="course-hero"
      style={bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : {}}
    >
      <div className="course-hero-overlay" />

      <div className="course-hero-content">
        {/* ---------- UPLOAD BUTTON ---------- */}
        {course?.course_status === "DRAFT" && (
          <div className="banner-upload-section">
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept="image/*"
              onChange={handleFileChange}
            />
            <button
              className="upload-banner-btn"
              onClick={handleBannerClick}
              disabled={isUploading}
            >
              {isUploading
                ? "Yükleniyor..."
                : "Kapak Fotoğrafını Değiştir"}
            </button>
          </div>
        )}

        {/* ---------- LEFT ---------- */}
        <div className="course-hero-left">
          <h1 className="course-title">
            {course?.course_name}
          </h1>

          {p && (
            <div className="teacher-row">
              <img
                src={avatarUrl}
                alt="Teacher"
                className="teacher-avatar"
              />
              <div className="teacher-info">
                <span className="teacher-name">
                  {p.Name} {p.Surname}
                </span>
                <span className="teacher-rating">
                  ⭐ {t?.Avg_score ?? 0}
                </span>
              </div>
            </div>
          )}

          <div className="course-tags">
            {course?.course_level && (
              <span className="tag">
                {course.course_level.name}
              </span>
            )}
            {course?.course_subbranch && (
              <span className="tag">
                {course.course_subbranch.name}
              </span>
            )}
            <span
              className={`tag status-${course?.course_status?.toLowerCase()}`}
            >
              {course?.course_status}
            </span>
          </div>
        </div>

        {/* ---------- RIGHT ---------- */}
        <div className="course-hero-right">


          {/* DRAFT → SUBMIT */}
          {course?.course_status === "DRAFT" && (
            <div className="approval-box">
              <textarea
                className="approval-comment"
                placeholder="İnceleyen için notunuz (Opsiyonel)..."
                value={comment}
                onChange={(e) =>
                  setApplicantComment(e.target.value)
                }
              />
              <button
                className="approval-button"
                onClick={handleCourseApproval}
                disabled={draft?.status === "PENDING"}
              >
                {draft?.status === "PENDING"
                  ? "İncelemede"
                  : "Yayınlanması İçin Gönder"}
              </button>
            </div>
          )}

          {/* PENDING INFO */}
          {draft?.status === "PENDING" && (
            <div
              className="approval-box pending-box"
              style={{
                textAlign: "center",
                backgroundColor: "rgba(255, 193, 7, 0.9)",
                color: "#333",
              }}
            >
              <h3 style={{ marginBottom: 10 }}>
                ⏳ İnceleme Bekleniyor
              </h3>
              <p style={{ margin: 0 }}>
                Kursunuz şu an onay sürecindedir.
              </p>
            </div>
          )}

          {/* REJECTED */}
          {draft?.status === "REJECTED" && (
            <div
              className="approval-box rejected-box"
              style={{
                backgroundColor: "rgba(244, 67, 54, 0.9)",
                color: "white",
              }}
            >
              <h3>⚠️ Başvuru Reddedildi</h3>
              <p>
                Kursunuz reddedildi. Düzenleyip tekrar
                gönderebilirsiniz.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
