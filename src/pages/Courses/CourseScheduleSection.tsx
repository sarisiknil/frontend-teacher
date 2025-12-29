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

const TIME_SLOTS: string[] = [];
for (let h = 0; h < 24; h++) {
  const hour = h.toString().padStart(2, "0");
  TIME_SLOTS.push(`${hour}:00`);
  TIME_SLOTS.push(`${hour}:15`);
  TIME_SLOTS.push(`${hour}:30`);
  
  
  TIME_SLOTS.push(`${hour}:50`);
}

export default function CourseScheduleSection() {
  const { course, schedule, refreshSchedule, isSchedulable } = useCourse();

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- Form States ---
  const [draftDay, setDraftDay] = useState<number>(1);
  const [draftStart, setDraftStart] = useState<string>("09:00");
  const [draftEnd, setDraftEnd] = useState<string>("10:00");

  // --------------------------------------------------
  // BUSINESS ERROR HANDLER (code !== 200)
  // --------------------------------------------------
  const handleBusinessErrors = (res: any): boolean => {
    if (res?.code === 422 && Array.isArray(res.errors)) {
      const { detail } = res.errors[0];

      if (detail === "SCHEDULE_OVERLAP") {
        alert(
          "⚠️ PROGRAM ÇAKIŞMASI\n\n" +
          "Seçtiğiniz saat aralığı, öğretmenin başka bir dersinin programı ile çakışıyor.\n\n" +
          "Lütfen farklı bir gün veya saat seçin."
        );
        return true;
      }

      alert(
        "⚠️ Geçersiz İşlem\n\n" +
        (detail || "Girilen bilgiler doğrulanamadı.")
      );
      return true;
    }

    return false;
  };

  // --------------------------------------------------
  // EDIT ACTIONS
  // --------------------------------------------------
  const beginEdit = (day: number, block: IntervalDTO) => {
    setEditingId(block.id!);
    setDraftDay(day);
    setDraftStart(block.start_time.slice(0, 5));
    setDraftEnd(block.end_time.slice(0, 5));
  };

  const resetEditor = () => {
    setEditingId(null);
    setDraftDay(1);
    setDraftStart("09:00");
    setDraftEnd("10:00");
  };

  // --------------------------------------------------
  // SAVE (INSERT / UPDATE)
  // --------------------------------------------------
  const saveBlock = async () => {
    if (!course?.course_id) return;

    // Basic client validation
    if (draftEnd <= draftStart) {
      alert("⚠️ Hata: Bitiş saati, başlangıç saatinden sonra olmalıdır.");
      return;
    }

    try {
      const res =
        editingId === null
          ? await insertScheduleBlock({
              course_id: course.course_id,
              day_of_week: draftDay,
              start_time: draftStart,
              end_time: draftEnd,
            })
          : await updateScheduleBlock({
              course_id: course.course_id,
              schedule_id: editingId,
              new_day_of_week: draftDay,
              new_start_time: draftStart,
              new_end_time: draftEnd,
            });

      // ✅ HANDLE BACKEND VALIDATION ERRORS
      if (handleBusinessErrors(res)) return;

      await refreshSchedule();
      resetEditor();

    } catch (error) {
      console.error(error);
      alert("❌ Sunucu hatası. Lütfen tekrar deneyin.");
    }
  };

  // --------------------------------------------------
  // DELETE SINGLE BLOCK
  // --------------------------------------------------
  const deleteBlock = async (block: IntervalDTO) => {
    if (!course?.course_id) return;
    if (!confirm("Bu saati silmek istediğinize emin misiniz?")) return;

    try {
      const res = await removeScheduleBlock({
        course_id: course.course_id,
        schedule_id: block.id!,
      });

      if (handleBusinessErrors(res)) return;

      await refreshSchedule();
      if (editingId === block.id) resetEditor();

    } catch (error) {
      console.error(error);
      alert("❌ Silme işlemi başarısız.");
    }
  };

  // --------------------------------------------------
  // CLEAR ALL
  // --------------------------------------------------
  const clearAll = async () => {
    if (!course?.course_id) return;
    if (!confirm("DİKKAT: Tüm haftalık program silinecek. Emin misiniz?")) return;

    try {
      const res = await clearCourseSchedule({ course_id: course.course_id });

      if (handleBusinessErrors(res)) return;

      await refreshSchedule();
      resetEditor();

    } catch (error) {
      console.error(error);
      alert("❌ Program temizlenemedi.");
    }
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  return (
    <div className="course-section">
      <div className="section-header">
        <h2>Ders Programı</h2>
        <div className="syllabus-actions-top">
          {isSchedulable && (
            <button className="edit-btn" onClick={() => setIsEditing((x) => !x)}>
              {isEditing ? "Görünüm Modu" : "Programı Düzenle"}
            </button>
          )}
          {isEditing && (
            <button className="delete-btn" onClick={clearAll}>
              Temizle
            </button>
          )}
        </div>
      </div>

      {/* EDITOR */}
      {isEditing && (
        <div className="schedule-editor-panel">
          <h3>{editingId ? "Kaydı Düzenle" : "Yeni Kayıt Ekle"}</h3>

          <div className="schedule-editor-row" style={{ gap: 15, flexWrap: "wrap" }}>
            <select value={draftDay} onChange={(e) => setDraftDay(Number(e.target.value))}>
              {Object.entries(DAY_LABELS).map(([d, name]) => (
                <option key={d} value={d}>{name}</option>
              ))}
            </select>

            <select value={draftStart} onChange={(e) => setDraftStart(e.target.value)}>
              {TIME_SLOTS.map((t) => <option key={t}>{t}</option>)}
            </select>

            <select value={draftEnd} onChange={(e) => setDraftEnd(e.target.value)}>
              {TIME_SLOTS.map((t) => <option key={t}>{t}</option>)}
            </select>

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

      {/* GRID */}
      {!schedule ? (
        <div className="loading-state">Program yükleniyor...</div>
      ) : (
        <div className="schedule-grid">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const blocks = schedule.busy[day] ?? [];
            return (
              <div key={day} className="schedule-day">
                <h4>{DAY_LABELS[day]}</h4>

                {blocks.length === 0 ? (
                  <p className="empty">Boş</p>
                ) : (
                  blocks.map((block) => (
                    <div key={block.id} className="schedule-block">
                      <span>
                        {block.start_time.slice(0, 5)} – {block.end_time.slice(0, 5)}
                      </span>

                      {isEditing && (
                        <div className="schedule-actions">
                          <button onClick={() => beginEdit(day, block)}>✏️</button>
                          <button onClick={() => deleteBlock(block)}>🗑️</button>
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
