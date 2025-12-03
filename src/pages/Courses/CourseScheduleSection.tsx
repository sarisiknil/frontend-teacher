// src/pages/Courses/CourseScheduleSection.tsx
import { useCourse } from "../../contexts/CourseContext";
import type { IntervalDTO } from "../../api/CourseApi";

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
  const { schedule, isSchedulable } = useCourse();

  return (
    <div className="course-section">
      <div className="section-header">
        <h2>Ders Programı</h2>
        {isSchedulable && <button className="edit-btn">Programı Düzenle</button>}
      </div>

      {!schedule ? (
        <div>Henüz program eklenmedi.</div>
      ) : (
        <div className="schedule-grid">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const blocks: IntervalDTO[] = schedule.busy[day] ?? [];
            return (
              <div key={day} className="schedule-day">
                <h4>{DAY_LABELS[day]}</h4>
                {blocks.length === 0 ? (
                  <p>Boş</p>
                ) : (
                  blocks.map((block, i) => (
                    <div
                      key={block.id ?? `${day}-${i}`}
                      className="schedule-block"
                    >
                      {block.start_time} – {block.end_time}
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
