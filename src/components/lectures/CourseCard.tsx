import type { CourseRead } from "../../api/CourseApi";
import "./CourseCard.css";

export default function CourseCard({ course }: { course: CourseRead }) {
  const statusColor: Record<string, string> = {
    DRAFT: "badge-draft",
    PUBLISHED: "badge-published",
    ONGOING: "badge-ongoing",
    COMPLETED: "badge-completed",
    CANCELLED: "badge-cancelled",
  };

  return (
    <div className="course-card">
      {/* LEFT */}
      <div className="course-card-left">
        <h3 className="course-title">{course.course_name}</h3>

        <div className="course-meta">
          <span className="course-date">
            Start: {course.start_date || "No date set"}
          </span>

          <span className={`course-status ${statusColor[course.course_status]}`}>
            {course.course_status}
          </span>
        </div>

        {/* PROGRESS */}
        <div className="course-progress-wrapper">
          <div className="course-progress-bar">
            <div
              className="course-progress-bar-fill"
              style={{
                width:
                  course.total_lessons > 0
                    ? `${(course.completed_lessons / course.total_lessons) * 100}%`
                    : "0%",
              }}
            ></div>
          </div>
          <span className="course-progress-text">
            {course.completed_lessons}/{course.total_lessons} lessons
          </span>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="course-card-right">
        <span className="course-branch">
          {course.course_subbranch?.name || "No Subbranch"}
        </span>
      </div>
    </div>
  );
}
