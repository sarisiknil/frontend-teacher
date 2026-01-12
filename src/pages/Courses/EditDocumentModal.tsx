import { useState } from "react";
import type { CourseDocumentRead } from "../../api/MaterialsApi";
import "./TeacherMaterials.css";

type Props = {
  doc: CourseDocumentRead;
  courseId: string;
  onClose: () => void;
  onSave: (payload: {
    id: string;
    document_name?: string | null;
    description?: string | null;
    week?: number | null;
    // deadline is row-level but only meaningful for HOMEWORK in your product logic
    deadline?: string | null;
  }) => Promise<void>;
};

export default function EditDocumentModal({ doc, onClose, onSave }: Props) {
  const [name, setName] = useState(doc.document_name);
  const [description, setDescription] = useState(doc.description ?? "");
  const [week, setWeek] = useState(doc.week?.toString() ?? "");
  const [deadline, setDeadline] = useState(
    doc.deadline ? doc.deadline.slice(0, 16) : ""
  );

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) {
      setError("Belge adı boş olamaz.");
      return;
    }

    setBusy(true);
    try {
      await onSave({
        id: doc.id,
        document_name: name.trim(),
        description: description.trim() || null,
        week: week ? Number(week) : null,

        // ✅ only send deadline if HOMEWORK, else null
        deadline:
          doc.document_type === "HOMEWORK" && deadline
            ? new Date(deadline).toISOString()
            : null,
      });
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Güncelleme başarısız.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Belgeyi Düzenle</h3>

        {error && <div className="modal-error">{error}</div>}

        <label>
          Belge Adı
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <label>
          Açıklama
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        {/* ✅ Type is informational here (shared) */}
        <label>
          Tür
          <input value={doc.document_type} disabled />
        </label>

        <label>
          Hafta
          <input
            type="number"
            min={1}
            value={week}
            onChange={(e) => setWeek(e.target.value)}
          />
        </label>

        {/* ✅ Deadline only for HOMEWORK */}
        {doc.document_type === "HOMEWORK" && (
          <label>
            Deadline (Ödev için)
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </label>
        )}

        <div className="modal-actions">
          <button onClick={onClose} disabled={busy}>
            İptal
          </button>
          <button onClick={handleSave} disabled={busy}>
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
