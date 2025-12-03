import { useEffect, useState } from "react";
import { useCourse } from "../../contexts/CourseContext";
import type { CourseUpdateRequest, Level, Subbranch } from "../../api/CourseApi";
import { getLevels, readChildSubbranches } from "../../api/CourseApi";

export default function CourseInfoSection() {
  const { course, isEditable, updateCourseInfo } = useCourse();

  const [editing, setEditing] = useState(false);

  // Curriculum state
  const [levels, setLevels] = useState<Level[]>([]);
  const [levelSubbranches, setLevelSubbranches] =
    useState<Record<string, Subbranch[]>>({});
  // Local form
  const [form, setForm] = useState<CourseUpdateRequest>({
    course_name: "",
    description: "",
    price: "",
    capacity: null,
    total_lessons: null,
    level_id: null,
    subbranch_id: null,
    start_date: null,
  });

  const [original, setOriginal] = useState<CourseUpdateRequest | null>(null);

  // ---------------------------------------------------------
  // LOAD CURRICULUM (Levels + Subbranches)
  // ---------------------------------------------------------
  useEffect(() => {
    async function loadCurriculum() {
      try {
        const lvlRes = await getLevels();
        const allLevels = lvlRes.items;
        setLevels(allLevels);

        const levelIds = allLevels.map((l) => l.id);
        const sbRes = await readChildSubbranches(levelIds);

        const map: Record<string, Subbranch[]> = {};
        allLevels.forEach((lvl) => {
          map[lvl.id] = sbRes.items.filter((sb) => sb.level_id === lvl.id);
        });

        setLevelSubbranches(map);
      } catch (e) {
        console.error("Curriculum load failed", e);
      }
    }

    loadCurriculum();
  }, []);

  // ---------------------------------------------------------
  // LOAD COURSE → Fill form
  // ---------------------------------------------------------
  useEffect(() => {
    if (!course) return;

    const mapped: CourseUpdateRequest = {
      course_name: course.course_name,
      description: course.description,
      price: course.course_price,
      capacity: course.course_capacity,
      total_lessons: course.total_lessons,
      level_id: course.course_level?.id ?? "",
      subbranch_id: course.course_subbranch?.id ?? "",
      start_date: course.start_date,
      difficulty: null,
      course_type: null,
    };

    setForm(mapped);
    setOriginal(mapped);
  }, [course]);

  // ---------------------------------------------------------
  const isDirty = JSON.stringify(form) !== JSON.stringify(original);

  const updateField = (key: keyof CourseUpdateRequest, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const startEditing = () => isEditable && setEditing(true);

  const cancelEditing = () => {
    if (!isEditable) return;
    if (isDirty && !confirm("Değişiklikleri iptal etmek istediğine emin misin?")) return;

    setForm(original!);
    setEditing(false);
  };

  const save = async () => {
    await updateCourseInfo(form);
    setEditing(false);
  };

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------
  return (
    <div className="course-section">

      <div className="section-header">
        <h2>Ders Bilgileri</h2>

        {!editing && isEditable && (
          <button className="edit-btn" onClick={startEditing}>
            Düzenle
          </button>
        )}

        {editing && (
          <div className="edit-actions">
            <button className="cancel-btn" onClick={cancelEditing}>İptal</button>
            <button className="save-btn" disabled={!isDirty} onClick={save}>Kaydet</button>
          </div>
        )}
      </div>

      {/* -------------------------- VIEW MODE -------------------------- */}
      {!editing && (
        <div className="info-grid">
          <div><h4>Ders Adı</h4><p>{course?.course_name}</p></div>
          <div><h4>Açıklama</h4><p>{course?.description || "—"}</p></div>
          <div><h4>Toplam Ders</h4><p>{course?.total_lessons}</p></div>
          <div><h4>Kapasite</h4><p>{course?.course_capacity}</p></div>
          <div><h4>Fiyat</h4><p>{course?.course_price} ₺</p></div>
          <div><h4>Düzey</h4><p>{course?.course_level?.name || "—"}</p></div>
          <div><h4>Alt Branş</h4><p>{course?.course_subbranch?.name || "—"}</p></div>
          <div><h4>Başlangıç</h4><p>{course?.start_date}</p></div>
        </div>
      )}

      {/* ------------------------ EDIT MODE ------------------------ */}
      {editing && (
        <div className="info-edit-form">

          <label className="form-field">
            <span>Ders Adı</span>
            <input
              value={form.course_name ?? ""}
              onChange={(e) => updateField("course_name", e.target.value)}
            />
          </label>

          <label className="form-field">
            <span>Açıklama</span>
            <textarea
              value={form.description ?? ""}
              onChange={(e) => updateField("description", e.target.value)}
            />
          </label>

          <div className="form-row">
            <label className="form-field">
              <span>Toplam Ders</span>
              <input
                type="number"
                value={form.total_lessons ?? ""}
                onChange={(e) => updateField("total_lessons", +e.target.value)}
              />
            </label>

            <label className="form-field">
              <span>Kapasite</span>
              <input
                type="number"
                value={form.capacity ?? ""}
                onChange={(e) => updateField("capacity", +e.target.value)}
              />
            </label>
          </div>

          <label className="form-field">
            <span>Fiyat (₺)</span>
            <input
              type="number"
              value={form.price ?? ""}
              onChange={(e) => updateField("price", e.target.value)}
            />
          </label>

          {/* LEVEL DROPDOWN */}
          <label className="form-field">
            <span>Düzey</span>
            <select
              value={form.level_id ?? ""}
              onChange={(e) => {
                const newLevel = e.target.value;
                updateField("level_id", newLevel);
                updateField("subbranch_id", ""); // reset subbranch when level changes
              }}
            >
              <option value="">Seçiniz…</option>
              {levels.map((lvl) => (
                <option key={lvl.id} value={lvl.id}>
                  {lvl.name}
                </option>
              ))}
            </select>
          </label>

          {/* SUBBRANCH DROPDOWN */}
          <label className="form-field">
            <span>Alt Branş</span>
            <select
              value={form.subbranch_id ?? ""}
              onChange={(e) => updateField("subbranch_id", e.target.value)}
              disabled={!form.level_id}
            >
              <option value="">Seçiniz…</option>

              {form.level_id &&
                levelSubbranches[form.level_id]?.map((sb) => (
                  <option key={sb.id} value={sb.id}>
                    {sb.name}
                  </option>
                ))}
            </select>
          </label>

          <label className="form-field">
            <span>Başlangıç Tarihi</span>
            <input
              type="date"
              value={form.start_date ?? ""}
              onChange={(e) => updateField("start_date", e.target.value)}
            />
          </label>
        </div>
      )}
    </div>
  );
}
