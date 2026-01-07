import { useEffect, useState } from "react";

import "./course-announcements.css";
import { useCourse } from "../../contexts/CourseContext";
import { useAnnouncement } from "../../contexts/Announcements/useAnnouncement";
import AnnouncementEditorModal from "./AnnouncementEditorModal";

export default function CourseAnnouncementsTab() {
  const { course } = useCourse();
  const {
    fetchCourseAnnouncements,
    getCourseAnnouncementsLocal,
    deleteAnnouncement,
    loading,
  } = useAnnouncement();
  
  
  
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  

  const courseId = course!.course_id;
  const announcements = getCourseAnnouncementsLocal(courseId) ?? [];

  useEffect(() => {
    fetchCourseAnnouncements(courseId);
  }, [courseId]);

  return (
    <div className="announcements-page">
      <div className="announcements-header">
        <h2>Anonslarım</h2>
        <button
          className="primary-btn"
          onClick={() => {
            setEditing(null);
            setEditorOpen(true);
          }}
        >
          + Yeni Anons
        </button>
      </div>

      {loading && <div className="loading">Yükleniyor...</div>}

      {announcements.length === 0 && !loading && (
        <div className="empty">Henüz anons eklenmedi.</div>
      )}

      <div className="announcement-list">
        {announcements.map((a) => (
          <div
            key={a.announcement_id}
            className={`announcement-card ${a.is_pinned ? "pinned" : ""}`}
          >
            <div className="announcement-top">
              <h3>{a.title}</h3>
              {a.is_pinned && <span className="pin">📌 Sabit</span>}
            </div>

            <p className="announcement-body">{a.body}</p>

            <div className="announcement-footer">
              <span>
                {new Date(a.created_at).toLocaleString("tr-TR")}
              </span>

              <div className="actions">
                <button
                  className="secondary-btn"
                  onClick={() => {
                    setEditing(a);
                    setEditorOpen(true);
                  }}
                >
                  Düzenle
                </button>

                <button
                  className="danger-btn"
                  onClick={() =>
                    deleteAnnouncement(a.announcement_id, courseId)
                  }
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editorOpen && (
        <AnnouncementEditorModal
          courseId={courseId}
          announcement={editing}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  );
}
