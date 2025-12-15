import "./LectureNavbar.css";
import { useNavigate } from "react-router-dom";
import CreateCourseModal from "./CreateCourseModal"; 
import { useState } from "react";

interface LectureNavbarProps {
  active: string;
  setActive: (v: string) => void;
  onRefresh: () => void; 
}

export default function LectureNavbar({
  active,
  setActive,
  onRefresh, 
}: LectureNavbarProps) {
  
  const navItems = [
    { key: "unpublished", label: "Pasif" },
    { key: "published", label: "Yayında" },
    { key: "constraints", label: "Kısıtlamalar" },
  ];

  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleClick = (key: string) => {
    setActive(key);
    navigate(`/my-lectures/${key}`);
  };

  return (
    <div className="lecture-navbar">
      <div className="lecture-navbar-left">
        {navItems.map((item) => (
          <div
            key={item.key}
            className={`lecture-navbar-item ${active === item.key ? "active" : ""}`}
            onClick={() => handleClick(item.key)}
          >
            {item.label}
          </div>
        ))}
      </div>

      <button 
        className="create-course-btn-small"
        onClick={() => setShowCreateModal(true)}
      >
        + Oluştur
      </button>

      {showCreateModal && (
        <CreateCourseModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
}