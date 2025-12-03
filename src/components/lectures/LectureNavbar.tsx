import "./LectureNavbar.css";
import { useNavigate } from "react-router-dom";
import CreateCourseModal from "./CreateCourseModal";
import { useState } from "react";

export default function LectureNavbar({
  active,
  setActive,
}: {
  active: string;
  setActive: (v: string) => void;
}) {
  const tabs = ["unpublished", "published", "constraints"];
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleClick = (tab: string) => {
    setActive(tab);
    navigate(`/my-lectures/${tab}`);
  };

  return (
    <div className="lecture-navbar">
      <div className="lecture-navbar-left">
        {tabs.map((tab) => (
          <div
            key={tab}
            className={`lecture-navbar-item ${active === tab ? "active" : ""}`}
            onClick={() => handleClick(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </div>
        ))}
      </div>

      <button 
        className="create-course-btn-small"
        onClick={() => setShowCreateModal(true)}
      >
        + Create
      </button>
      {showCreateModal && (
        <CreateCourseModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
