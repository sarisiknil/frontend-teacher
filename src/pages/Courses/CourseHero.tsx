// pages/Course/CourseHero.tsx
import { useCourse } from "../../contexts/CourseContext";
import "./CourseHero.css";
import { useState } from "react";
import { requestCourseDraftReview } from "../../api/CourseApi";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function CourseHero() {
  const { course } = useCourse();
  const [comment, setApplicantComment] = useState("");

  const t = course?.teacher_overview;
  const p = t?.Profile;

  const avatarUrl = p?.AvatarLink
    ? `${API_BASE}/${p.AvatarLink}`
    : "/default-avatar.png";

  async function handleCourseApproval() {
    if (!course) return;

    try {
      const payload = {
        course_id: course.course_id,
        applicant_comment: comment || null,
      };

      const res = await requestCourseDraftReview(payload);

      console.log(res);
      alert("Course review request successfully submitted!");
      setApplicantComment("");
    } catch (err) {
      console.error(err);
      alert("Failed to send review request.");
    }
  }

  return (
    <div className="course-hero">
      <div className="course-hero-left">
        <h1 className="course-title">{course?.course_name}</h1>

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

              <span className="teacher-branch">
                {t?.Primary_Branch ?? "Branş Bulunamadı"}
              </span>

              <span className="teacher-rating">
                ⭐ {t?.Avg_score ?? 0}.0 ({t?.Review_count ?? 0})
              </span>
            </div>
          </div>
        )}

        <div className="course-tags">
          {course?.course_level && (
            <span className="tag">{course.course_level.name}</span>
          )}
          {course?.course_subbranch && (
            <span className="tag">{course.course_subbranch.name}</span>
          )}
        </div>

        {/* ------------------ APPROVAL COMMENT + BUTTON ------------------ */}
        {course?.course_status === "DRAFT" && (
          <div className="approval-box">
            <textarea
              className="approval-comment"
              placeholder="Add a comment for the reviewer..."
              value={comment}
              onChange={(e) => setApplicantComment(e.target.value)}
            />

            <button
              className="approval-button"
              onClick={handleCourseApproval}
            >
              Request Course Review
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
