import { useState, useEffect } from "react";
import { useProfile } from "../../contexts/ProfileContext";
import {
  getCoursesByTeacher,
  type CourseRead,
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

  const mainTab = "unpublished";

  const options = ["Drafts", "Cancelled", "Completed"];
  const [subTab, setSubTab] = useState("Drafts");


  useEffect(() => {
    if (!teacherId) return;

    (async () => {
      const res = await getCoursesByTeacher(teacherId);
      setCourses(res.items);
      setLoading(false);
    })();
  }, [teacherId]);

  const FILTERS: Record<string, (c: CourseRead) => boolean> = {
    Drafts: (c) => c.course_status === "DRAFT",
    Cancelled: (c) => c.course_status === "CANCELLED",
    Completed: (c) => c.course_status === "COMPLETED",
  };

  const filteredCourses = FILTERS[subTab]
    ? courses.filter(FILTERS[subTab])
    : [];

  return (
    <div className="unpublished-page">
      <LectureNavbar active={mainTab} setActive={() => {}} />

      <SubNavbar options={options} active={subTab} setActive={setSubTab} />
      <div className="unpublished-course-list">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : filteredCourses.length === 0 ? (
          <div className="empty-state">
            No courses found in "{subTab}".
          </div>
        ) : (
          filteredCourses.map((course) => (
            <Link key={course.course_id} to={`/course/${course.course_id}`}>
                <CourseCard course={course} />
            </Link>
          ))
        )}
      </div>

    </div>
  );
}
