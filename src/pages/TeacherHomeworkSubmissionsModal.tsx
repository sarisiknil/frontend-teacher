import { useEffect, useState } from "react";
import {
  getHomeworkSubmissionsByDocument,
  type StudentHomeworkAssignmentRead,
} from "../api/MaterialsApi";

import "./TeacherHomeworkSubmissionsModal.css";

type Props = {
  course_id: string;
  document_id: string;
  document_name: string;
  onClose: () => void;
};

export default function TeacherHomeworkSubmissionsModal({
  course_id,
  document_id,
  document_name,
  onClose,
}: Props) {
  const [rows, setRows] = useState<StudentHomeworkAssignmentRead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await getHomeworkSubmissionsByDocument(
        course_id,
        document_id
      );
      setRows(res.items);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="tm-modal-backdrop">
      <div className="tm-modal wide">
        <div className="tm-modal-header">
          <h3>📊 {document_name} – Öğrenci Teslimleri</h3>
          <button className="tm-icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {loading ? (
          <div className="tm-loading">Yükleniyor…</div>
        ) : rows.length === 0 ? (
          <div className="tm-empty">
            Henüz hiçbir öğrenci ödevi teslim etmedi.
          </div>
        ) : (
          <table className="tm-table">
            <thead>
              <tr>
                <th>Öğrenci</th>
                <th>Durum</th>
                <th>Doğru / Yanlış</th>
                <th>Cevaplar</th>
                <th>Teslim Tarihi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const s = r.student.Profile;
                return (
                  <tr key={i}>
                    <td>
                      {s?.Name} {s?.Surname}
                    </td>

                    <td>
                      {r.assignment.is_submitted ? (
                        <span className="badge success">Teslim</span>
                      ) : (
                        <span className="badge muted">Bekliyor</span>
                      )}
                    </td>

                    <td>
                      {r.assignment.correct_count != null
                        ? `${r.assignment.correct_count} / ${r.assignment.question_count}`
                        : "—"}
                    </td>

                    <td className="mono">
                      {r.assignment.student_answers ?? "—"}
                    </td>

                    <td>
                      {r.assignment.submitted_at
                        ? new Date(
                            r.assignment.submitted_at
                          ).toLocaleString("tr-TR")
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
