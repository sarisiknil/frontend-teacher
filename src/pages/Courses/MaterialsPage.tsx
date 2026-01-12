import { useEffect, useMemo, useState } from "react";
import { useCourse } from "../../contexts/CourseContext";

import {
  getCourseDocuments,
  createCourseDocument,
  deleteCourseDocument,
  updateCourseDocumentFile,
  upsertHomework,
  updateCourseDocument,
} from "../../api/MaterialsApi";

import type {
  CourseDocumentRead,
  CourseDocumentCreateRequest,
} from "../../api/MaterialsApi";

import "./TeacherMaterials.css";
import EditDocumentModal from "./EditDocumentModal";
import HomeworkAnswersModal from "./HomeworkAnswersModal";

type DocType = CourseDocumentRead["document_type"];
const API_BASE = import.meta.env.VITE_API_BASE_URL;
export default function TeacherMaterialsPage() {
  const { course } = useCourse();
  const courseId = course?.course_id;

  const [documents, setDocuments] = useState<CourseDocumentRead[]>([]);
  const [loading, setLoading] = useState(true);

  // -------- CREATE DOCUMENT UI STATE --------
  const [showCreate, setShowCreate] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [newDocType, setNewDocType] = useState<DocType>("LECTURE_NOTES");
  const [newDocName, setNewDocName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newWeek, setNewWeek] = useState<string>("");
  const [newVisibleFrom, setNewVisibleFrom] = useState<string>("");
  const [newDeadline, setNewDeadline] = useState<string>(""); // only for HOMEWORK
  const [newFile, setNewFile] = useState<File | null>(null);

  const [editDoc, setEditDoc] = useState<CourseDocumentRead | null>(null);
  const [editHomework, setEditHomework] = useState<CourseDocumentRead | null>(null);

  useEffect(() => {
    if (!courseId) return;
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  async function loadDocuments() {
    if (!courseId) return;
    setLoading(true);
    const res = await getCourseDocuments(courseId);
    if (res.code === 200) {
      setDocuments(res.items.filter((d) => !d.deleted_at));
    }
    setLoading(false);
  }

  const sortedDocs = useMemo(() => {
    return [...documents].sort((a, b) => {
      const aw = a.week ?? 999999;
      const bw = b.week ?? 999999;
      if (aw !== bw) return aw - bw;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [documents]);

  /* ------------------ DOCUMENT ACTIONS ------------------ */

  async function handleDelete(doc: CourseDocumentRead) {
    if (!courseId) return;
    if (!confirm("Bu belge silinsin mi? (Sadece bu kursta silinecek)")) return;

    // ✅ course-specific delete -> use row PK (id)
    await deleteCourseDocument(courseId, { id: doc.id });

    await loadDocuments();
  }

  async function handleReplaceFile(doc: CourseDocumentRead, file: File) {
    if (!courseId) return;

    // ✅ shared file replacement -> uses shared document_id
    await updateCourseDocumentFile(courseId, doc.document_id, file);
    await loadDocuments();
  }

  /* ------------------ CREATE DOCUMENT (UPLOAD) ------------------ */

  function resetCreateForm() {
    setNewDocType("LECTURE_NOTES");
    setNewDocName("");
    setNewDescription("");
    setNewWeek("");
    setNewVisibleFrom("");
    setNewDeadline("");
    setNewFile(null);
    setCreateError(null);
  }

  function dtLocalToIso(dtLocal: string): string {
    return new Date(dtLocal).toISOString();
  }

  async function handleCreateDocument() {
    if (!courseId) return;
    setCreateError(null);

    if (!newFile) return setCreateError("Lütfen bir dosya seçin.");
    if (!newDocName.trim()) return setCreateError("Lütfen belge adı girin.");

    // deadline only for homework
    if (newDocType !== "HOMEWORK") {
      // keep it empty
      if (newDeadline) setNewDeadline("");
    }

    setCreateBusy(true);
    try {
      const payload: CourseDocumentCreateRequest = {
        course_ids: [courseId],
        document_type: newDocType,
        document_name: newDocName.trim(),
        file: newFile,

        description: newDescription.trim() ? newDescription.trim() : null,
        week: newWeek.trim() ? Number(newWeek) : null,

        // ✅ only send deadline when HOMEWORK
        deadline:
          newDocType === "HOMEWORK" && newDeadline
            ? dtLocalToIso(newDeadline)
            : null,
            visible_from:
        newDocType === "HOMEWORK" && newVisibleFrom
          ? dtLocalToIso(newVisibleFrom)
          : null,
      };

      const res = await createCourseDocument(payload);

      if (res.code !== 200) {
        setCreateError(res.message || "Belge yüklenemedi.");
        return;
      }

      // created document is res.items[0] (single upload)
      const created = res.items?.[0];

      resetCreateForm();
      setShowCreate(false);
      await loadDocuments();

      // ✅ If HOMEWORK: immediately open answers modal to upsert answers
      if (created && created.document_type === "HOMEWORK") {
        setEditHomework(created);
      }
    } catch (e: any) {
      setCreateError(e?.message || "Belge yüklenemedi.");
    } finally {
      setCreateBusy(false);
    }
  }

  /* ------------------ RENDER ------------------ */
  const DOC_TYPE_LABELS: Record<DocType, string> = {
    HOMEWORK: "Ödev",
    SUMMARY: "Özet",
    LECTURE_NOTES: "Ders Notu",
    READING: "Okuma",
    SOLUTION: "Çözüm",
    OTHER: "Diğer",
  };

  if (loading) return <div>Materyaller yükleniyor...</div>;

  return (
    <div className="teacher-materials-page">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>📁 Ders Materyalleri</h2>

        <button onClick={() => setShowCreate((p) => !p)}>
          {showCreate ? "Kapat" : "Yeni Belge Yükle"}
        </button>
      </div>

      {/* -------- CREATE DOCUMENT PANEL -------- */}
      {showCreate && (
        <div
          className="create-doc-panel"
          style={{
            marginTop: 12,
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Yeni Belge Yükle</h3>

          {createError && (
            <div style={{ marginBottom: 10, color: "crimson" }}>
              {createError}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <label>
              Belge Türü
              <select
                value={newDocType}
                onChange={(e) => setNewDocType(e.target.value as DocType)}
              >
                {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Belge Adı
              <input
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                placeholder="Örn: Hafta 3 Ders Notları"
                style={{ width: "100%" }}
              />
            </label>

            <label style={{ gridColumn: "1 / -1" }}>
              Açıklama (opsiyonel)
              <input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Kısa açıklama"
                style={{ width: "100%" }}
              />
            </label>

            <label>
              Hafta (opsiyonel)
              <input
                type="number"
                min={1}
                value={newWeek}
                onChange={(e) => setNewWeek(e.target.value)}
                placeholder="Örn: 3"
                style={{ width: "100%" }}
              />
            </label>

            {newDocType === "HOMEWORK" && (
              <label>
                Görünürlük (Ödev için)
                <input
                  type="datetime-local"
                  value={newVisibleFrom}
                  onChange={(e) => setNewVisibleFrom(e.target.value)}
                  style={{ width: "100%" }}
                />
              </label>
            )}

            {/* ✅ Deadline only for HOMEWORK */}
            {newDocType === "HOMEWORK" && (
              <label>
                Deadline (Ödev için)
                <input
                  type="datetime-local"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  style={{ width: "100%" }}
                />
              </label>
            )}

            <label style={{ gridColumn: "1 / -1" }}>
              Dosya
              <input
                type="file"
                onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
                style={{ width: "100%" }}
              />
            </label>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button disabled={createBusy} onClick={handleCreateDocument}>
              {createBusy ? "Yükleniyor..." : "Yükle"}
            </button>

            <button
              disabled={createBusy}
              onClick={() => {
                resetCreateForm();
                setShowCreate(false);
              }}
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* -------- DOCUMENT LIST -------- */}
      <div className="document-list" style={{ marginTop: 16 }}>
        {sortedDocs.map((doc) => (
          <div
            key={doc.id}
            className="document-card"
            style={{
              padding: 12,
              border: "1px solid #eee",
              borderRadius: 8,
              marginBottom: 10,
            }}
          >
            <div
              className="doc-main"
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <strong>{doc.document_name}</strong>
              <span className="doc-type" style={{ opacity: 0.7 }}>
                {doc.document_type}
              </span>
            </div>

            <div
              className="doc-meta"
              style={{
                display: "flex",
                gap: 12,
                marginTop: 6,
                opacity: 0.8,
                flexWrap: "wrap",
              }}
            >
              {doc.week && <span>Hafta {doc.week}</span>}

              {/* ✅ Deadline only for HOMEWORK */}
              {doc.document_type === "HOMEWORK" && doc.deadline && (
                <span>
                  Son teslim:{" "}
                  {new Date(doc.deadline).toLocaleString("tr-TR")}
                </span>
              )}

              <span>
                {(doc.file_size_bytes / 1024 / 1024).toFixed(1)} MB ·{" "}
                {doc.mime_type}
              </span>

              {/* ✅ Encourage answers if missing */}
              {doc.document_type === "HOMEWORK" && doc.homework_answers === false && (
                <span style={{ color: "crimson", fontWeight: 600 }}>
                  Cevaplar yüklenmedi!
                </span>
              )}
            </div>

            <div
              className="doc-actions"
              style={{
                display: "flex",
                gap: 10,
                marginTop: 10,
                flexWrap: "wrap",
              }}
            >
              <a
                href={`${API_BASE}/${doc.document_link}`}
                target="_blank"
                rel="noreferrer"
              >
                İndir
              </a>

              <button onClick={() => setEditDoc(doc)}>Düzenle</button>

              <label style={{ cursor: "pointer" }}>
                Dosya Değiştir
                <input
                  type="file"
                  hidden
                  onChange={(e) =>
                    e.target.files && handleReplaceFile(doc, e.target.files[0])
                  }
                />
              </label>

              <button onClick={() => handleDelete(doc)}>Sil</button>

              {doc.document_type === "HOMEWORK" && (
                <button onClick={() => setEditHomework(doc)}>
                  Cevapları Düzenle
                </button>
              )}
            </div>
          </div>
        ))}

        {sortedDocs.length === 0 && (
          <div style={{ opacity: 0.7 }}>Henüz belge yok.</div>
        )}
      </div>

      {editDoc && (
        <EditDocumentModal
          doc={editDoc}
          courseId={courseId!}
          onClose={() => setEditDoc(null)}
          onSave={async (payload) => {
            // ✅ row-only update via id
            await updateCourseDocument(courseId!, payload);
            await loadDocuments();
          }}
        />
      )}

      {editHomework && (
        <HomeworkAnswersModal
          doc={editHomework}
          onClose={() => setEditHomework(null)}
          onSave={async ({ document_id, question_count, answers }) => {
            await upsertHomework({
              course_id: courseId!,
              document_id,
              question_count,
              answers,
            });

            // ✅ KRİTİK: parent documents state’ini güncelle
            setDocuments((prev) =>
              prev.map((d) =>
                d.id === document_id
                  ? { ...d, homework_answers: true }
                  : d
              )
            );

            // editHomework state’ini de senkron tut
            setEditHomework((prev) =>
              prev && prev.id === document_id
                ? { ...prev, homework_answers: true }
                : prev
            );

            setEditHomework(null);
          }}
        />
      )}

    </div>
  );
}
