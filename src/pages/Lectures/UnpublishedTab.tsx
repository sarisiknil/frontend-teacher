import { useState, useEffect } from "react";
import { useProfile } from "../../contexts/ProfileContext";
import {
  getCoursesByTeacher,
  type CourseRead,
  cancelCourse,
} from "../../api/CourseApi";

import LectureNavbar from "../../components/lectures/LectureNavbar";
import SubNavbar from "../../components/lectures/SubNavbar";
import CourseCard from "../../components/lectures/CourseCard";
import { Link } from "react-router-dom";

import "./UnpublishedLecturesPage.css";

export default function UnpublishedLecturesPage() {
  const { profile } = useProfile();
  const teacherId = profile?.teacher_id;

  const [courses, setCourses] = useState<CourseRead[]>([]);
  const [loading, setLoading] = useState(true);

  // Navbar "unpublished" key'ini bekliyor (LectureNavbar düzeltmemize uygun)
  const mainTab = "unpublished"; 

  // SubNavbar için Türkçe seçenekler
  const options = ["Taslaklar", "İptal Edilenler", "Tamamlananlar"];
  const [subTab, setSubTab] = useState("Taslaklar");

  useEffect(() => {
    if (!teacherId) return;

    (async () => {
      try {
        const res = await getCoursesByTeacher(teacherId);
        setCourses(res.items);
      } catch (error) {
        console.error("Dersler yüklenirken hata:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [teacherId]);

  // Türkçe SubTab başlıklarına göre filtreleme
  const FILTERS: Record<string, (c: CourseRead) => boolean> = {
    "Taslaklar": (c) => c.course_status === "DRAFT",
    "İptal Edilenler": (c) => c.course_status === "CANCELLED",
    "Tamamlananlar": (c) => c.course_status === "COMPLETED",
  };

  const filteredCourses = FILTERS[subTab]
    ? courses.filter(FILTERS[subTab])
    : [];

  async function handleCancel(course: CourseRead) {
    if (!teacherId) return;

    // Sadece taslaklar iptal edilebilir (Mantık gereği)
    if (course.course_status !== "DRAFT") {
      alert("Sadece 'Taslak' durumundaki dersler iptal edilebilir.");
      return;
    }

    if (!confirm("Bu taslağı iptal etmek istediğinize emin misiniz?")) return;

    try {
      await cancelCourse(course.course_id);
      // Listeyi güncelle
      const res = await getCoursesByTeacher(teacherId);
      setCourses(res.items);
    } catch (err) {
      console.error("İptal hatası:", err);
      alert("Ders iptal edilirken bir sorun oluştu.");
    }
  }

  return (
    <div className="unpublished-page">
      <LectureNavbar active={mainTab} setActive={() => {}}  onRefresh={() => {}}/>

      <SubNavbar options={options} active={subTab} setActive={setSubTab} />
      
      <div className="unpublished-course-list">
        {loading ? (
          <div className="loading">Yükleniyor...</div>
        ) : filteredCourses.length === 0 ? (
          <div className="empty-state">
            "{subTab}" kategorisinde ders bulunamadı.
          </div>
        ) : (
          filteredCourses.map((course) => (
            <Link key={course.course_id} to={`/course/${course.course_id}`}>
              <CourseCard
                key={course.course_id}
                course={course}
                onCancel={() => {// Link'e gitmesini engelle
                  handleCancel(course);
                }}
                // Pasif sayfada start/complete butonları genelde olmaz veya boştur
                onStart={() => {}}
                onComplete={() => {}}
              />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}