// src/pages/Courses/CourseScheduleSection.tsx
import { useState } from "react";
import { useCourse } from "../../contexts/CourseContext";
import type { IntervalDTO } from "../../api/CourseApi";

import {
  insertScheduleBlock,
  updateScheduleBlock,
  removeScheduleBlock,
  clearCourseSchedule,
} from "../../api/CourseApi";

const DAY_LABELS: Record<number, string> = {
  1: "Pzt",
  2: "Sal",
  3: "Çar",
  4: "Per",
  5: "Cum",
  6: "Cmt",
  7: "Paz",
};

export default function CourseScheduleSection() {
  const { course, schedule, refreshSchedule, isSchedulable } = useCourse();

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [draftDay, setDraftDay] = useState<number>(1);
  const [draftStart, setDraftStart] = useState<string>("09:00");
  const [draftEnd, setDraftEnd] = useState<string>("10:00");

  // ---------------------------------------------
  // SELECT A BLOCK → load into draft form
  // ---------------------------------------------
  const beginEdit = (day: number, block: IntervalDTO) => {
    setEditingId(block.id!);
    setDraftDay(day);
    setDraftStart(block.start_time.slice(0, 5));
    setDraftEnd(block.end_time.slice(0, 5));
  };

  // ---------------------------------------------
  // CREATE or UPDATE
  // ---------------------------------------------
  const saveBlock = async () => {
    if (!course?.course_id) return;

    if (!draftStart || !draftEnd) {
      alert("Saat boş olamaz.");
      return;
    }

    if (editingId === null) {
      // CREATE
      await insertScheduleBlock({
        course_id: course.course_id,
        day_of_week: draftDay,
        start_time: draftStart,
        end_time: draftEnd,
      });
    } else {
      // UPDATE
      await updateScheduleBlock({
        course_id: course.course_id,
        schedule_id: editingId,
        new_day_of_week: draftDay,
        new_start_time: draftStart,
        new_end_time: draftEnd,
      });
    }

    await refreshSchedule();
    resetEditor();
  };

  const resetEditor = () => {
    setEditingId(null);
    setDraftDay(1);
    setDraftStart("09:00");
    setDraftEnd("10:00");
  };

  // ---------------------------------------------
  // DELETE
  // ---------------------------------------------
  const deleteBlock = async (block: IntervalDTO) => {
    if (!course?.course_id) return;

    await removeScheduleBlock({
      course_id: course.course_id,
      schedule_id: block.id!,
    });

    await refreshSchedule();

    if (editingId === block.id) {
      resetEditor();
    }
  };

  // ---------------------------------------------
  // CLEAR WHOLE SCHEDULE
  // ---------------------------------------------
  const clearAll = async () => {
    if (!course?.course_id) return;
    if (!confirm("Tüm programı silmek istiyor musunuz?")) return;

    await clearCourseSchedule({ course_id: course.course_id });
    await refreshSchedule();
    resetEditor();
  };

  return (
    <div className="course-section">
      <div className="section-header">
        <h2>Ders Programı</h2>

         <div className="syllabus-actions-top">
            {isSchedulable && (
              <button className="edit-btn" onClick={() => setIsEditing(x => !x)}>
                {isEditing ? "Görünüm Modu" : "Programı Düzenle"}
              </button>
            )}

            {isEditing && (
              <button className="delete-btn" onClick={clearAll}>Programı Temizle</button>
            )}

         </div>


      </div>

      {/* -----------------------------------------
         EDITOR PANEL (visible only in edit mode)
      ------------------------------------------ */}
      {isEditing && (
        <div className="schedule-editor-panel">
          <h3>{editingId ? "Dersi Düzenle" : "Yeni Ders Ekle"}</h3>

          <div className="schedule-editor-row">
            <label>
              Gün
              <select value={draftDay} onChange={(e) => setDraftDay(Number(e.target.value))}>
                {Object.entries(DAY_LABELS).map(([d, name]) => (
                  <option key={d} value={d}>{name}</option>
                ))}
              </select>
            </label>

            <label>
              Başlangıç
              <input
                type="time"
                value={draftStart}
                onChange={(e) => setDraftStart(e.target.value)}
              />
            </label>

            <label>
              Bitiş
              <input
                type="time"
                value={draftEnd}
                onChange={(e) => setDraftEnd(e.target.value)}
              />
            </label>

            <button className="primary-btn" onClick={saveBlock}>
              {editingId ? "Güncelle" : "Ekle"}
            </button>

            {editingId && (
              <button className="secondary-btn" onClick={resetEditor}>
                İptal
              </button>
            )}
          </div>
        </div>
      )}

      {/* -----------------------------------------
          GRID OF DAYS
      ------------------------------------------ */}
      {!schedule ? (
        <div>Yükleniyor...</div>
      ) : (
        <div className="schedule-grid">
          {([1, 2, 3, 4, 5, 6, 7] as const).map((day) => {
            const blocks = schedule.busy[day] ?? [];

            return (
              <div key={day} className="schedule-day">
                <h4>{DAY_LABELS[day]}</h4>

                {blocks.length === 0 ? (
                  <p className="empty">Boş</p>
                ) : (
                  blocks.map((block) => (
                    <div
                      key={block.id}
                      className={`schedule-block ${editingId === block.id ? "active-edit" : ""}`}
                    >
                      <span>{block.start_time.slice(0, 5)} – {block.end_time.slice(0, 5)}</span>

                      {isEditing && (
                        <div className="schedule-actions">
                          <button
                            className="icon-btn edit"
                            onClick={() => beginEdit(day, block)}
                            title="Düzenle"
                          >
                            ✏️
                          </button>

                          <button
                            className="icon-btn delete"
                            onClick={() => deleteBlock(block)}
                            title="Sil"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}


              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
