import { useLiveLecture } from "../../contexts/LiveLectureContext";

export default function CourseLiveLectureCard() {
  const { canEnter, loading, error, beginJoinFlow } = useLiveLecture();

  if (!canEnter) return null;

  return (
    <div className="live-lecture-card">
      <div>
        <h3>🎥 Live Lecture</h3>
        <p>The lecture is about to start or already live.</p>
        {error && <p className="error">{error}</p>}
      </div>

      <button onClick={beginJoinFlow} disabled={loading}>
        {loading ? "Joining..." : "Enter Live Lecture"}
      </button>
    </div>
  );
}
