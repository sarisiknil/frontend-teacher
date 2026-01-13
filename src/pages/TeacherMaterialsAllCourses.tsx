import { useEffect, useState } from "react";
import { useProfile } from "../contexts/ProfileContext";
import {
  getCoursesByTeacher,
  type CourseRead,
} from "../api/CourseApi";
import {
  getCourseDocuments,
  deleteCourseDocument,
} from "../api/MaterialsApi";
import type { CourseDocumentRead } from "../api/MaterialsApi";

import "./TeacherMaterialsLibraryPage.css";
import TeacherHomeworkSubmissionsModal from "./TeacherHomeworkSubmissionsModal";

/* ---------------- Types ---------------- */

type SharedMaterial = {
  document_id: string;
  document_name: string;
  document_type: CourseDocumentRead["document_type"];
  mime_type: string;
  file_size_bytes: number;
  used_in_courses: {
    course_id: string;
    course_name: string;
    row_id: string;
    week: number | null;
    deadline: string | null;
  }[];
};

/* ---------------- Helper: Grouping ---------------- */

function groupByDocumentId(
  courses: CourseRead[],
  docs: CourseDocumentRead[]
): SharedMaterial[] {
  const map = new Map<string, SharedMaterial>();

  for (const doc of docs) {
    if (!map.has(doc.document_id)) {
      map.set(doc.document_id, {
        document_id: doc.document_id,
        document_name: doc.document_name,
        document_type: doc.document_type,
        mime_type: doc.mime_type,
        file_size_bytes: doc.file_size_bytes,
        used_in_courses: [],
      });
    }

    const course = courses.find((c) => c.course_id === doc.course_id);

    map.get(doc.document_id)!.used_in_courses.push({
      course_id: doc.course_id,
      course_name: course?.course_name ?? "Bilinmeyen Ders",
      row_id: doc.id,
      week: doc.week,
      deadline: doc.deadline,
    });
  }

  return Array.from(map.values());
}

/* ---------------- Helper: UI ---------------- */

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const getFileIcon = (mime: string) => {
  if (mime.includes("pdf")) return "📄";
  if (mime.includes("image")) return "🖼️";
  if (mime.includes("presentation") || mime.includes("powerpoint")) return "📊";
  if (mime.includes("sheet") || mime.includes("excel")) return "📈";
  if (mime.includes("zip") || mime.includes("compressed")) return "📦";
  return "📁";
};

/* ---------------- Page ---------------- */

export default function TeacherMaterialsLibraryPage() {
  const { profile } = useProfile();
  const teacherId = profile?.teacher_id;

  const [materials, setMaterials] = useState<SharedMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeHomework, setActiveHomework] = useState<{
    course_id: string;
    document_id: string;
    document_name: string;
  } | null>(null);


  useEffect(() => {
    if (!teacherId) return;
    loadAllMaterials();
  }, [teacherId]);

  async function loadAllMaterials() {
    setLoading(true);
    try {
      // 1. Get Courses
      const courseRes = await getCoursesByTeacher(teacherId!);
      const courses = courseRes.items;

      // 2. Get Docs in parallel
      const docsPerCourse = await Promise.all(
        courses.map((c) => getCourseDocuments(c.course_id))
      );
      const allDocs = docsPerCourse.flatMap((r) => r.items);

      // 3. Group
      setMaterials(groupByDocumentId(courses, allDocs));
    } catch (error) {
      console.error("Failed to load materials", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteEverywhere(material: SharedMaterial) {
    if (
      !confirm(
        `"${material.document_name}" dosyası tüm derslerden silinecek. Bu işlem geri alınamaz. Devam edilsin mi?`
      )
    )
      return;

    try {
      await deleteCourseDocument(material.used_in_courses[0].course_id, {
        document_id: material.document_id,
      });
      await loadAllMaterials();
    } catch (e) {
      alert("Silme işlemi başarısız oldu.");
    }
  }

  async function handleRemoveFromCourse(courseId: string, rowId: string) {
    if (!confirm("Bu materyal sadece bu dersten kaldırılacak. Emin misiniz?"))
      return;

    try {
      await deleteCourseDocument(courseId, { id: rowId });
      await loadAllMaterials();
    } catch (e) {
      alert("Kaldırma işlemi başarısız oldu.");
    }
  }

  if (loading)
    return (
      <div className="lib-loading">
        <div className="spinner"></div>
        <p>Kütüphane taranıyor...</p>
      </div>
    );

  return (
    <div className="lib-container">
      <header className="lib-header">
        <h2>📁 Materyal Kütüphanesi</h2>
        <span className="lib-count">{materials.length} Dosya</span>
      </header>

      {materials.length === 0 && (
        <div className="lib-empty">
          <div className="empty-icon">📂</div>
          <h3>Henüz materyal yok</h3>
          <p>Derslerinize yüklediğiniz dosyalar burada toplanır.</p>
        </div>
      )}

      <div className="lib-grid">
        {materials.map((mat) => (
          <article key={mat.document_id} className="lib-card">
            {/* --- Card Header --- */}
            <div className="card-top">
              <div className="file-icon">{getFileIcon(mat.mime_type)}</div>
              <div className="file-info">
                <h3 title={mat.document_name}>{mat.document_name}</h3>
                <div className="file-meta">
                  <span className="file-size">
                    {formatBytes(mat.file_size_bytes)}
                  </span>
                  <span className="file-mime">{mat.mime_type.split("/")[1]}</span>
                </div>
              </div>
              <span
                className={`type-badge ${
                  mat.document_type === "HOMEWORK" ? "badge-hw" : "badge-note"
                }`}
              >
                {mat.document_type === "HOMEWORK" ? "Ödev" : "Ders Notu"}
              </span>
            </div>

            {/* --- Card Body --- */}
            <div className="card-body">
              <h4 className="section-title">Kullanılan Dersler</h4>
              <div className="course-list">
                {mat.used_in_courses.map((c) => (
                  <div key={c.row_id} className="course-item">
                    <div className="course-details">
                      <span className="c-name">{c.course_name}</span>
                      <div className="c-meta-row">
                        {c.week && <span className="tag">Hafta {c.week}</span>}
                        {mat.document_type === "HOMEWORK" && c.deadline && (
                          <span className="tag deadline">
                            📅 {new Date(c.deadline).toLocaleDateString("tr-TR")}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      className="btn-icon-remove"
                      onClick={() =>
                        handleRemoveFromCourse(c.course_id, c.row_id)
                      }
                      title="Sadece bu dersten kaldır"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* --- Card Footer --- */}
            <div className="card-footer">
              {mat.document_type === "HOMEWORK" && (
                <button
                  className="btn-secondary"
                  onClick={() =>
                    setActiveHomework({
                      course_id: mat.used_in_courses[0].course_id,
                      document_id: mat.used_in_courses[0].row_id,
                      document_name: mat.document_name,
                    })
                  }
                >
                  📊 Teslimleri Gör
                </button>
              )}

              <button
                className="btn-delete-global"
                onClick={() => handleDeleteEverywhere(mat)}
              >
                Tümünden Sil
              </button>
            </div>

          </article>
        ))}
      </div>
      {activeHomework && (
        <TeacherHomeworkSubmissionsModal
          course_id={activeHomework.course_id}
          document_id={activeHomework.document_id}
          document_name={activeHomework.document_name}
          onClose={() => setActiveHomework(null)}
        />
      )}

    </div>
  );
}