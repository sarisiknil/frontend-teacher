import { useState } from "react";

import "./course-announcements.css";
import { useAnnouncement } from "../../contexts/Announcements/useAnnouncement";

export default function AnnouncementEditorModal({
  courseId,
  announcement,
  onClose,
}: {
  courseId: string;
  announcement: any | null;
  onClose: () => void;
}) {
 

  const { createAnnouncement, updateAnnouncement } = useAnnouncement();

  const [title, setTitle] = useState(announcement?.title ?? "");
  const [body, setBody] = useState(announcement?.body ?? "");
  const [isPinned, setIsPinned] = useState(announcement?.is_pinned ?? false);

  async function handleSave() {
    if (!title.trim()) return;

    if (announcement) {
      await updateAnnouncement(announcement.announcement_id, {
        title,
        body,
        is_pinned: isPinned,
      });
    } else {
      await createAnnouncement({
        course_id: courseId,
        title,
        body,
        is_pinned: isPinned,
      });
    }

    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{announcement ? "Anons Düzenle" : "Yeni Anons"}</h3>

        <input
          placeholder="Başlık"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Anons içeriği"
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />

        <label className="checkbox">
          <input
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
          />
          Sabitle
        </label>

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            Vazgeç
          </button>
          <button className="primary-btn" onClick={handleSave}>
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
