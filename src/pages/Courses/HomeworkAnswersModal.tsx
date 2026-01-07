import { useEffect, useState } from "react";
import type { CourseDocumentRead } from "../../api/MaterialsApi";
import "./TeacherMaterials.css";

type Props = {
  doc: CourseDocumentRead;
  onClose: () => void;
  onSave: (payload: {
    document_id: string;   // <-- CourseDocumentRead.id
    question_count: number;
    answers: string;       // <-- "ABCDE"
  }) => Promise<void>;
};

const OPTIONS = ["A", "B", "C", "D", "E"] as const;

export default function HomeworkAnswersModal({
  doc,
  onClose,
  onSave,
}: Props) {
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [choices, setChoices] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------------- Sync choices with question count ---------------- */

  useEffect(() => {
    if (questionCount <= 0) {
      setChoices([]);
      return;
    }

    setChoices((prev) => {
      const next = [...prev];
      while (next.length < questionCount) next.push("");
      return next.slice(0, questionCount);
    });
  }, [questionCount]);

  /* ---------------- Save ---------------- */

  async function handleSave() {
    setError(null);

    if (questionCount <= 0) {
      setError("Soru sayısı zorunludur.");
      return;
    }

    if (choices.length !== questionCount) {
      setError("Cevap sayısı soru sayısı ile eşleşmiyor.");
      return;
    }

    if (choices.some((c) => !OPTIONS.includes(c as any))) {
      setError("Tüm sorular için A–E arasında seçim yapılmalıdır.");
      return;
    }

    const answersString = choices.join(""); // <-- "ABCED"

    setBusy(true);
    try {
      await onSave({
        document_id: doc.id,           // 🔴 DOĞRU ID
        question_count: questionCount,
        answers: answersString,        // 🔴 STRING
      });

      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Cevaplar kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!doc.homework_answers) return;

    // assuming backend later returns these fields
    if ((doc as any).question_count && (doc as any).answers) {
        const qc = (doc as any).question_count;
        const ans = (doc as any).answers as string;

        setQuestionCount(qc);
        setChoices(ans.split(""));
    }
    }, [doc]);


  /* ---------------- Render ---------------- */

  return (
    <div className="modal-backdrop">
      <div className="modal large">
        <h3>
          Ödev Cevapları – {doc.document_name}
        </h3>

        {!doc.homework_answers && (
          <div className="modal-warning">
            ⚠️ Bu ödev için henüz cevaplar yüklenmemiş.
          </div>
        )}

        {error && <div className="modal-error">{error}</div>}

        <label>
          Soru Sayısı
          <input
            type="number"
            min={1}
            value={questionCount || ""}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
          />
        </label>

        {questionCount > 0 && (
          <div className="answers-grid">
            {choices.map((choice, idx) => (
              <div key={idx} className="answer-row">
                <span>Soru {idx + 1}</span>
                <select
                  value={choice}
                  onChange={(e) => {
                    const v = e.target.value;
                    setChoices((prev) => {
                      const copy = [...prev];
                      copy[idx] = v;
                      return copy;
                    });
                  }}
                >
                  <option value="">—</option>
                  {OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        <div className="modal-actions">
          <button onClick={onClose} disabled={busy}>
            İptal
          </button>
          <button onClick={handleSave} disabled={busy}>
            {busy ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
