import "./Modal.css";

export default function Modal({
  title,
  children,
  closable = true,
  onClose,
}: {
  title: string;
  closable?: boolean;
  children: React.ReactNode;
  onClose?: () => void;
}) {
  return (
    <div className="modal-overlay">
      <div className="modal-card fade-in-scale">
        <div className="modal-header">
          <h2>{title}</h2>

          {closable && (
            <button className="modal-close-btn" onClick={onClose}>
              ✕
            </button>
          )}
        </div>

        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
