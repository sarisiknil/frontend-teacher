// pages/Course/CoursePage.tsx
import { useState } from "react";
import { useCourse } from "../../contexts/CourseContext";

import CourseTabs from "./CourseTabs";
import CourseHero from "./CourseHero";
import CourseInfoSection from "./CourseInfoSection";
import CourseSyllabusSection from "./CourseSyllabusSection";
import CourseScheduleSection from "./CourseScheduleSection";

import "./course.css";

export default function CoursePage() {
  const { loading, course } = useCourse();
  const [activeTab, setActiveTab] = useState<"dersim" | "materyaller" | "analiz">("dersim");

  if (loading || !course) {
    return <div className="course-loading">Loading course...</div>;
  }

  return (
    <div className="course-page">
      {/* TOP HERO */}
      <CourseHero />

      {/* TAB MENU */}
      <CourseTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* TAB CONTENT */}
      {activeTab === "dersim" && (
        <div className="course-tab-content">
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
    </div>
  );
}
