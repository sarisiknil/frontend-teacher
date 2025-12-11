// src/pages/Courses/CourseSyllabusSection.tsx
import { useEffect, useMemo, useState } from "react";
import { useCourse } from "../../contexts/CourseContext";
import {
  readChildUnits,
  readChildSubunits,
  insertSyllabusItem,
  removeSyllabusItem,
  orderSyllabusWeek,
  moveSyllabusItem,
} from "../../api/CourseApi";

import type {
  CourseSyllabusRow,
  Units,
  SubUnits,
  Outcomes
} from "../../api/CourseApi";
import { readChildOutcomes } from "../../api/CourseApi";
import "./course.css";

type WeekGroup = {
  week: number;
  items: CourseSyllabusRow[];
};

function groupByWeek(items: CourseSyllabusRow[]): WeekGroup[] {
  const map = new Map<number, CourseSyllabusRow[]>();

  items.forEach((row) => {
    const arr = map.get(row.target_week) ?? [];
    arr.push(row);
    map.set(row.target_week, arr);
  });

  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([week, list]) => ({
      week,
      items: [...list].sort((a, b) => a.order_index - b.order_index),
    }));
}

export default function CourseSyllabusSection() {
  const { syllabus, course, refreshSyllabus } = useCourse();
  const [isEditable, setIsEditable] = useState(false);

  // UX PHASE STATES
  const [weeksCount, setWeeksCount] = useState<number | null>(null);
  const [isSelectingWeeks, setIsSelectingWeeks] = useState(false);
  const [hasSavedWeeks, setHasSavedWeeks] = useState(false);

  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([]);
  const [rows, setRows] = useState<CourseSyllabusRow[]>([]);

  // For selecting content:
  const [units, setUnits] = useState<Units[]>([]);
  const [subunits, setSubunits] = useState<SubUnits[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedSubunitsIds, setSelectedSubunitsIds] = useState<string[]>([]);

  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingSubunits, setLoadingSubunits] = useState(false);
  // Outcomes & expanded structure
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [expandedSubunits, setExpandedSubunits] = useState<Set<string>>(new Set());

  // Cached outcomes per subunit
  const [outcomesMap, setOutcomesMap] = useState<Record<string, Outcomes[]>>({});


  // ---------------------------------------------------------------------------
  // INITIAL LOAD: if syllabus exists, show it immediately (no "empty until edit")
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!syllabus) {
      setRows([]);
      setWeeksCount(null);
      setHasSavedWeeks(false);
      setExpandedWeeks([]);
      return;
    }

    setRows(syllabus.items ?? []);

    if (syllabus.items && syllabus.items.length > 0) {
      const maxWeekFromData = Math.max(
        ...syllabus.items.map((r) => r.target_week)
      );

      setWeeksCount((prev) => prev ?? maxWeekFromData);
      setHasSavedWeeks(true);

      const firstWeek = syllabus.items[0].target_week;
      setExpandedWeeks((prev) =>
        prev.length === 0 ? [firstWeek] : prev
      );
    }
  }, [syllabus]);

  // Load units once when course/subbranch is known
  useEffect(() => {
    if (!course?.course_subbranch?.id) return;
    if (units.length > 0) return;

    void loadUnits(course.course_subbranch.id);
  }, [course, units.length]);

  const groups: WeekGroup[] = useMemo(() => groupByWeek(rows), [rows]);

  const openAddSyllabus = () => {
    setWeeksCount(null);
    setIsSelectingWeeks(true);
  };

  const saveWeeks = () => {
    if (!weeksCount || weeksCount < 1) {
      alert("Hafta sayısı en az 1 olmalıdır.");
      return;
    }

    // Only first week open by default
    setExpandedWeeks([1]);
    setHasSavedWeeks(true);
    setIsSelectingWeeks(false);

    if (course?.course_subbranch?.id) {
      void loadUnits(course.course_subbranch.id);
    }
  };

  const loadUnits = async (subbranchId: string) => {
    try {
      setLoadingUnits(true);
      const res = await readChildUnits([subbranchId]);
      setUnits(res.items);
    } finally {
      setLoadingUnits(false);
    }
  };

  const loadSubunits = async (unitId: string) => {
    setSelectedUnitId(unitId);
    setSelectedSubunitsIds([]);

    try {
      setLoadingSubunits(true);
      const res = await readChildSubunits([unitId]);
      setSubunits(res.items);
    } finally {
      setLoadingSubunits(false);
    }
  };

  const addSelectedToWeek = async (week: number) => {
    if (!syllabus) return;

    if (selectedSubunitsIds.length === 0) {
      alert("Eklemek için en az 1 konu seçin.");
      return;
    }

    try {
      for (const subunitId of selectedSubunitsIds) {
        await insertSyllabusItem({
          course_id: syllabus.course_id,
          subunit_id: subunitId,
          target_week: week,
          order_index: null,
        });
      }

      await refreshSyllabus();
    } catch (e) {
      console.error("addSelectedToWeek error", e);
    }
  };

  const addWholeUnitToWeek = async (week: number, unitId: string) => {
    if (!syllabus) return;

    try {
      const res = await readChildSubunits([unitId]);
      const list = res.items ?? [];

      if (list.length === 0) {
        alert("Bu üniteye bağlı konu bulunamadı.");
        return;
      }

      for (const s of list) {
        await insertSyllabusItem({
          course_id: syllabus.course_id,
          subunit_id: s.id,
          target_week: week,
          order_index: null,
        });
      }

      await refreshSyllabus();
    } catch (e) {
      console.error("addWholeUnitToWeek error", e);
    }
  };


    // --------------------------------------------
    // ADD: double-click subunit ⇒ single insert
    // --------------------------------------------
  const addSingleSubunitToWeek = async (week: number, subunitId: string) => {
    if (!syllabus) return;

    try {
      await insertSyllabusItem({
        course_id: syllabus.course_id,
        subunit_id: subunitId,
        target_week: week,
        order_index: null,
      });
      await refreshSyllabus();
    } catch (e) {
      console.error("addSingleSubunitToWeek error", e);
    }
  };


  // --------------------------------------------
  // DELETE: integrate removeSyllabusItem endpoint
  // --------------------------------------------
  const deleteRow = async (row: CourseSyllabusRow) => {
    if (!syllabus) return;
    if (!confirm("Dersi silmek istediğinize emin misiniz?")) return;

    try {
      await removeSyllabusItem({
        course_id: syllabus.course_id,
        syllabus_id: row.id,
      });

      await refreshSyllabus();
    } catch (e) {
      console.error("deleteRow error", e);
    }
  };



  const moveRow = async (
    week: number,
    rowId: string,
    direction: "up" | "down"
  ) => {
    if (!syllabus) return;

    const weekRows = rows
      .filter((r) => r.target_week === week)
      .sort((a, b) => a.order_index - b.order_index);

    const index = weekRows.findIndex((r) => r.id === rowId);
    if (index === -1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= weekRows.length) return;

    try {
      // Backend expects position in the week: use 1-based index
      await moveSyllabusItem({
        course_id: syllabus.course_id,
        syllabus_id: rowId,
        new_week: week,
        new_order_index: newIndex + 1,
      });

      await refreshSyllabus();
    } catch (e) {
      console.error("moveRow error", e);
    }
  };

  const moveRowToAnotherWeek = async (
    row: CourseSyllabusRow,
    newWeek: number
  ) => {
    if (!syllabus) return;
    if (newWeek === row.target_week) return;

    // Append at the end of the target week
    const targetWeekRows = rows.filter((r) => r.target_week === newWeek);
    const newIndex = targetWeekRows.length; // 0-based; +1 for API

    try {
      await moveSyllabusItem({
        course_id: syllabus.course_id,
        syllabus_id: row.id,
        new_week: newWeek,
        new_order_index: newIndex + 1,
      });

      await refreshSyllabus();
    } catch (e) {
      console.error("moveRowToAnotherWeek error", e);
    }
  };

  const deleteWholeSyllabus = async () => {
    if (!syllabus) return;
    if (!confirm("Tüm müfredatı silmek istediğinize emin misiniz?")) return;

    try {
      const ids = rows.map((r) => r.id);

      for (const syllabus_id of ids) {
        await removeSyllabusItem({
          course_id: syllabus.course_id,
          syllabus_id,
        });
      }

      await refreshSyllabus();

      setRows([]);
      setWeeksCount(null);
      setHasSavedWeeks(false);
      setExpandedWeeks([]);
    } catch (e) {
      console.error("deleteWholeSyllabus error", e);
    }
  };


  const toggleWeek = (week: number) => {
    setExpandedWeeks((prev) =>
      prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week]
    );
  };

  const weeksArray =
    weeksCount && weeksCount > 0
      ? Array.from({ length: weeksCount }, (_, i) => i + 1)
      : [];
  
  useEffect(() => {
    if (!syllabus) return;

    if (syllabus.items.length > 0) {
      const maxWeek = Math.max(...syllabus.items.map((r) => r.target_week));

      setWeeksCount((prev) => (prev === null ? maxWeek : prev));
      setHasSavedWeeks(true);

      // Expand first week only if nothing is expanded yet
      setExpandedWeeks((prev) => (prev.length === 0 ? [1] : prev));
    }
  }, [syllabus]);


  const addWeek = () => {
    setWeeksCount((prev) => (prev ?? 0) + 1);
  }
  const deleteWeek = async (weekToDelete: number) => {
    if (!syllabus) return;

    const rowsInWeek = rows.filter(r => r.target_week === weekToDelete);

    // Delete rows for that week
    for (const r of rowsInWeek) {
      await removeSyllabusItem({
        course_id: syllabus.course_id,
        syllabus_id: r.id
      });
    }

    // Shift weeks (week+1 → week)
    const toShift = rows.filter(r => r.target_week > weekToDelete);

    for (const r of toShift) {
      await moveSyllabusItem({
        course_id: syllabus.course_id,
        syllabus_id: r.id,
        new_week: r.target_week - 1,
        new_order_index: r.order_index
      });
    }

    setWeeksCount(prev => prev! - 1);
    await refreshSyllabus();
  }
    const loadOutcomes = async (subunitId: string) => {
    // Prevent re-fetch if already loaded
    if (outcomesMap[subunitId]) return;

    try {
      const res = await readChildOutcomes([subunitId]);
      setOutcomesMap(prev => ({
        ...prev,
        [subunitId]: res.items ?? []
      }));
    } catch (err) {
      console.error("loadOutcomes error:", err);
    }
  };
  const toggleUnit = (unitId: string) => {
    setExpandedUnits(prev => {
      const next = new Set(prev);
      next.has(unitId) ? next.delete(unitId) : next.add(unitId);
      return next;
    });
  };

  const toggleSubunit = async (subunitId: string) => {
    setExpandedSubunits(prev => {
      const next = new Set(prev);
      const willExpand = !next.has(subunitId);

      if (willExpand) {
        // Lazy-load outcomes
        loadOutcomes(subunitId);
        next.add(subunitId);
      } else {
        next.delete(subunitId);
      }

      return next;
    });
  };



  return (
    <div className="course-section">
      <div className="section-header">
        <h2>Ders Müfredatı</h2>

        <div className="syllabus-actions-top">
          <button className="toggle-btn" onClick={() => setIsEditable(!isEditable)}>
            {isEditable ? "Görünüm Modu" : "Düzenleme Modu"}
          </button>

          {isEditable && hasSavedWeeks && (
            <button className="edit-btn" onClick={addWeek}>Hafta Ekle</button>
          )}

          {isEditable && (
            <button className="delete-btn" onClick={deleteWholeSyllabus}>
              Müfredatı Sil
            </button>
          )}
        </div>
      </div>


      {/* WEEK COUNT MODAL */}
      {isSelectingWeeks && (
        <div className="modal-backdrop">
          <div className="modal small">
            <h3>Kurs Kaç Hafta Sürecek?</h3>

            <input
              type="number"
              min={1}
              className="week-input"
              value={weeksCount ?? ""}
              onChange={(e) =>
                setWeeksCount(
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
            />

            <div className="modal-footer">
              <button
                className="secondary-btn"
                onClick={() => setIsSelectingWeeks(false)}
              >
                İptal
              </button>
              <button className="primary-btn" onClick={saveWeeks}>
                Devam Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SYLLABUS CONTENT */}
      {hasSavedWeeks && weeksArray.length > 0 && (
        <div className="syllabus-list">
          {weeksArray.map((week) => {
            const weekGroup = groups.find((g) => g.week === week);
            const weekItems = weekGroup?.items ?? [];

            // Group rows by unit (using parent_unit_id + units list for label)
            const itemsByUnit = weekItems.reduce(
              (
                acc: Record<
                  string,
                  { label: string; rows: CourseSyllabusRow[] }
                >,
                row
              ) => {
                const unitId = row.subunit?.parent_unit_id
                  ? row.subunit.parent_unit_id
                  : "unknown";

                if (!acc[unitId]) {
                  const unit = units.find((u) => u.id === unitId);
                  const label = unit
                      ? `${unit.code ?? ""} ${unit.code && "—"} ${unit.name}`
                    : "Ünite Bilinmiyor";
                  acc[unitId] = { label, rows: [] };
                }

                acc[unitId].rows.push(row);
                return acc;
              },
              {}
            );

            return (
              <div key={week} className="syllabus-week">
                <div
                  className="syllabus-week-header"
                  onClick={() => toggleWeek(week)}
                >
                  <strong>{week}. Hafta</strong>

                  <div className="week-header-right">
                    <span className="expand-icon">
                      {expandedWeeks.includes(week) ? "▲" : "▼"}
                    </span>

                  {isEditable && (
                    <button
                      className="week-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteWeek(week);
                      }}
                    >
                      Haftayı Sil
                    </button>
                  )}
                  </div>
                </div>

                {expandedWeeks.includes(week) && (
                  <div className={`syllabus-grid ${isEditable ? "edit-mode" : "view-mode"}`}>

                    {/* UNIT PICKER */}
                    {isEditable && (
                      <>
                        <div className="syllabus-col">
                          <h4>Ünite Seç</h4>
                          {loadingUnits ? (
                            <p>Yükleniyor...</p>
                          ) : (
                            <div className="unit-list">
                              {units.map((u) => (
                                <div
                                  key={u.id}
                                  className={`unit-item ${
                                    selectedUnitId === u.id ? "active" : ""
                                  }`}
                                  onClick={() => loadSubunits(u.id)}
                                  onDoubleClick={() =>
                                    addWholeUnitToWeek(week, u.id)
                                  }
                                  title="Çift tıklayınca tüm konuları bu haftaya ekler"
                                >
                                  {u.code ? `${u.code} — ` : ""}
                                  {u.name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* SUBUNIT MULTI SELECT */}
                        <div className="syllabus-col">
                          <h4>Konu / Kazanım Seç</h4>

                          {loadingSubunits ? (
                            <p>Yükleniyor...</p>
                          ) : selectedUnitId == null ? (
                            <p>Önce bir ünite seçin.</p>
                          ) : (
                            <div className="subunit-list">
                              {subunits.map((s) => (
                                <div
                                  key={s.id}
                                  className={`subunit-item ${
                                    selectedSubunitsIds.includes(s.id)
                                      ? "selected"
                                      : ""
                                  }`}
                                  onClick={() => {
                                    setSelectedSubunitsIds((prev) =>
                                      prev.includes(s.id)
                                        ? prev.filter((id) => id !== s.id)
                                        : [...prev, s.id]
                                    );
                                  }}
                                  onDoubleClick={() =>
                                    addSingleSubunitToWeek(week, s.id)
                                  }
                                  title="Çift tıklayınca bu konuyu haftaya ekler"
                                >
                                  {s.code ? `${s.code} — ` : ""}
                                  {s.name}

                                </div>
                              ))}
                            </div>
                          )}

                          <button
                            className="primary-btn add-week-btn"
                            disabled={selectedSubunitsIds.length === 0}
                            onClick={() => addSelectedToWeek(week)}
                          >
                            Haftaya Ekle ({selectedSubunitsIds.length})
                          </button>
                        </div>
                      </>
                    )}

                    {/* EXISTING ITEMS */}
                    <div className="syllabus-col">
                      <h4>Bu Haftanın Dersleri</h4>

                      {Object.entries(itemsByUnit).map(
                        ([unitKey]) => (
                          <div key={unitKey} className="unit-group">


                      {Object.entries(itemsByUnit).map(([unitId, groupData]) => {
                        const isUnitOpen = expandedUnits.has(unitId);

                        return (
                          <div key={unitId} className="unit-group">

                            {/* UNIT HEADER */}
                            <h5 className="unit-group-title" onClick={() => !isEditable && toggleUnit(unitId)}>
                              {isEditable ? (
                                groupData.label
                              ) : (
                                <>
                                  {groupData.label}
                                  <span className="collapse-icon">{isUnitOpen ? "▾" : "▸"}</span>
                                </>
                              )}
                            </h5>

                            {/* When in EDIT MODE → show edit UI only */}
                            {isEditable &&
                              groupData.rows.map((row) => (
                                <div key={row.id} className="syllabus-item">
                                  <span>
                                    {row.subunit
                                      ? `${row.subunit.code} — ${row.subunit.name}`
                                      : "Silinmiş konu"}
                                  </span>

                                  <div className="syllabus-actions">
                                    <button className="move-btn" onClick={() => moveRow(week, row.id, "up")}>↑</button>
                                    <button className="move-btn" onClick={() => moveRow(week, row.id, "down")}>↓</button>

                                    {weeksArray.length > 1 && (
                                      <select
                                        value={row.target_week}
                                        onChange={(e) =>
                                          moveRowToAnotherWeek(row, Number(e.target.value))
                                        }
                                        className="week-move-select"
                                      >
                                        {weeksArray.map((w) => (
                                          <option key={w} value={w}>{w}. hafta</option>
                                        ))}
                                      </select>
                                    )}

                                    <button className="remove-btn" onClick={() => deleteRow(row)}>
                                      Sil
                                    </button>
                                  </div>
                                </div>
                              ))}

                            {/* VIEW MODE TREE */}
                            {!isEditable && isUnitOpen && (
                              <div className="view-subunits-tree">
                                {groupData.rows.map((row) => {
                                  const subunit = row.subunit;
                                  if (!subunit) return null;

                                  const isSubOpen = expandedSubunits.has(subunit.id);
                                  const outcomes = outcomesMap[subunit.id] ?? [];

                                  return (
                                    <div key={row.id} className="subunit-tree-block">
                                      {/* Subunit header */}
                                      <div className="subunit-tree-header" onClick={() => toggleSubunit(subunit.id)}>
                                        <span>{subunit.code} — {subunit.name}</span>
                                        <span className="collapse-icon">{isSubOpen ? "▾" : "▸"}</span>
                                      </div>

                                      {/* Outcomes */}
                                      {isSubOpen && (
                                        <ul className="outcomes-list">
                                          {outcomes.length === 0 && (
                                            <li className="outcome-empty">Bu konuya ait kazanım yok.</li>
                                          )}

                                          {outcomes.map((o) => (
                                            <li key={o.id} className="outcome-item">
                                              <strong>{o.code}</strong> — {o.description}
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}

                          </div>
                        )
                      )}

                      {weekItems.length === 0 && (
                        <p className="empty-week-text">
                          Bu haftaya henüz ders eklenmedi.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!hasSavedWeeks && (!syllabus || syllabus.items.length === 0) && (
        <p>Henüz müfredat oluşturulmamış.</p>
      )}
    </div>
  );

}
