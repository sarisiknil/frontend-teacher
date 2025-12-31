import { useState } from "react";
import { useCourse } from "../../contexts/CourseContext";

import CourseTabs from "./CourseTabs";
import CourseHero from "./CourseHero";
import CourseInfoSection from "./CourseInfoSection";
import CourseSyllabusSection from "./CourseSyllabusSection";
import CourseScheduleSection from "./CourseScheduleSection";

import "./course.css";
import CourseLiveLectureCard from "../../components/lectures/CourseLiveLectureCard";
import CourseAnnouncementsTab from "./CourseAnnouncementsTab";

export default function CoursePage() {
  const { loading, course } = useCourse();
  const [activeTab, setActiveTab] = useState<"dersim" | "materyaller" | "analiz"| "anons">("dersim");

  if (loading || !course) {
    return <div className="course-loading">Ders yükleniyor...</div>;
  }

  const isDraft = course.course_status === "DRAFT";

  const reviewStatus = (course as any).latest_review_status;
  const isPending = reviewStatus === "PENDING";

  return (
    <div className="course-page">
      
      {/* STATUS BANNERS */}
      
      {/* Show Pending Banner if waiting for approval */}
      {isPending && (
        <div className="status-banner info">
          ℹ️ <strong>İncelemede:</strong> Kursunuz şu anda yönetici onayı beklemektedir.
        </div>
      )}

      {/* Show Draft Banner ONLY if it is NOT pending review */}
      {isDraft && !isPending && (
        <div className="status-banner warning">
          ⚠️ <strong>Taslak Modu:</strong> Bu kurs henüz yayınlanmadı. İçerikleri düzenleyip onaya gönderebilirsiniz.
        </div>
      )}

      {/* TOP HERO */}
      <CourseHero />

      {/* TAB MENU */}
      <CourseTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* TAB CONTENT */}
      {activeTab === "dersim" && (
        <div className="course-tab-content">
          <CourseLiveLectureCard />
          <CourseInfoSection />
          <CourseSyllabusSection />
          <CourseScheduleSection />
        </div>
      )}

      {activeTab === "materyaller" && (
        <div className="course-materials-placeholder">
          Materyaller yakında eklenecek...
        </div>
      )}

      {activeTab === "analiz" && (
        <div className="course-analytics-placeholder">
          Kurs analizleri yakında eklenecek...
        </div>
      )}
      {activeTab === "anons" && (
        <div className="course-annnouncements-placeholder">
          <CourseAnnouncementsTab/>
        </div>
      )}
    </div>
  );
}