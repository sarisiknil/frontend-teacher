import { useEffect, useState } from "react";
import type { CourseDocumentRead } from "../../api/MaterialsApi";
import "./TeacherMaterials.css";
import { getHomeworkByDocumentId } from "../../api/MaterialsApi";

type Props = {
  doc: CourseDocumentRead;
  onClose: () => void;
  onSave: (payload: {
    document_id: string;   // ✅ MUST be CourseDocumentRead.id (row PK)
    question_count: number;
    answers: string;       // e.g. "ABCDE"
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
  const [loadingHomework, setLoadingHomework] = useState(true);


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

  /* ---------------- Prefill if answers exist ---------------- */

  useEffect(() => {
    let cancelled = false;
    setLoadingHomework(true);

    (async () => {
      try {
        const res = await getHomeworkByDocumentId(doc.id);

        if (!cancelled && res.code === 200 && res.items.length > 0) {
          const hw = res.items[0];
          setQuestionCount(hw.question_count);
          setChoices(hw.answers ? hw.answers.split("") : []);
        }
      } catch {
        if (!cancelled) {
          setError("Ödev cevapları yüklenemedi.");
        }
      } finally {
        if (!cancelled) setLoadingHomework(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [doc.id]);

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

    const answersString = choices.join(""); // e.g. "ABCED"

    if (answersString.length !== questionCount) {
      setError("Cevap uzunluğu soru sayısı ile eşleşmiyor.");
      return;
    }

    setBusy(true);
    try {
      await onSave({
        document_id: doc.id,        // ✅ row PK, NOT document_id
        question_count: questionCount,
        answers: answersString,
      });

      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Cevaplar kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  }

  /* ---------------- Render ---------------- */

  return (
    <div className="modal-backdrop">
      <div className="modal large">
        <h3>Ödev Cevapları – {doc.document_name}</h3>

        {!loadingHomework && questionCount === 0 && (
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
            disabled={busy}
          />
        </label>

        {questionCount > 0 && (
          <div className="answers-grid">
            {choices.map((choice, idx) => (
              <div key={idx} className="answer-row">
                <span>Soru {idx + 1}</span>
                <select
                  value={choice}
                  disabled={busy}
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
