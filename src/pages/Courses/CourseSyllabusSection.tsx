// src/pages/Courses/CourseSyllabusSection.tsx
import { useEffect, useMemo, useState } from "react";
import { useCourse } from "../../contexts/CourseContext";
import {
  readChildUnits,
  readChildSubunits,
  insertSyllabusItem,
  removeSyllabusItem,
  moveSyllabusItem,
  readChildOutcomes,
} from "../../api/CourseApi";

import type {
  CourseSyllabusRow,
  Units,
  SubUnits,
  Outcomes
} from "../../api/CourseApi";
import "./course.css";

// ---------------------------------------------------------------------------
// HELPER TYPES & FUNCTIONS
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// SUB-COMPONENT: Unit & Subunit Picker (Isolates state per week)
// ---------------------------------------------------------------------------
interface SyllabusUnitPickerProps {
  week: number;
  allUnits: Units[];
  courseId: string;
  onRefresh: () => Promise<void>;
}

function SyllabusUnitPicker({ week, allUnits, courseId, onRefresh }: SyllabusUnitPickerProps) {
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [subunits, setSubunits] = useState<SubUnits[]>([]);
  const [loadingSubunits, setLoadingSubunits] = useState(false);
  const [selectedSubunitsIds, setSelectedSubunitsIds] = useState<string[]>([]);

  // Load subunits when a Unit is clicked
  const handleUnitClick = async (unitId: string) => {
    if (selectedUnitId === unitId) return; // Already selected
    setSelectedUnitId(unitId);
    setSelectedSubunitsIds([]); // Reset subunits for this week only
    setSubunits([]);
    
    try {
      setLoadingSubunits(true);
      const res = await readChildSubunits([unitId]);
      setSubunits(res.items);
    } catch (error: any) {
      alert("Alt konular yüklenirken hata oluştu: " + error.message);
    } finally {
      setLoadingSubunits(false);
    }
  };

  const toggleSubunit = (id: string) => {
    setSelectedSubunitsIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAddSelected = async () => {
    if (selectedSubunitsIds.length === 0) {
      alert("Lütfen en az bir konu seçiniz.");
      return;
    }

    try {
      for (const subunitId of selectedSubunitsIds) {
        await insertSyllabusItem({
          course_id: courseId,
          subunit_id: subunitId,
          target_week: week,
          order_index: null,
        });
      }
      // Reset selection after success
      setSelectedSubunitsIds([]);
      await onRefresh();
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.message;
      alert("Ekleme başarısız: " + msg);
    }
  };

  const handleAddWholeUnit = async () => {
    if (!selectedUnitId) return;
    if (!confirm("Bu ünitedeki TÜM konuları eklemek istediğinize emin misiniz?")) return;

    try {
      // If subunits aren't loaded yet, we must load them first, but usually they are loaded by click.
      // We use the 'subunits' state which should be populated.
      if (subunits.length === 0) {
        alert("Bu ünitede eklenecek konu bulunamadı.");
        return;
      }

      for (const s of subunits) {
        await insertSyllabusItem({
          course_id: courseId,
          subunit_id: s.id,
          target_week: week,
          order_index: null,
        });
      }
      setSelectedSubunitsIds([]);
      await onRefresh();
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.message;
      alert("Toplu ekleme başarısız: " + msg);
    }
  };

  return (
    <>
      {/* COLUMN 1: UNIT LIST */}
      <div className="syllabus-col">
        <h4>Ünite Seç</h4>
        <div className="unit-list">
          {allUnits.map((u) => (
            <div
              key={u.id}
              className={`unit-item ${selectedUnitId === u.id ? "active" : ""}`}
              onClick={() => handleUnitClick(u.id)}
            >
              {u.code ? `${u.code} — ` : ""} {u.name}
            </div>
          ))}
        </div>
      </div>

      {/* COLUMN 2: SUBUNIT LIST */}
      <div className="syllabus-col">
        <h4>Konu / Kazanım Seç</h4>
        {loadingSubunits ? (
          <p>Yükleniyor...</p>
        ) : !selectedUnitId ? (
          <p className="hint-text">Soldan bir ünite seçiniz.</p>
        ) : (
          <>
             {subunits.length === 0 ? (
               <p className="hint-text">Bu üniteye ait konu yok.</p>
             ) : (
               <div className="subunit-list">
                 {subunits.map((s) => (
                   <div
                     key={s.id}
                     className={`subunit-item ${selectedSubunitsIds.includes(s.id) ? "selected" : ""}`}
                     onClick={() => toggleSubunit(s.id)}
                     onDoubleClick={async () => {
                       // Double click = quick add single
                       try {
                         await insertSyllabusItem({
                           course_id: courseId,
                           subunit_id: s.id,
                           target_week: week,
                           order_index: null,
                         });
                         await onRefresh();
                       } catch(err:any) {
                         alert(err.response?.data?.detail);
                       }
                     }}
                     title="Çift tıklayarak tek ekle"
                   >
                     {s.code ? `${s.code} — ` : ""} {s.name}
                   </div>
                 ))}
               </div>
             )}
             
             <div style={{marginTop: '10px', display:'flex', gap:'10px', flexDirection:'column'}}>
                <button
                  className="primary-btn add-week-btn"
                  disabled={selectedSubunitsIds.length === 0}
                  onClick={handleAddSelected}
                >
                  Seçilenleri Ekle ({selectedSubunitsIds.length})
                </button>
                
                <button 
                  className="secondary-btn"
                  style={{fontSize:'0.8rem'}}
                  onClick={handleAddWholeUnit}
                >
                  Tüm Üniteyi Ekle
                </button>
             </div>
          </>
        )}
      </div>
    </>
  );
}


// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
export default function CourseSyllabusSection() {
  const { syllabus, course, refreshSyllabus } = useCourse();
  const [isEditable, setIsEditable] = useState(false);

  // States
  const [weeksCount, setWeeksCount] = useState<number | null>(null);
  const [isSelectingWeeks, setIsSelectingWeeks] = useState(false);
  const [hasSavedWeeks, setHasSavedWeeks] = useState(false);

  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([]);
  const [rows, setRows] = useState<CourseSyllabusRow[]>([]);
  const [units, setUnits] = useState<Units[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  // Tree View States (Outcomes)
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [expandedSubunits, setExpandedSubunits] = useState<Set<string>>(new Set());
  const [outcomesMap, setOutcomesMap] = useState<Record<string, Outcomes[]>>({});

  // ---------------------------------------------------------------------------
  // INITIAL LOAD
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
      console.log(loadingUnits);
    }
  }, [syllabus]);

  // Load units once (Global List)
  useEffect(() => {
    if (!course?.course_subbranch?.id) return;
    if (units.length > 0) return;

    const fetchUnits = async () => {
      try {
        setLoadingUnits(true);
        const res = await readChildUnits([course.course_subbranch!.id]);
        setUnits(res.items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingUnits(false);
      }
    };
    fetchUnits();
  }, [course, units.length]);

  const groups: WeekGroup[] = useMemo(() => groupByWeek(rows), [rows]);
  const weeksArray = weeksCount && weeksCount > 0
    ? Array.from({ length: weeksCount }, (_, i) => i + 1)
    : [];

  // ---------------------------------------------------------------------------
  // ACTIONS
  // ---------------------------------------------------------------------------
  const openAddSyllabus = () => {
    setWeeksCount(null);
    setIsSelectingWeeks(true);
  };

  const saveWeeks = () => {
    if (!weeksCount || weeksCount < 1) {
      alert("Hafta sayısı en az 1 olmalıdır.");
      return;
    }
    // Set default open state
    setExpandedWeeks([1]);
    setHasSavedWeeks(true);
    setIsSelectingWeeks(false);
  };

  const addWeek = () => {
    setWeeksCount((prev) => (prev ?? 0) + 1);
    setHasSavedWeeks(true); 
  }

  const deleteWeek = async (weekToDelete: number) => {
    if (!syllabus) return;
    if (!confirm(`${weekToDelete}. haftayı ve içindeki tüm içerikleri silmek istediğinize emin misiniz?`)) return;

    try {
      const rowsInWeek = rows.filter(r => r.target_week === weekToDelete);

      // 1. Delete items in this week
      for (const r of rowsInWeek) {
        await removeSyllabusItem({
          course_id: syllabus.course_id,
          syllabus_id: r.id
        });
      }

      // 2. Shift subsequent weeks
      const toShift = rows.filter(r => r.target_week > weekToDelete);
      for (const r of toShift) {
        await moveSyllabusItem({
          course_id: syllabus.course_id,
          syllabus_id: r.id,
          new_week: r.target_week - 1,
          new_order_index: r.order_index
        });
      }

      setWeeksCount(prev => (prev && prev > 1) ? prev - 1 : null);
      await refreshSyllabus();
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message;
      alert("Hafta silinirken hata oluştu: " + msg);
    }
  }

  const deleteRow = async (row: CourseSyllabusRow) => {
    if (!syllabus) return;
    if (!confirm("Bu içeriği silmek istediğinize emin misiniz?")) return;

    try {
      await removeSyllabusItem({
        course_id: syllabus.course_id,
        syllabus_id: row.id,
      });
      await refreshSyllabus();
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message;
      alert("Silme başarısız: " + msg);
    }
  };

  const moveRow = async (week: number, rowId: string, direction: "up" | "down") => {
    if (!syllabus) return;

    const weekRows = rows
      .filter((r) => r.target_week === week)
      .sort((a, b) => a.order_index - b.order_index);

    const index = weekRows.findIndex((r) => r.id === rowId);
    if (index === -1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= weekRows.length) return;

    try {
      // Backend expects 1-based index usually, or just order swap. 
      // Assuming simple update order index:
      await moveSyllabusItem({
        course_id: syllabus.course_id,
        syllabus_id: rowId,
        new_week: week,
        new_order_index: newIndex + 1, // +1 because usually DB is 1-based, or logic depends on backend
      });
      await refreshSyllabus();
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message;
      alert("Taşıma hatası: " + msg);
    }
  };

  const moveRowToAnotherWeek = async (row: CourseSyllabusRow, newWeek: number) => {
    if (!syllabus) return;
    if (newWeek === row.target_week) return;

    // Put it at the end of the new week
    const targetWeekRows = rows.filter((r) => r.target_week === newWeek);
    const newIndex = targetWeekRows.length + 1;

    try {
      await moveSyllabusItem({
        course_id: syllabus.course_id,
        syllabus_id: row.id,
        new_week: newWeek,
        new_order_index: newIndex,
      });
      await refreshSyllabus();
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message;
      alert("Hafta değiştirme hatası: " + msg);
    }
  };

  const deleteWholeSyllabus = async () => {
    if (!syllabus) return;
    if (!confirm("DİKKAT: Tüm müfredat silinecek. Onaylıyor musunuz?")) return;

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
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message;
      alert("Sıfırlama hatası: " + msg);
    }
  };

  // ---------------------------------------------------------------------------
  // VIEW MODE HELPERS (TREE)
  // ---------------------------------------------------------------------------
  const loadOutcomes = async (subunitId: string) => {
    if (outcomesMap[subunitId]) return;
    try {
      const res = await readChildOutcomes([subunitId]);
      setOutcomesMap(prev => ({ ...prev, [subunitId]: res.items ?? [] }));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleWeek = (week: number) => {
    setExpandedWeeks((prev) =>
      prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week]
    );
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
        loadOutcomes(subunitId);
        next.add(subunitId);
      } else {
        next.delete(subunitId);
      }
      return next;
    });
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <div className="course-section">
      <div className="section-header">
        <h2>Ders Müfredatı</h2>

        <div className="syllabus-actions-top">
          <button className="toggle-btn" onClick={() => setIsEditable(!isEditable)}>
            {isEditable ? "Görünüm Modu" : "Düzenleme Modu"}
          </button>

          {isEditable && (
             hasSavedWeeks ? (
               <button className="edit-btn" onClick={addWeek}>Hafta Ekle</button>
             ) : (
               <button className="edit-btn primary-btn" onClick={openAddSyllabus}>Müfredat Oluştur</button>
             )
          )}

          {isEditable && hasSavedWeeks && (
            <button className="delete-btn" onClick={deleteWholeSyllabus}>
              Müfredatı Sil
            </button>
          )}
        </div>
      </div>

      {/* MODAL: WEEK COUNT */}
      {isSelectingWeeks && (
        <div className="modal-backdrop">
          <div className="modal small">
            <h3>Kurs Kaç Hafta Sürecek?</h3>
            <input
              type="number"
              min={1}
              className="week-input"
              value={weeksCount ?? ""}
              onChange={(e) => setWeeksCount(e.target.value === "" ? null : Number(e.target.value))}
            />
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setIsSelectingWeeks(false)}>İptal</button>
              <button className="primary-btn" onClick={saveWeeks}>Devam Et</button>
            </div>
          </div>
        </div>
      )}

      {/* SYLLABUS LIST */}
      {hasSavedWeeks && weeksArray.length > 0 && (
        <div className="syllabus-list">
          {weeksArray.map((week) => {
            const weekGroup = groups.find((g) => g.week === week);
            const weekItems = weekGroup?.items ?? [];

            // Group items by Unit for View Mode
            const itemsByUnit = weekItems.reduce(
              (acc: Record<string, { label: string; rows: CourseSyllabusRow[] }>, row) => {
                const unitId = row.subunit?.parent_unit_id ?? "unknown";
                if (!acc[unitId]) {
                  const unit = units.find((u) => u.id === unitId);
                  const label = unit ? `${unit.code ?? ""} ${unit.code && "—"} ${unit.name}` : "Ünite Bilinmiyor";
                  acc[unitId] = { label, rows: [] };
                }
                acc[unitId].rows.push(row);
                return acc;
              }, {}
            );

            return (
              <div key={week} className="syllabus-week">
                <div className="syllabus-week-header" onClick={() => toggleWeek(week)}>
                  <strong>{week}. Hafta</strong>
                  <div className="week-header-right">
                    <span className="expand-icon">{expandedWeeks.includes(week) ? "▲" : "▼"}</span>
                    {isEditable && (
                      <button className="week-delete-btn" onClick={(e) => { e.stopPropagation(); deleteWeek(week); }}>
                        Haftayı Sil
                      </button>
                    )}
                  </div>
                </div>

                {expandedWeeks.includes(week) && (
                  <div className={`syllabus-grid ${isEditable ? "edit-mode" : "view-mode"}`}>
                    
                    {/* EDIT MODE: PICKERS (Isolated Component) */}
                    {isEditable && course && (
                      <SyllabusUnitPicker 
                        week={week}
                        allUnits={units}
                        courseId={course.course_id}
                        onRefresh={refreshSyllabus}
                      />
                    )}

                    {/* EXISTING ITEMS LIST */}
                    <div className="syllabus-col">
                      <h4>Bu Haftanın Dersleri</h4>

                      {/* Iterate grouped items */}
                      {Object.entries(itemsByUnit).map(([unitId, groupData]) => {
                        const isUnitOpen = expandedUnits.has(unitId);

                        return (
                          <div key={unitId} className="unit-group">
                            {/* Unit Header */}
                            <h5 className="unit-group-title" onClick={() => !isEditable && toggleUnit(unitId)}>
                              {isEditable ? groupData.label : (
                                <>{groupData.label} <span className="collapse-icon">{isUnitOpen ? "▾" : "▸"}</span></>
                              )}
                            </h5>

                            {/* List items (EDIT MODE) */}
                            {isEditable && groupData.rows.map((row) => (
                                <div key={row.id} className="syllabus-item">
                                  <span>{row.subunit ? `${row.subunit.code} — ${row.subunit.name}` : "Silinmiş"}</span>
                                  <div className="syllabus-actions">
                                    <button className="move-btn" onClick={() => moveRow(week, row.id, "up")}>↑</button>
                                    <button className="move-btn" onClick={() => moveRow(week, row.id, "down")}>↓</button>
                                    {weeksArray.length > 1 && (
                                      <select
                                        value={row.target_week}
                                        onChange={(e) => moveRowToAnotherWeek(row, Number(e.target.value))}
                                        className="week-move-select"
                                      >
                                        {weeksArray.map((w) => <option key={w} value={w}>{w}</option>)}
                                      </select>
                                    )}
                                    <button className="remove-btn" onClick={() => deleteRow(row)}>Sil</button>
                                  </div>
                                </div>
                            ))}

                            {/* List items (VIEW MODE - TREE) */}
                            {!isEditable && isUnitOpen && (
                              <div className="view-subunits-tree">
                                {groupData.rows.map((row) => {
                                  const subunit = row.subunit;
                                  if (!subunit) return null;
                                  const isSubOpen = expandedSubunits.has(subunit.id);
                                  const outcomes = outcomesMap[subunit.id] ?? [];

                                  return (
                                    <div key={row.id} className="subunit-tree-block">
                                      <div className="subunit-tree-header" onClick={() => toggleSubunit(subunit.id)}>
                                        <span>{subunit.code} — {subunit.name}</span>
                                        <span className="collapse-icon">{isSubOpen ? "▾" : "▸"}</span>
                                      </div>
                                      {isSubOpen && (
                                        <ul className="outcomes-list">
                                          {outcomes.length === 0 && <li className="outcome-empty">Kazanım yok.</li>}
                                          {outcomes.map((o) => (
                                            <li key={o.id} className="outcome-item"><strong>{o.code}</strong> {o.description}</li>
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

                      {weekItems.length === 0 && (
                        <p className="empty-week-text">Bu haftaya ders eklenmedi.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* EMPTY STATE */}
      {!hasSavedWeeks && (!syllabus || syllabus.items.length === 0) && (
        <div style={{ textAlign: "center", marginTop: "20px", color: "#666" }}>
          <p style={{ marginBottom: "10px" }}>Henüz müfredat oluşturulmamış.</p>
          {isEditable && (
            <button className="primary-btn" onClick={openAddSyllabus}>
              Müfredat Oluşturmaya Başla
            </button>
          )}
        </div>
      )}
    </div>
  );
}