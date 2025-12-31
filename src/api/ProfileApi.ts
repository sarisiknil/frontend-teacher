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
    "/api/course_profile/profile",
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
    "/api/course_profile/profile/update",
    payload,
    { requireAuth: true }
  ).then((r) => r.items[0]);

export const updateProfilePicture = async (
  file: File
): Promise<ProfilePictureResult> => {
  const form = new FormData();
  form.append("file", file);

  const res = await apiPatchForm<{ items: ProfilePictureResult[] }>(
    "/api/course_profile/profile/picture",
    form,
    { requireAuth: true }
  );

  return res.items[0];
};

export const getOverview = async (
  teacher_id: string
): Promise<TeacherOverview> => {
  const res = await apiGet<any>(
    "/api/course_profile/teacher/overview",
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
    "/api/course_profile/teacher/update",
    payload,
    { requireAuth: true }
  ).then((r) => r.items[0]);


export const changeTeacherSubbranches = (
  payload: TeacherSubbranchChangeInput
): Promise<TeacherSubbranchChangeResult> =>
  apiPatch<{ items: TeacherSubbranchChangeResult[] }>(
    "/api/course_profile/teacher/subbranches/change",
    payload,
    { requireAuth: true }
  ).then((r) => r.items[0]);


export const getTeacherReviews = (
  teacher_id: string,
  page: number = 0
): Promise<TeacherReviews> =>
  apiGet<{ items: TeacherReviews[] }>(
    "/api/course_profile/teacher/reviews",
    { teacher_id, page },
    { requireAuth: true }
  ).then((r) => r.items[0]);


export const requestTeacherApproval = (
  applicant_comment: string
): Promise<TeacherApprovalRequestResult> =>
  apiPost<{ items: TeacherApprovalRequestResult[] }>(
    "/api/course_profile/teacher/approval/request",
    { applicant_comment },
    { requireAuth: true }
  ).then((r) => r.items[0]);

export const getTeacherApprovals = async (
  teacher_id: string
): Promise<TeacherApproval[]> => {
  const res = await apiGet<{ items: TeacherApproval[] }>(
      `/api/course_profile/teacher/approvals/${teacher_id}`,
      {},
      { requireAuth: true }
  );

  return res.items;
};
