import { apiGet, apiPost, apiPatch, apiPatchForm } from "./Api";

export interface ProfileInfo {
  teacher_id: string;
  name: string | null;
  surname: string | null;
  birth_date: string | null;
  avatar_link: string | null;
  status: string | null;
}

export interface ProfileUpdateInput {
  name?: string;
  surname?: string;
  birthdate?: string;
}

export interface ProfileUpdateResult {
  ID: string;
  Name: string;
  Surname: string;
  Birthdate: string;
  AvatarLink: string;
  Statu: string;
}

export interface ProfilePictureResult {
  ID: string;
  Name: string;
  Surname: string;
  Birthdate: string;
  AvatarLink: string;
  Statu: string;
}

export interface TeacherProfileEmbedded {
  user_id: string;
  name: string | null;
  surname: string | null;
  birth_date: string | null;
  avatar_link: string | null;
  status: string | null;
}

export interface TeacherSubbranch {
  branch_id: string;
  name: string;
}

export interface TeacherOverview {
  user_id: string;
  Profile: TeacherProfileEmbedded | null;
  Subbranches: TeacherSubbranch[] | null;

  First_Teaching_Year: number | null;
  Avg_score: number | null;
  Review_count: number | null;
  Statu: string | null;
  Primary_Branch: string | null;
  Biography: string | null;
}

export interface TeacherReview {
  ID: string;
  Reviewer_ID: string | null;
  Reviewer_Name: string | null;
  Reviewer_Surname: string | null;
  Score: number | null;
  Review: string | null;
  Is_Anonymous: boolean | null;
  Moderation_Status: "PENDING" | "APPROVED" | null;
  Published_At: string | null;
  Edited_At: string | null;
  Created_At: string | null;
  Updated_At: string | null;
}

export interface TeacherReviews {
  Total_Reviews: number;
  Review_Score: number | null;
  Reviews: TeacherReview[];
}

export interface TeacherSubbranchChangeInput {
  added?: string[];
  removed?: string[];
}

export type TeacherSubbranchChangeResult = TeacherOverview;


export interface TeacherUpdateInput {
  first_teaching_year?: number;
  biography?: string;
  primary_branch?: string;
}

export type TeacherUpdateResult = TeacherOverview;

export interface TeacherApprovalRequestInput {
  applicant_comment: string;
}

export type TeacherApprovalRequestResult = TeacherOverview;

export interface TeacherApproval {
    ID: string;
    Teacher_ID: string;
    Statu: "PENDING" | "APPROVED" | "REJECTED";
    Applicant_Comment: string | null;
    Reviewer_ID: string | null;
    Decided_At: string | null;
    Created_At: string;
    Updated_At: string;
}

export interface TeacherApprovalListResult {
    code: number;
    message: string;
    items: TeacherApproval[];
}


export const getProfile = async (profile_id: string): Promise<ProfileInfo> => {
  const res = await apiGet<any>(
    "/api/course/profile",
    { profile_id },
    { requireAuth: true }
  );

  const it = res.items[0];
  return {
    teacher_id: it.ID,
    name: it.Name ?? null,
    surname: it.Surname ?? null,
    birth_date: it.Birthdate ?? null,
    avatar_link: it.AvatarLink ?? null,
    status: it.Statu ?? null,
  };
};

export const updateProfile = (
  payload: ProfileUpdateInput
): Promise<ProfileUpdateResult> =>
  apiPatch<{ items: ProfileUpdateResult[] }>(
    "/api/course/profile/update",
    payload,
    { requireAuth: true }
  ).then((r) => r.items[0]);

export const updateProfilePicture = async (
  file: File
): Promise<ProfilePictureResult> => {
  const form = new FormData();
  form.append("file", file);

  const res = await apiPatchForm<{ items: ProfilePictureResult[] }>(
    "/api/course/profile/picture",
    form,
    { requireAuth: true }
  );

  return res.items[0];
};

export const getOverview = async (
  teacher_id: string
): Promise<TeacherOverview> => {
  const res = await apiGet<any>(
    "/api/course/teacher/overview",
    { teacher_id },
    { requireAuth: true }
  );

  const it = res.items[0];

  return {
    user_id: it.ID,
    Profile: it.Profile ?? null,

    Subbranches:
      it.Subbranches?.map((sb: any) => ({
        branch_id: sb.ID ?? sb.id ?? "",
        name: sb.name,
      })) ?? null,

    First_Teaching_Year: it.First_Teaching_Year ?? null,
    Avg_score: it.Avg_score ?? null,
    Review_count: it.Review_count ?? null,
    Statu: it.Statu ?? null,
    Primary_Branch: it.Primary_Branch ?? null,
    Biography: it.Biography ?? null,
  };
};


export const updateTeacher = (
  payload: TeacherUpdateInput
): Promise<TeacherUpdateResult> =>
  apiPatch<{ items: TeacherUpdateResult[] }>(
    "/api/course/teacher/update",
    payload,
    { requireAuth: true }
  ).then((r) => r.items[0]);


export const changeTeacherSubbranches = (
  payload: TeacherSubbranchChangeInput
): Promise<TeacherSubbranchChangeResult> =>
  apiPatch<{ items: TeacherSubbranchChangeResult[] }>(
    "/api/course/teacher/subbranches/change",
    payload,
    { requireAuth: true }
  ).then((r) => r.items[0]);


export const getTeacherReviews = (
  teacher_id: string,
  page: number = 0
): Promise<TeacherReviews> =>
  apiGet<{ items: TeacherReviews[] }>(
    "/api/course/teacher/reviews",
    { teacher_id, page },
    { requireAuth: true }
  ).then((r) => r.items[0]);


export const requestTeacherApproval = (
  applicant_comment: string
): Promise<TeacherApprovalRequestResult> =>
  apiPost<{ items: TeacherApprovalRequestResult[] }>(
    "/api/course/teacher/approval/request",
    { applicant_comment },
    { requireAuth: true }
  ).then((r) => r.items[0]);

export const getTeacherApprovals = async (
  teacher_id: string
): Promise<TeacherApproval[]> => {
  const res = await apiGet<{ items: TeacherApproval[] }>(
      `/api/course/teacher/approvals/${teacher_id}`,
      {},
      { requireAuth: true }
  );

  return res.items;
};
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
  description: string;
  is_active: boolean;
};

export type Subbranch = {
  id: string;
  level_id: string;
  branch: string;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
};

export type Units = {
  id: string;
  subbranch_id: string;
  branch: string;
  name: string;
  code: string;
  description: string;
  order_index: number;
  is_active: boolean;
};

export type SubUnits = {
  id: string;
  unit_id: string;
  branch: string;
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
  branch: string;
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