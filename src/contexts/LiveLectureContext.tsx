import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  getLessonStatus,
  postCreateLesson,
  postGenerateJoinToken,
  getVerifyLessonToken,
} from "../api/LiveLectureApi";

import type { LiveLectureStatus, ZoomJWT } from "../api/live_lecture_types";

interface LiveLectureContextState {
  status: LiveLectureStatus | null;
  loading: boolean;
  error: string | null;

  canEnter: boolean;
  zoomJWT: string | null;
  topic: string | null;

  refreshStatus: () => Promise<void>;
  beginJoinFlow: () => Promise<void>;
}

const LiveLectureContext = createContext<LiveLectureContextState | null>(null);

export function useLiveLecture() {
  const ctx = useContext(LiveLectureContext);
  if (!ctx) throw new Error("useLiveLecture must be used inside provider");
  return ctx;
}

export function LiveLectureProvider({
  courseId,
  children,
}: {
  courseId: string;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();

  const [status, setStatus] = useState<LiveLectureStatus | null>(null);
  const [zoomJWT, setZoomJWT] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState<string| null>(null);

  const refreshStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLessonStatus(courseId);
      setStatus(res.items[0] ?? null);
      setTopic(res.meta!.lesson_id as string ?? null)
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    refreshStatus();
    const id = setInterval(refreshStatus, 30_000);
    return () => clearInterval(id);
  }, [refreshStatus]);

  const canEnter =
    status === "ACTIVE_LESSON" ||
    status === "CREATABLE_WINDOW";

  const beginJoinFlow = async () => {
    if (!canEnter) return;

    setLoading(true);
    try {
      const res = await postCreateLesson(courseId, "Teacher started live lecture");
      console.log(res.items[0]);
      const tokenRes = await postGenerateJoinToken(courseId);
      //console.log(tokenRes);
      const token = tokenRes.items[0].token;
      if (!token) throw new Error("Zoom JWT missing");

      const verify = await getVerifyLessonToken(token.toString());
      if (!verify.items[0]) throw new Error("Token verification failed");
      
      setZoomJWT(token.toString());
      navigate(`/course/${courseId}/live-lecture`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LiveLectureContext.Provider
      value={{
        status,
        loading,
        error,
        canEnter,
        zoomJWT,
        topic,
        refreshStatus,
        beginJoinFlow,
      }}
    >
      {children}
    </LiveLectureContext.Provider>
  );
}
