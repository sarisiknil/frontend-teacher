import { apiGet, apiPost, apiPatch, apiPatchForm } from "./Api";

// ---------------------------------------------
// PROFILE
// ---------------------------------------------

export interface ProfileInfo {
  teacher_id: string;
  name: string;
  surname: string;
  birth_date: string;
  avatar_link: string;
  status: string;
}

export const getProfile = async (profile_id: string): Promise<ProfileInfo> => {
  const res = await apiGet<any>("/api/course/profile", { profile_id }, { requireAuth: true });
  const it = res.items[0];

  return {
    teacher_id: it.ID,
    name: it.Name,
    surname: it.Surname,
    birth_date: it.Birthdate,
    avatar_link: it.AvatarLink,
    status: it.Statu,
  };
};

// ---------------------------------------------
// TEACHER OVERVIEW
// ---------------------------------------------

export interface TeacherOverview {
  user_id: string;

  Profile: {
    user_id: string;
    name: string | null;
    surname: string | null;
    birth_date: string | null;
    avatar_url: string | null;
    status: string | null;
  } | null;

  Subbranches: {
    branch_id: string;
    name: string;
  }[] | null;

  First_Teaching_Year: number | null;
  Avg_score: number | null;
  Review_count: number | null;
  Statu: string | null;
  Primary_Branch: string | null;
  Biography: string | null;
}

interface RawSubbranch {
  ID?: string;
  id?: string;
  name: string;
}

export const getOverview = async (teacher_id: string): Promise<TeacherOverview> => {
  const res = await apiGet<any>(
    "/api/course/teacher/overview",
    { teacher_id },
    { requireAuth: true }
  );

  const it = res.items[0];

  return {
    user_id: it.ID,

    Profile: it.Profile,
    
    Subbranches:
      (it.Subbranches as RawSubbranch[] | null)?.map((sb: RawSubbranch) => ({
        branch_id: sb.ID ?? sb.id ?? "",
        name: sb.name,
      })) ?? null,

    First_Teaching_Year: it.First_Teaching_Year,
    Avg_score: it.Avg_score,
    Review_count: it.Review_count,
    Statu: it.Statu,
    Primary_Branch: it.Primary_Branch,
    Biography: it.Biography,
  };
};


// ---------------------------------------------
// TEACHER REVIEWS
// ---------------------------------------------

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

export const getTeacherReviews = (
  teacher_id: string,
  page: number = 0
): Promise<TeacherReviews> =>
  apiGet<{ items: TeacherReviews[] }>(
    "/api/course/teacher/reviews",
    { teacher_id, page },
    { requireAuth: true }
  ).then(r => r.items[0]);

// ---------------------------------------------
// PROFILE UPDATE
// ---------------------------------------------

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

export const updateProfile = (
  payload: ProfileUpdateInput
): Promise<ProfileUpdateResult> =>
  apiPatch<{ items: ProfileUpdateResult[] }>(
    "/api/course/profile/update",
    payload,
    { requireAuth: true }
  ).then(r => r.items[0]);

// ---------------------------------------------
// PROFILE PICTURE UPDATE
// ---------------------------------------------

export interface ProfilePictureResult {
  ID: string;
  Name: string;
  Surname: string;
  Birthdate: string;
  AvatarLink: string;
  Statu: string;
}

export const updateProfilePicture = (
  file: File
): Promise<ProfilePictureResult> => {
  const form = new FormData();
  form.append("file", file);

  return apiPatchForm<{ items: ProfilePictureResult[] }>(
    "/api/course/profile/picture",
    form,
    { requireAuth: true }
  ).then(r => r.items[0]);
};

// ---------------------------------------------
// TEACHER UPDATE
// ---------------------------------------------

export interface TeacherUpdateInput {
  first_teaching_year?: number;
  biography?: string;
  primary_branch?: string;
}

export type TeacherUpdateResult = TeacherOverview;

export const updateTeacher = (
  payload: TeacherUpdateInput
): Promise<TeacherUpdateResult> =>
  apiPatch<{ items: TeacherUpdateResult[] }>(
    "/api/course/teacher/update",
    payload,
    { requireAuth: true }
  ).then(r => r.items[0]);

// ---------------------------------------------
// SUBBRANCH CHANGE
// ---------------------------------------------

export interface TeacherSubbranchChangeInput {
  added?: string[];
  removed?: string[];
}

export type TeacherSubbranchChangeResult = TeacherOverview;

export const changeTeacherSubbranches = (
  payload: TeacherSubbranchChangeInput
): Promise<TeacherSubbranchChangeResult> =>
  apiPatch<{ items: TeacherSubbranchChangeResult[] }>(
    "/api/course/teacher/subbranches/change",
    payload,
    { requireAuth: true }
  ).then(r => r.items[0]);
