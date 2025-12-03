import { useParams } from "react-router-dom";
import { CourseProvider } from "../../contexts/CourseContext";
import MyLecturesPage from "./MyLecturesPage";

export default function CourseRouteWrapper() {
  const { courseId } = useParams();

  if (!courseId) {
    return <div>Invalid course ID</div>;
  }

  return (
    <CourseProvider courseId={courseId}>
      <MyLecturesPage />
    </CourseProvider>
  );
}
