import { useState, useEffect } from "react";
import { useProfile } from "../../contexts/ProfileContext";
import {
    getCoursesByTeacher,
    type CourseRead,
} from "../../api/CourseApi";

import LectureNavbar from "../../components/lectures/LectureNavbar";
import CourseCard from "../../components/lectures/CourseCard";
import SubNavbar from "../../components/lectures/SubNavbar";
import { Link } from "react-router-dom";
import "./PublishedLecturesPage.css";
import { cancelCourse, startCourse, completeCourse } from "../../api/CourseApi";

export default function PublishedLecturesPage(){
    const { profile } = useProfile();
    const teacherId = profile?.teacher_id;
    const [courses, setCourses] = useState<CourseRead[]>([]);
    const [loading, setLoading] = useState(true);

    const mainTab = "published";
    const options = ["Ongoing", "Published"];
    const [subTab, setSubTab] = useState("Ongoing");

    useEffect(() => {
        if(!teacherId) return;
        (async () => {
            const res = await getCoursesByTeacher(teacherId);
            setCourses(res.items);
            setLoading(false);
        })();
    }, [teacherId]);

    const FILTERS: Record<string, (c: CourseRead) => boolean> = {
        Ongoing: (c) => c.course_status === "ONGOING",
        Published: (c) => c.course_status === "PUBLISHED",
    };

    const filteredCourses = FILTERS[subTab]
        ? courses.filter(FILTERS[subTab])
        : [];

    async function handleStart(course: CourseRead) {
        if(!teacherId) return;
        if(course.course_status !== "DRAFT"){
            alert("Only draft courses can be started");
            return;
        }
        try {
            await startCourse(course.course_id);
            const res = await getCoursesByTeacher(teacherId);
            setCourses(res.items);
        } catch(err){
            console.error("cancel error: ", err);
        }


    }
    async function handleCancel(course: CourseRead) {
        if (!teacherId) return;

        // Only allow cancelling drafts
        if (course.course_status !== "PUBLISHED") {
        alert("Only draft courses can be cancelled.");
        return;
        }

        try {
        const res1 = await cancelCourse(course.course_id);
        console.log(res1);
        const res = await getCoursesByTeacher(teacherId);
        setCourses(res.items);

        } catch (err) {
        console.error("Cancel error:", err);
        }
    }
    async function handleComplete(course: CourseRead) {
        if(!teacherId) return;
        if(course.course_status === "ONGOING"){
            alert("only ongoing courses can be completed.");
            return;
        }
        try {
            await completeCourse(course.course_id);
            const res = await getCoursesByTeacher(teacherId);
            setCourses(res.items);
        } catch(err) {
            console.error("complete error: ", err);
        }
        
    }

    return (
        <div className="published-page">
            <LectureNavbar active={mainTab} setActive={() => {}} />
            <SubNavbar options={options} active={subTab} setActive={setSubTab} />
            <div className="published-course-list">
                {loading? (
                    <div className="loading">Loading...</div>
                ): filteredCourses.length === 0 ? (
                    <div className="empty-state"> No courses found in {subTab}.</div>
                ): (
                    filteredCourses.map((course) => (
                        
                        <Link key={course.course_id} to={`/course/${course.course_id}`}>
                            <CourseCard 
                                key={course.course_id} 
                                course={course}
                                onCancel={() => handleCancel(course)}
                                onStart={() => handleStart(course)}
                                onComplete={() => handleComplete(course)}
                            />
                        </Link>                    
                    ))
                )}
            </div>
        </div>
    )
 }