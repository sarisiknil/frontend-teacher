import {apiGet, apiPost, apiPatch, apiDelete, apiPatchForm, apiPostForm} from "./Api";
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

export type CourseDocumentRead = {
  id: string;
  document_id: string;
  course_id: string;
  uploader_profile: any | null;
  mime_type: string;
  file_size_bytes: number;
  document_type:
    | "HOMEWORK"
    | "SUMMARY"
    | "LECTURE_NOTES"
    | "READING"
    | "SOLUTION"
    | "OTHER";

  homework_answers: boolean | null;
  document_name: string;
  description: string | null;
  week: number | null;
  visible_from: string; // ISO date-time
  deadline: string | null; // ISO date-time
  deleted_at: string | null;
  created_at: string; // ISO date-time
  updated_at: string; // ISO date-time
  document_link: string;
};
export type HomeworkRead = {
  document: CourseDocumentRead;
  question_count: number;
  answers: string | null;
};
export type HomeworkSubmitRequest = {
  course_id: string;
  document_id: string;
  answers: string;
};
export type HomeworkSubmissionRead = {
  course_id: string;
  document_id: string;
  student_id: string;
  question_count: number;
  student_answers: string;
  real_answers: string;
  correct_count: number;
  wrong_count: number;
  submitted_at: string; // ISO date-time
  updated_at: string;   // ISO date-time
};
export const getCourseDocuments = (
  course_id: string,
  page: number = 0,
  page_size: number = 20
): Promise<ApiListResponse<CourseDocumentRead>> =>
  apiGet<ApiListResponse<CourseDocumentRead>>(
    "/api/course/course/documents",
    { course_id, page, page_size },
    { requireAuth: true }
  );
export const getCourseDocumentsByWeek = (
  course_id: string,
  week: number
): Promise<ApiListResponse<CourseDocumentRead>> =>
  apiGet<ApiListResponse<CourseDocumentRead>>(
    "/api/course/course/documents/by-week",
    { course_id, week },
    { requireAuth: true }
  );
export const getHomeworkByDocumentId = (
  document_id: string
): Promise<ApiListResponse<HomeworkRead>> =>
  apiGet<ApiListResponse<HomeworkRead>>(
    "/api/course/course/homework",
    { document_id },
    { requireAuth: true }
  );


export type StudentHomeworkAssignmentRead = {
  student: {
    ID: string;

    Profile: {
      ID: string;
      Name: string | null;
      Surname: string | null;
      Birthdate: string | null;
      AvatarLink: string | null;
      Statu: "ACTIVE" | "PASSIVE" | "DISABLED";
    } | null;

    School_Level: 
      | "PRIMARY_SCHOOL"
      | "SECONDARY_SCHOOL"
      | "HIGHSCHOOL"
      | "COLLEGE"
      | "GRADUATE"
      | null;

    Target_Ranking:
      | "F_1000"
      | "F_10000"
      | "F_25000"
      | "F_50000"
      | "F_100000"
      | "F_200000"
      | "F_300000"
      | "F_500000"
      | "F_1000000"
      | null;

    Province: {
      id: number;
      name: string;
    } | null;

    District: {
      id: number;
      province_id: number;
      name: string;
    } | null;

    School: {
      id: number;
      district_id: number;
      name: string;
      level:
        | "PRIMARY_SCHOOL"
        | "SECONDARY_SCHOOL"
        | "HIGHSCHOOL"
        | "COLLEGE"
        | "GRADUATE";
      private: boolean;
    } | null;
  };

  assignment: {
    document_id: string;
    question_count: number;
    real_answers: string;
    is_submitted: boolean;

    student_answers: string | null;
    correct_count: number | null;
    wrong_count: number | null;

    submitted_at: string | null; // ISO date-time
    updated_at: string | null;   // ISO date-time
  };
};
export const getHomeworkSubmissionsByDocument = (
  course_id: string,
  document_id: string,
  page: number = 0,
  page_size: number = 20
): Promise<ApiListResponse<StudentHomeworkAssignmentRead>> =>
  apiGet<ApiListResponse<StudentHomeworkAssignmentRead>>(
    "/api/course/course/documents/homework/submissions",
    {
      course_id,
      document_id,
      page,
      page_size,
    },
    { requireAuth: true }
  );

 export type CourseDocumentCreateRequest = {
  course_ids: string[]; // one or more course UUIDs
  document_type:
    | "HOMEWORK"
    | "SUMMARY"
    | "LECTURE_NOTES"
    | "READING"
    | "SOLUTION"
    | "OTHER";

  document_name: string;

  description?: string | null;
  week?: number | null;
  visible_from?: string | null; // ISO date-time
  deadline?: string | null;     // ISO date-time

  file: File;
};

export const createCourseDocument = (
  payload: CourseDocumentCreateRequest
): Promise<ApiListResponse<CourseDocumentRead>> => {
  const form = new FormData();

  // multiple course_ids
  payload.course_ids.forEach((id) => {
    form.append("course_ids", id);
  });

  form.append("document_type", payload.document_type);
  form.append("document_name", payload.document_name);

  if (payload.description != null) {
    form.append("description", payload.description);
  }

  if (payload.week != null) {
    form.append("week", String(payload.week));
  }

  if (payload.visible_from != null) {
    form.append("visible_from", payload.visible_from);
  }

  if (payload.deadline != null) {
    form.append("deadline", payload.deadline);
  }

  form.append("file", payload.file);

  return apiPostForm<ApiListResponse<CourseDocumentRead>>(
    "/api/course/course/documents/create",
    form,
    { requireAuth: true }
  );
};

export type CourseDocumentDeleteRequest = {
  course_id: string;            // required (ownership context)
  id?: string | null;           // selector (row PK)
  document_id?: string | null;  // selector (shared)
};

export const deleteCourseDocument = (
  payload: CourseDocumentDeleteRequest
): Promise<ApiListResponse<null>> =>
  apiDelete<ApiListResponse<null>>(
    "/api/course/course/documents",
    payload,
    { requireAuth: true }
  );
export type CourseDocumentUpdateRequest = {
  /** Ownership context (REQUIRED) */
  course_id: string;

  /** Selector: exactly ONE must be provided */
  id?: string | null;
  document_id?: string | null;

  /** Semantic fields (at least one required) */
  document_name?: string | null;
  description?: string | null;

  document_type?:
    | "HOMEWORK"
    | "SUMMARY"
    | "LECTURE_NOTES"
    | "READING"
    | "SOLUTION"
    | "OTHER"
    | null;

  week?: number | null;
  visible_from?: string | null;
  deadline?: string | null;
};


export const updateCourseDocument = (
  course_id: string,
  body: Omit<CourseDocumentUpdateRequest, "course_id">
): Promise<ApiListResponse<CourseDocumentRead>> =>
  apiPatch<ApiListResponse<CourseDocumentRead>>(
    `/api/course/course/documents/update?${new URLSearchParams({ course_id }).toString()}`,
    body,
    { requireAuth: true }
  );



export const updateCourseDocumentFile = (
  course_id: string,
  document_id: string,
  file: File
): Promise<ApiListResponse<CourseDocumentRead>> => {
  const form = new FormData();
  form.append("file", file);

  const qs = new URLSearchParams({ course_id, document_id }).toString();

  return apiPatchForm<ApiListResponse<CourseDocumentRead>>(
    `/api/course/course/documents/update-file?${qs}`, 
    form,
    { requireAuth: true }
  );
};

export type HomeworkUpsertRequest = {
  course_id: string;
  document_id: string;
  question_count: number;
  answers: string;
};
export const upsertHomework = (
  payload: HomeworkUpsertRequest
): Promise<ApiListResponse<HomeworkRead>> =>
  apiPost<ApiListResponse<HomeworkRead>>(
    "/api/course/course/documents/homeworks/upsert",
    payload,
    { requireAuth: true }
  );