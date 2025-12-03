import "./SubNavbar.css";

export default function SubNavbar({
  options,
  active,
  setActive,
}: {
  options: string[];
  active: string;
  setActive: (v: string) => void;
}) {
  return (
    <div className="subnavbar">
      {options.map((opt) => (
        <div
          key={opt}
          className={`subnavbar-item ${active === opt ? "active" : ""}`}
          onClick={() => setActive(opt)}
        >
          {opt}
        </div>
      ))}
    </div>
  );
}
