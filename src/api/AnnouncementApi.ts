import { apiDelete, apiGet, apiPatch, apiPost } from "./Api";
import type { ApiListResponse } from "./CourseApi";

export type Announcement = {
  announcement_id: string;
  course_id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  seen: boolean;
  seen_at: boolean;
  author: Profile;
  created_at: string; // ISO DATE
  updated_at: string; // ISO DATE
}


//Profile Related
export type Profile = {
  ID: string;
  Name: string;
  Surname: string;
  Birthdate: string;
  AvatarLink: string;
  Statu: "ACTIVE" | "PASSIVE" | string; 
};


export type UnseenAnnouncementMeta = {
  course_id: string;
  unseen_count: number;
}

export type CourseAnnouncements = {
  items: Announcement[];
  unseen: UnseenAnnouncementMeta;
}

export type CreateAnnouncementPayload = {
  course_id: string;
  title: string;
  body: string;
  is_pinned: boolean;
} 

export type UpdateAnnouncementPayload = {
  title: string;
  body: string;
  is_pinned: boolean;
}





export const getCourseAnnouncements = (course_id: string, page: number, page_size: number

) : Promise<ApiListResponse<CourseAnnouncements>> =>
  apiGet<ApiListResponse<CourseAnnouncements>>(
    `/api/course/course/announcements?course_id=${course_id}&page=${page}&page_size=${page_size}`,
    {},
    { requireAuth: true },
  );


export const getCourseAnnouncement = (announcement_id: string
) : Promise<ApiListResponse<Announcement>> =>
  apiGet<ApiListResponse<Announcement>>(
    `/api/course/course/announcements/item?announcement_id=${announcement_id}`,
    {},
    {requireAuth: true}
  );


export const postCreateAnnouncement = (payload: CreateAnnouncementPayload

) : Promise<ApiListResponse<Announcement>> => 
  apiPost<ApiListResponse<Announcement>>(
    `/api/course/course/announcements/create`,
    payload,
    {requireAuth: true},
  );


export const PatchUpdateAnnouncement = (
  announcement_id: string,
  payload: UpdateAnnouncementPayload,

): Promise<ApiListResponse<Announcement>> =>
  apiPatch<ApiListResponse<Announcement>>(
    `/api/course/course/announcements/update?announcement_id=${announcement_id}`,
    payload,
    { requireAuth: true }
  );

export const DeleteAnnouncement = (
  announcement_id: string
): Promise<ApiListResponse<null>> =>
  apiDelete<ApiListResponse<null>>(
    `/api/course/course/announcements/delete?announcement_id=${announcement_id}`,
    {},
    { requireAuth: true }
  );