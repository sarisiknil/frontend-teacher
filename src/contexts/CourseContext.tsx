import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import type { ReactNode } from "react";

import {
  getCourseItem,
  updateCourse,
  startCourse,
  cancelCourse,
  completeCourse,
  getCourseSyllabus,
  insertSyllabusItem,
  removeSyllabusItem,
  orderSyllabusWeek,
  moveSyllabusItem,
  getCourseSchedule,
  insertScheduleBlock,
  updateScheduleBlock,
  removeScheduleBlock,
  clearCourseSchedule,
  requestCourseDraftReview,
} from "../api/CourseApi";

import type {
  CourseRead,
  CourseStatus,
  CourseUpdateRequest,
  CourseSyllabusRead,
  SyllabusInsertRequest,
  SyllabusRemoveRequest,
  SyllabusOrderWeekRequest,
  SyllabusMoveRequest,
  WeeklyBusyMapDTO,
  CourseScheduleInsertionRequest,
  CourseScheduleUpdateRequest,
  CourseScheduleRemovalRequest,
  CourseScheduleClearRequest,
  CourseDraftCreateRequest,
} from "../api/CourseApi";

// -----------------------------------------------------
// TYPES
// -----------------------------------------------------

interface CourseContextState {
  loading: boolean;
  error: string | null;

  course: CourseRead | null;
  syllabus: CourseSyllabusRead | null;
  schedule: WeeklyBusyMapDTO | null;

  refreshCourse: () => Promise<void>;
  refreshSyllabus: () => Promise<void>;
  refreshSchedule: () => Promise<void>;

  updateCourseInfo: (payload: CourseUpdateRequest) => Promise<void>;
  start: () => Promise<void>;
  cancel: () => Promise<void>;
  complete: () => Promise<void>;

  insertSyllabus: (payload: SyllabusInsertRequest) => Promise<void>;
  removeSyllabus: (payload: SyllabusRemoveRequest) => Promise<void>;
  reorderWeek: (payload: SyllabusOrderWeekRequest) => Promise<void>;
  moveSyllabus: (payload: SyllabusMoveRequest) => Promise<void>;

  insertSchedule: (payload: CourseScheduleInsertionRequest) => Promise<void>;
  updateSchedule: (payload: CourseScheduleUpdateRequest) => Promise<void>;
  removeSchedule: (payload: CourseScheduleRemovalRequest) => Promise<void>;
  clearSchedule: (payload: CourseScheduleClearRequest) => Promise<void>;

  requestDraft: (payload: CourseDraftCreateRequest) => Promise<void>;

  // Derived state
  isDraft: boolean;
  isPublished: boolean;
  isOngoing: boolean;
  isCompleted: boolean;
  isCancelled: boolean;

  isEditable: boolean;
  isSchedulable: boolean;
}

// -----------------------------------------------------
// CONTEXT
// -----------------------------------------------------

const CourseContext = createContext<CourseContextState | null>(null);

export function useCourse() {
  const ctx = useContext(CourseContext);
  if (!ctx) throw new Error("useCourse must be used inside <CourseProvider>");
  return ctx;
}

interface Props {
  courseId: string;
  children: ReactNode;
}

// -----------------------------------------------------
// PROVIDER
// -----------------------------------------------------
export function CourseProvider({ courseId, children }: Props) {
  const [course, setCourse] = useState<CourseRead | null>(null);
  const [syllabus, setSyllabus] = useState<CourseSyllabusRead | null>(null);
  const [schedule, setSchedule] = useState<WeeklyBusyMapDTO | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // -----------------------------------------------------
  // REFRESH COURSE
  // -----------------------------------------------------
  const refreshCourse = useCallback(async () => {
    try {
      setError(null);
      const res = await getCourseItem(courseId, true);
      setCourse(res.items[0] ?? null);
    } catch (err: any) {
      setError(err.message ?? "Failed to load course");
    }
  }, [courseId]);

  // -----------------------------------------------------
  // REFRESH SYLLABUS
  // -----------------------------------------------------
  const refreshSyllabus = useCallback(async () => {
    if (!courseId) return;
    try {
      const res = await getCourseSyllabus(courseId);
      setSyllabus(res.items[0] ?? null);
    } catch (err) {
      console.error(err);
    }
  }, [courseId]);

  // -----------------------------------------------------
  // REFRESH SCHEDULE
  // -----------------------------------------------------
  const refreshSchedule = useCallback(async () => {
    if (!courseId) return;
    try {
      const res = await getCourseSchedule(courseId);
      // weekly busy map sits inside res.items[0].busy
      setSchedule(res.items[0] ?? null);
    } catch (err) {
      console.error(err);
    }
  }, [courseId]);

  // -----------------------------------------------------
  // INITIAL LOAD
  // -----------------------------------------------------
  useEffect(() => {
    (async () => {
      setLoading(true);
      await refreshCourse();
      await refreshSyllabus();
      await refreshSchedule();
      setLoading(false);
    })();
  }, [refreshCourse, refreshSyllabus, refreshSchedule]);

  // -----------------------------------------------------
  // COURSE ACTIONS
  // -----------------------------------------------------
  const updateCourseInfo = async (payload: CourseUpdateRequest) => {
    await updateCourse(courseId, payload);
    await refreshCourse();
  };

  const start = async () => {
    await startCourse(courseId);
    await refreshCourse();
  };

  const cancel = async () => {
    await cancelCourse(courseId);
    await refreshCourse();
  };

  const complete = async () => {
    await completeCourse(courseId);
    await refreshCourse();
  };

  // -----------------------------------------------------
  // SYLLABUS ACTIONS
  // -----------------------------------------------------
  const insertSyllabus = async (payload: SyllabusInsertRequest) => {
    await insertSyllabusItem(payload);
    await refreshSyllabus();
  };

  const removeSyllabus = async (payload: SyllabusRemoveRequest) => {
    await removeSyllabusItem(payload);
    await refreshSyllabus();
  };

  const reorderWeek = async (payload: SyllabusOrderWeekRequest) => {
    await orderSyllabusWeek(payload);
    await refreshSyllabus();
  };

  const moveSyllabus = async (payload: SyllabusMoveRequest) => {
    await moveSyllabusItem(payload);
    await refreshSyllabus();
  };

  // -----------------------------------------------------
  // SCHEDULE ACTIONS
  // -----------------------------------------------------
// -----------------------------------------------------
// SCHEDULE ACTIONS  (FULL IMPLEMENTATION)
// -----------------------------------------------------
  const insertSchedule = async (payload: CourseScheduleInsertionRequest) => {
    try {
      await insertScheduleBlock(payload);
      await refreshSchedule();
    } catch (err: any) {
      console.error("insertSchedule error", err);
      setError(err.message ?? "Program eklenemedi");
    }
  };

  const updateSchedule = async (payload: CourseScheduleUpdateRequest) => {
    try {
      await updateScheduleBlock(payload);
      await refreshSchedule();
    } catch (err: any) {
      console.error("updateSchedule error", err);
      setError(err.message ?? "Program güncellenemedi");
    }
  };

  const removeSchedule = async (payload: CourseScheduleRemovalRequest) => {
    try {
      await removeScheduleBlock(payload);
      await refreshSchedule();
    } catch (err: any) {
      console.error("removeSchedule error", err);
      setError(err.message ?? "Program öğesi silinemedi");
    }
  };

  const clearSchedule = async (payload: CourseScheduleClearRequest) => {
    try {
      await clearCourseSchedule(payload);
      await refreshSchedule();
    } catch (err: any) {
      console.error("clearSchedule error", err);
      setError(err.message ?? "Program temizlenemedi");
    }
  };


  // -----------------------------------------------------
  // REQUEST DRAFT
  // -----------------------------------------------------
  const requestDraft = async (payload: CourseDraftCreateRequest) => {
    await requestCourseDraftReview(payload);
    await refreshCourse();
  };

  // -----------------------------------------------------
  // DERIVED STATE
  // -----------------------------------------------------
  const status: CourseStatus | undefined = course?.course_status;

  const value: CourseContextState = {
    loading,
    error,

    course,
    syllabus,
    schedule,

    refreshCourse,
    refreshSyllabus,
    refreshSchedule,

    updateCourseInfo,
    start,
    cancel,
    complete,

    insertSyllabus,
    removeSyllabus,
    reorderWeek,
    moveSyllabus,

    insertSchedule,
    updateSchedule,
    removeSchedule,
    clearSchedule,

    requestDraft,

    isDraft: status === "DRAFT",
    isPublished: status === "PUBLISHED",
    isOngoing: status === "ONGOING",
    isCompleted: status === "COMPLETED",
    isCancelled: status === "CANCELLED",

    isEditable: status === "DRAFT",
    isSchedulable: status === "PUBLISHED" || status === "ONGOING" || status === "DRAFT",
  };

  return (
    <CourseContext.Provider value={value}>
      {children}
    </CourseContext.Provider>
  );
}
