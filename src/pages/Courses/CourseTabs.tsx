// pages/Course/CourseTabs.tsx
interface Props {
  activeTab: string;
  setActiveTab: (v: any) => void;
}

export default function CourseTabs({ activeTab, setActiveTab }: Props) {
  const tabs = [
    { id: "dersim", label: "Dersim" },
    { id: "materyaller", label: "Materyaller" },
    { id: "analiz", label: "Kurs Analizi" },
    { id: "anons", label: "Anonslarım" },

  ];

  return (
    <div className="course-tabs">
      {tabs.map(t => (
        <div
          key={t.id}
          className={`course-tab-item ${activeTab === t.id ? "active" : ""}`}
          onClick={() => setActiveTab(t.id)}
        >
          {t.label}
        </div>
      ))}
    </div>
  );
}
