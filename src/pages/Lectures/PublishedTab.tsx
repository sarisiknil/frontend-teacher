import { useState, useEffect } from "react";
import { useProfile } from "../../contexts/ProfileContext";
import {
    getCoursesByTeacher,
    type CourseRead,
    cancelCourse, 
    startCourse, 
    completeCourse
} from "../../api/CourseApi";

import LectureNavbar from "../../components/lectures/LectureNavbar";
import CourseCard from "../../components/lectures/CourseCard";
import SubNavbar from "../../components/lectures/SubNavbar";
import { Link } from "react-router-dom";
import "./PublishedLecturesPage.css";

export default function PublishedLecturesPage(){
    const { profile } = useProfile();
    const teacherId = profile?.teacher_id;
    const [courses, setCourses] = useState<CourseRead[]>([]);
    const [loading, setLoading] = useState(true);

    const mainTab = "published";
    
    // SubNavbar seçenekleri
    const options = ["Devam Eden", "Kayıt Dönemi"];
    const [subTab, setSubTab] = useState("Devam Eden");

    useEffect(() => {
        if(!teacherId) return;
        (async () => {
            try {
                const res = await getCoursesByTeacher(teacherId);
                setCourses(res.items);
            } catch (error) {
                console.error("Hata:", error);
            } finally {
                setLoading(false);
            }
        })();
    }, [teacherId]);

    // Türkçe sekmelere göre filtreleme
    const FILTERS: Record<string, (c: CourseRead) => boolean> = {
        "Devam Eden": (c) => c.course_status === "ONGOING",
        "Kayıt Dönemi": (c) => c.course_status === "PUBLISHED",
    };

    const filteredCourses = FILTERS[subTab]
        ? courses.filter(FILTERS[subTab])
        : [];

    // Ders Başlatma (Kayıt Dönemi -> Devam Eden)
    async function handleStart(course: CourseRead) {
        if (!teacherId) return;

        if (course.course_status !== "PUBLISHED") {
            alert("Sadece 'Kayıt Dönemi'ndeki dersler başlatılabilir.");
            return;
        }

        if (!confirm("Dersi başlatmak kayıtları kapatacaktır. Onaylıyor musunuz?")) return;

        const res = await startCourse(course.course_id);

        if (res.code === 422) {
            if (res.errors?.[0]?.detail === "NO_STUDENTS_EXIST") {
                alert(
                    "Bu dersi başlatabilmek için en az 1 öğrenci kayıtlı olmalıdır.\n\n" +
                    "Kayıt dönemi devam ederken öğrencilerin kayıt olmasını bekleyin."
                );
                return;
            }

            alert("Ders başlatılamadı.");
            return;
        }

        // başarı
        const refreshed = await getCoursesByTeacher(teacherId);
        setCourses(refreshed.items);
    }


    // Ders İptali (Yayından Kaldırma)
    async function handleCancel(course: CourseRead) {
        if (!teacherId) return;

        // Sadece PUBLISHED olanlar burada iptal edilebilir
        if (course.course_status !== "PUBLISHED") {
            alert("Sadece 'Kayıt Dönemi'ndeki dersler buradan iptal edilebilir.");
            return;
        }

        if(!confirm("Bu dersi iptal etmek istediğinize emin misiniz?")) return;

        try {
            await cancelCourse(course.course_id);
            const res = await getCoursesByTeacher(teacherId);
            setCourses(res.items);
        } catch (err) {
            console.error("İptal hatası:", err);
            alert("İşlem başarısız oldu.");
        }
    }

    // Dersi Tamamlama (Devam Eden -> Tamamlandı)
    async function handleComplete(course: CourseRead) {
        if(!teacherId) return;
        
        // Sadece ONGOING olanlar tamamlanabilir
        if(course.course_status !== "ONGOING"){
            alert("Sadece 'Devam Eden' statüsündeki dersler tamamlanabilir.");
            return;
        }

        if(!confirm("Dersi tamamlamak üzeresiniz. Bu işlem geri alınamaz.")) return;

        try {
            await completeCourse(course.course_id);
            const res = await getCoursesByTeacher(teacherId);
            setCourses(res.items);
        } catch(err) {
            console.error("Tamamlama hatası: ", err);
            alert("İşlem başarısız oldu.");
        }
    }

    return (
        <div className="published-page">
            <LectureNavbar active={mainTab} setActive={() => {}} onRefresh={() => {}} />
            
            <SubNavbar options={options} active={subTab} setActive={setSubTab} />
            
            <div className="published-course-list">
                {loading? (
                    <div className="loading">Yükleniyor...</div>
                ): filteredCourses.length === 0 ? (
                    <div className="empty-state">"{subTab}" kategorisinde ders bulunamadı.</div>
                ): (
                    filteredCourses.map((course) => (
                        <Link key={course.course_id} to={`/course/${course.course_id}`}>
                            <CourseCard 
                                key={course.course_id} 
                                course={course}
                                // Olayların Link'i tetiklemesini önlemek için preventDefault
                                onCancel={() => { handleCancel(course); }}
                                onStart={() => {  handleStart(course); }}
                                onComplete={() => {  handleComplete(course); }}
                            />
                        </Link>                    
                    ))
                )}
            </div>
        </div>
    )
}