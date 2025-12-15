import { apiGet, apiPost, apiPatch, apiDelete, apiPatchForm } from "./Api";

// ============================================================
// CURRICULUM TYPES
// ============================================================

export type ApiListResponse<T> = {
  code: number;
  message: string;
  items: T[];
  errors?: {
    input_index: number;
    error_code: string;
    detail: string;
    parent_id?: string;
  }[];
  meta?: Record<string, unknown>;
};

export type Level = {
  id: string;
  name: string;
  code: string;
  description: string; // backend may return null; adjust to string | null if needed
  is_active: boolean;
};

export type Subbranch = {
  id: string;
  level_id: string;
  branch: Branch;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
};

export type Units = {
  id: string;
  subbranch_id: string;
  branch: Branch;
  name: string;
  code: string;
  description: string;
  order_index: number;
  is_active: boolean;
};

export type SubUnits = {
  id: string;
  unit_id: string;
  branch: Branch;
  name: string;
  code: string;
  description: string;
  order_index: number;
  is_active: boolean;
  hardness: string;
  priority: string;
  background_level: string;
  detail: string;
};

export type Outcomes = {
  id: string;
  subunit_id: string;
  branch: Branch;
  code: string;
  description: string;
  order_index: number;
  is_active: boolean;
};

export type FullTreeLevel = Level & {
  subbranches: Subbranch[];
};

// ---------- LEVELS ----------
export const getLevels = (): Promise<ApiListResponse<Level>> =>
  apiGet("/api/curriculum/levels", {}, { requireAuth: true });

// ---------- FULL TREE ----------
export const getFullTree = (): Promise<ApiListResponse<FullTreeLevel>> =>
  apiGet("/api/curriculum/full-tree", {}, { requireAuth: true });

// ---------- CHILD NODES ----------
export const readChildSubbranches = (
  levelIds: string[]
): Promise<ApiListResponse<Subbranch>> =>
  apiPost(
    "/api/curriculum/children/subbranches",
    levelIds,
    { requireAuth: true }
  );

export const readChildUnits = (
  subbranchIds: string[]
): Promise<ApiListResponse<Units>> =>
  apiPost(
    "/api/curriculum/children/units",
    subbranchIds,
    { requireAuth: true }
  );

export const readChildSubunits = (
  unitIds: string[]
): Promise<ApiListResponse<SubUnits>> =>
  apiPost(
    "/api/curriculum/children/subunits",
    unitIds,
    { requireAuth: true }
  );

export const readChildOutcomes = (
  subunitIds: string[]
): Promise<ApiListResponse<Outcomes>> =>
  apiPost(
    "/api/curriculum/children/outcomes",
    subunitIds,
    { requireAuth: true }
  );

// ---------- PARENT NODES ----------
export const getParentLevelBySubbranch = (
  subbranchId: string
): Promise<ApiListResponse<Level>> =>
  apiGet(
    `/api/curriculum/parents/level/${encodeURIComponent(subbranchId)}`,
    {},
    { requireAuth: true }
  );

export const getParentSubbranchByUnit = (
  unitId: string
): Promise<ApiListResponse<Subbranch>> =>
  apiGet(
    `/api/curriculum/parents/subbranch/${encodeURIComponent(unitId)}`,
    {},
    { requireAuth: true }
  );

export const getParentUnitBySubunit = (
  subunitId: string
): Promise<ApiListResponse<Units>> =>
  apiGet(
    `/api/curriculum/parents/unit/${encodeURIComponent(subunitId)}`,
    {},
    { requireAuth: true }
  );

export const getParentSubunitByOutcome = (
  outcomeId: string
): Promise<ApiListResponse<SubUnits>> =>
  apiGet(
    `/api/curriculum/parents/subunit/${encodeURIComponent(outcomeId)}`,
    {},
    { requireAuth: true }
  );

// ============================================================
// COURSE TYPES
// ============================================================

export type CourseStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ONGOING"
  | "CANCELLED"
  | "COMPLETED";

export type Branch =
  | "TURKCE"
  | "MATEMATIK"
  | "FIZIK"
  | "KIMYA"
  | "BIYOLOJI"
  | "TARIH"
  | "COGRAFYA"
  | "FELSEFE"
  | "DIN_KULTURU_VE_AHLAK_BILGISI"
  | "TURK_DILI_VE_EDEBIYATI"
  | "GEOMETRI"
  | "PSIKOLOJI"
  | "SOSYOLOJI"
  | "MANTIK"
  | "INGILIZCE"
  | "ALMANCA"
  | "FRANSIZCA"
  | "ARAPCA"
  | "RUSCA";

// ----------- Teacher Overview (nullable everywhere) -----------
export type TeacherOverviewInCourse = any | null;

// ----------- MAIN COURSE DTO -----------
export interface CourseRead {
  course_id: string;
  course_name: string;
  teacher_id: string;

  course_level: Level | null;
  course_subbranch: Subbranch | null;

  course_students: number;
  course_capacity: number;
  course_price: string;

  course_status: CourseStatus;

  completed_lessons: number;
  total_lessons: number;
  course_difficulty: CourseDifficulty | null;
  course_type: CourseType | null;

  banner_url: string | null;

  description: string | null;
  start_date: string;

  teacher_overview: TeacherOverviewInCourse;
}

// ---------- COURSE ENDPOINTS ----------

export const getCoursesByTeacher = (
  teacher_id: string
): Promise<ApiListResponse<CourseRead>> =>
  apiGet<ApiListResponse<CourseRead>>(
    "/api/course/course/by-teacher",
    { teacher_id },
    { requireAuth: true }
  );

export const getCoursesBatch = (
  course_ids: string[],
  include_teacher_overview: boolean = false
): Promise<ApiListResponse<CourseRead>> => {
  const query: Record<string, string | number> = {
    include_teacher_overview: include_teacher_overview ? 1 : 0,
  };

  course_ids.forEach((id, index) => {
    query[`course_ids[${index}]`] = id;
  });

  return apiGet<ApiListResponse<CourseRead>>(
    "/api/course/course/batch",
    query,
    { requireAuth: true }
  );
};


export const getCourseItem = (
  course_id: string,
  load_teacher: boolean = false
): Promise<ApiListResponse<CourseRead>> =>
  apiGet(
    "/api/course/course/item",
    {
      course_id,
      load_teacher: load_teacher ? 1 : 0,
    },
    { requireAuth: true }
  );
export const createCourse = (
  start_date?: string | null
): Promise<ApiListResponse<CourseRead>> =>
  apiPost<ApiListResponse<CourseRead>>(
    `/api/course/course/create${start_date ? `?start_date=${start_date}` : ""}`,
    {},
    { requireAuth: true }
  );
export type CourseDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type CourseType = "QUESTIONS" | "LECTURE";
export interface CourseUpdateRequest {
  course_name?: string | null;
  capacity?: number | null;
  price?: number | string | null;
  total_lessons?: number | null;
  difficulty?: CourseDifficulty | null;
  course_type?: CourseType | null;
  banner_url?: string | null;
  description?: string | null;
  subbranch_id?: string | null;
  start_date?: string | null;
  level_id?: string | null;
}
export const updateCourse = (
  course_id: string,
  payload: CourseUpdateRequest
): Promise<ApiListResponse<CourseRead>> =>
  apiPatch<ApiListResponse<CourseRead>>(
    `/api/course/course/update?course_id=${course_id}`,
    payload,
    { requireAuth: true }
  );
export const startCourse = (
  course_id: string
): Promise<ApiListResponse<CourseRead>> =>
  apiPatch<ApiListResponse<CourseRead>>(
    `/api/course/course/start?course_id=${course_id}`,
    {},
    { requireAuth: true }
  );
export const cancelCourse = (
  course_id: string
): Promise<ApiListResponse<CourseRead>> =>
  apiPatch<ApiListResponse<CourseRead>>(
    `/api/course/course/cancel?course_id=${course_id}`,
    {},
    { requireAuth: true }
  );
export const completeCourse = (
  course_id: string
): Promise<ApiListResponse<CourseRead>> =>
  apiPatch<ApiListResponse<CourseRead>>(
    `/api/course/course/complete?course_id=${course_id}`,
    {},
    { requireAuth: true }
  );
export const clearCourseEnrollments = (
  course_id: string
): Promise<ApiListResponse<null>> =>
  apiPatch<ApiListResponse<null>>(
    `/api/course/course/clear-enrollments?course_id=${course_id}`,
    {},
    { requireAuth: true }
  );
// ----------- COURSE DRAFT STATUS -----------
export type CourseDraftStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

// ----------- COURSE DRAFT READ DTO -----------
export interface CourseDraftRead {
  draft_id: string;
  course_id: string;
  status: CourseDraftStatus;
  reviewer_id: string | null;
  applicant_comment: string | null;
  reviewer_comment: string | null;
  decided_at: string | null;
  created_at: string;  
  updated_at: string;  
}

// ----------- DRAFT REQUEST PAYLOAD -----------
export interface CourseDraftCreateRequest {
  course_id: string;
  applicant_comment?: string | null;
}

// ----------- POST: /course/draft/request -----------
export const requestCourseDraftReview = (
  payload: CourseDraftCreateRequest
): Promise<ApiListResponse<CourseDraftRead>> =>
  apiPost<ApiListResponse<CourseDraftRead>>(
    "/api/course/course/draft/request",
    payload,
    { requireAuth: true }
  );

// ----------- GET: /course/draft/pending -----------
export const getPendingCourseDrafts = (
  page: number = 0,
  page_size: number = 10
): Promise<ApiListResponse<CourseDraftRead>> =>
  apiGet<ApiListResponse<CourseDraftRead>>(
    "/api/course/course/draft/pending",
    { page, page_size },
    { requireAuth: true }
  );

// ----------- GET: /course/draft/by-course -----------
export const getDraftsByCourse = (
  course_id: string
): Promise<ApiListResponse<CourseDraftRead>> =>
  apiGet<ApiListResponse<CourseDraftRead>>(
    "/api/course/course/draft/by-course",
    { course_id },
    { requireAuth: true }
  );
// ------------ ENUMS -------------
export type SubunitHardness = "LOW" | "MEDIUM" | "HIGH";
export type SubunitPriority = "LOW" | "MEDIUM" | "HIGH";
export type SubunitBackgroundLevel = "LOW" | "MEDIUM" | "HIGH";
export type SubunitDetail = "LOW" | "MEDIUM" | "HIGH";
export interface OutcomeRead {
  id: string;
  subunit_id: string;
  branch: Branch;
  code: string;
  description: string | null;
  order_index: number;
  is_active: boolean;
}

export interface SubunitTree {
  parent_unit_id: string;
  id: string;
  branch: Branch;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;

  order_index: number;

  hardness: SubunitHardness | null;
  priority: SubunitPriority | null;
  background_level: SubunitBackgroundLevel | null;
  detail: SubunitDetail | null;
  outcomes: OutcomeRead[];
}
export interface CourseSyllabusRow {
  id: string;
  course_id: string;

  subunit: SubunitTree | null;

  target_week: number;
  order_index: number;

  created_at: string;  // datetime
  updated_at: string;  // datetime
}
export interface CourseSyllabusRead {
  course_id: string;
  items: CourseSyllabusRow[];
}
export interface SyllabusInsertRequest {
  course_id: string;
  subunit_id: string;
  target_week: number; // min 1
  order_index?: number | null;
}

export interface SyllabusRemoveRequest {
  course_id: string;
  syllabus_id: string;
}

export interface SyllabusOrderWeekRequest {
  course_id: string;
  target_week: number;
  ordered_syllabus_ids: string[];
}

export interface SyllabusMoveRequest {
  course_id: string;
  syllabus_id: string;
  new_week: number;
  new_order_index?: number | null;
}
export const getCourseSyllabus = (
  course_id: string
): Promise<ApiListResponse<CourseSyllabusRead>> =>
  apiGet<ApiListResponse<CourseSyllabusRead>>(
    "/api/course/course/syllabus",
    { course_id },
    { requireAuth: true }
  );
export const insertSyllabusItem = (
  payload: SyllabusInsertRequest
): Promise<ApiListResponse<CourseSyllabusRead>> =>
  apiPost<ApiListResponse<CourseSyllabusRead>>(
    "/api/course/course/syllabus/insert",
    payload,
    { requireAuth: true }
  );
export const removeSyllabusItem = (
  payload: SyllabusRemoveRequest
): Promise<ApiListResponse<CourseSyllabusRead>> =>
  apiDelete<ApiListResponse<CourseSyllabusRead>>(
    "/api/course/course/syllabus/remove",
    payload,
    { requireAuth: true }
  );

export const orderSyllabusWeek = (
  payload: SyllabusOrderWeekRequest
): Promise<ApiListResponse<CourseSyllabusRead>> =>
  apiPatch<ApiListResponse<CourseSyllabusRead>>(
    "/api/course/course/syllabus/order-week",
    payload,
    { requireAuth: true }
  );
export const moveSyllabusItem = (
  payload: SyllabusMoveRequest
): Promise<ApiListResponse<CourseSyllabusRead>> =>
  apiPatch<ApiListResponse<CourseSyllabusRead>>(
    "/api/course/course/syllabus/move",
    payload,
    { requireAuth: true }
  );
// ----------------------------------------------------
// INTERVAL + SOURCE DTO
// ----------------------------------------------------
export interface IntervalSourceDTO {
  kind: string;
  object_id: string; // uuid
}

export interface IntervalDTO {
  id: string | null;
  start_time: string;  // HH:MM or HH:MM:SS
  end_time: string;    // HH:MM or HH:MM:SS
  source: IntervalSourceDTO;
}

// ----------------------------------------------------
// WEEKLY BUSY MAP
// busy[1..7] = IntervalDTO[]
// ----------------------------------------------------
export interface WeeklyBusyMapDTO {
  busy: Record<number, IntervalDTO[]>; 
}
export interface CourseScheduleInsertionRequest {
  course_id: string;
  day_of_week: number;   // 1–7
  start_time: string;    // "HH:MM" or "HH:MM:SS"
  end_time: string;      // same format
}
export interface CourseScheduleUpdateRequest {
  course_id: string;
  schedule_id: string;
  new_day_of_week: number; // 1–7
  new_start_time: string;
  new_end_time: string;
}
export interface CourseScheduleRemovalRequest {
  course_id: string;
  schedule_id: string;
}
export interface CourseScheduleClearRequest {
  course_id: string;
}
export type ScheduleResponse = ApiListResponse<WeeklyBusyMapDTO>;

export const getCourseSchedule = (
  course_id: string
): Promise<ScheduleResponse> =>
  apiGet<ScheduleResponse>(
    "/api/course/course/schedule/by-course",
    { course_id },
    { requireAuth: true }
  );
export const getTeacherSchedule = (
  teacher_id: string
): Promise<ScheduleResponse> =>
  apiGet<ScheduleResponse>(
    "/api/course/course/schedule/by-teacher",
    { teacher_id },
    { requireAuth: true }
  );

export const insertScheduleBlock = (
  payload: CourseScheduleInsertionRequest
): Promise<ScheduleResponse> =>
  apiPost<ScheduleResponse>(
    "/api/course/course/schedule/insert",
    payload,
    { requireAuth: true }
  );
export const updateScheduleBlock = (
  payload: CourseScheduleUpdateRequest
): Promise<ScheduleResponse> =>
  apiPatch<ScheduleResponse>(
    "/api/course/course/schedule/update",
    payload,
    { requireAuth: true }
  );
export const removeScheduleBlock = (
  payload: CourseScheduleRemovalRequest
): Promise<ScheduleResponse> =>
  apiDelete<ScheduleResponse>(
    "/api/course/course/schedule/remove",
    payload,
    { requireAuth: true }
  );
export const clearCourseSchedule = (
  payload: CourseScheduleClearRequest
): Promise<ScheduleResponse> =>
  apiPost<ScheduleResponse>(
    "/api/course/course/schedule/clear",
    payload,
    { requireAuth: true }
  );

export const uploadCourseBanner = async (
  course_id: string,
  file: File
): Promise<CourseRead> => {
  const form = new FormData();
  form.append("file", file);
  const res = await apiPatchForm<ApiListResponse<CourseRead>>(
    `/api/course/course/banner?course_id=${course_id}`, 
    form,
    { 
      requireAuth: true 
    }
  );

  // Return the single item directly
  return res.items[0];
};