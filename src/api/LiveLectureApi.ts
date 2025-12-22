import { apiGet, apiPost } from "./Api";
import type { ApiListResponse } from "./CourseApi";
import type { LectureCreation, LiveLectureStatus, ZoomJWT } from "./live_lecture_types";







export const getLessonStatus = (course_id: string

): Promise<ApiListResponse<LiveLectureStatus>> => 
  apiGet<ApiListResponse<LiveLectureStatus>>(
    "/api/course/course/lesson/status",
    { course_id },
    { requireAuth: true }
  );


export const postCreateLesson = (
  course_id: string,
  description: string, 
): Promise<ApiListResponse<LectureCreation>> => 
  apiPost<ApiListResponse<LectureCreation>>(
    "/api/course/course/lesson/create",
    {
      course_id, 
      description,
    },
    { requireAuth: true }
  );


export const postGenerateJoinToken = (
  course_id: string
): Promise<ApiListResponse<ZoomJWT>> =>
  apiPost<ApiListResponse<ZoomJWT>>(
    `/api/course/course/lesson/join-token?course_id=${course_id}`,
    {},
    { requireAuth: true }
  );


export const getVerifyLessonToken = (zoomJWT: string
  
): Promise<ApiListResponse<boolean>> => 
  apiGet<ApiListResponse<boolean>>(
    `/api/course/course/lesson/verify-token?token=${zoomJWT}`,
    {},
    { requireAuth: true }
  );

export const postNotifyLiveLectureJoined = (
  zoomJWT: string
): Promise<ApiListResponse<boolean>> =>
  apiPost<ApiListResponse<boolean>>(
    `/api/course/course/lesson/join?token=${zoomJWT}`,
    {},
    { requireAuth: true }
  );
