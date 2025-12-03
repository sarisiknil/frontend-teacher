// src/pages/Courses/CourseSyllabusSection.tsx
import { useMemo, useState } from "react";
import { useCourse } from "../../contexts/CourseContext";
import type { CourseSyllabusRow } from "../../api/CourseApi";

type WeekGroup = {
  week: number;
  items: CourseSyllabusRow[];
};

function groupByWeek(items: CourseSyllabusRow[]): WeekGroup[] {
  const map = new Map<number, CourseSyllabusRow[]>();

  items.forEach((row) => {
    const list = map.get(row.target_week) ?? [];
    list.push(row);
    map.set(row.target_week, list);
  });

  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([week, list]) => ({
      week,
      items: [...list].sort((a, b) => a.order_index - b.order_index),
    }));
}

export default function CourseSyllabusSection() {
  const { syllabus, isEditable, removeSyllabus } = useCourse();
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([]);

  const groups: WeekGroup[] = useMemo(
    () => (syllabus ? groupByWeek(syllabus.items) : []),
    [syllabus]
  );

  const toggleWeek = (week: number) => {
    setExpandedWeeks((prev) =>
      prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week]
    );
  };

  if (!syllabus) {
    return (
      <div className="course-section">
        <div className="section-header">
          <h2>Ders Müfredatı</h2>
        </div>
        <p>Bu kurs için henüz müfredat eklenmemiş.</p>
      </div>
    );
  }

  return (
    <div className="course-section">
      <div className="section-header">
        <h2>Ders Müfredatı</h2>
        {isEditable && <button className="edit-btn">Müfredat Ekle</button>}
      </div>

      <div className="syllabus-list">
        {groups.map(({ week, items }) => (
          <div key={week} className="syllabus-week">
            <div
              className="syllabus-week-header"
              onClick={() => toggleWeek(week)}
            >
              <span>{week}. Hafta</span>
              <span>{expandedWeeks.includes(week) ? "▲" : "▼"}</span>
            </div>

            {expandedWeeks.includes(week) && (
              <div className="syllabus-items">
                {items.map((row) => (
                  <div key={row.id} className="syllabus-item">
                    <span>
                      {row.subunit?.name ?? "Başlık yok"}
                      {" · "}
                      {row.subunit?.branch}
                    </span>

                    {isEditable && (
                      <button
                        className="remove-btn"
                        onClick={() =>
                          removeSyllabus({
                            course_id: syllabus.course_id, // ✅ zorunlu field
                            syllabus_id: row.id,
                          })
                        }
                      >
                        Sil
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
