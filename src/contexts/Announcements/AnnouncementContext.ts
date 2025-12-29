import { createContext } from "react";
import type { Announcement, CreateAnnouncementPayload, UpdateAnnouncementPayload } from "../../api/AnnouncementApi";


export type AnnouncementContextValue = {

  announcementsByCourse: Record<string, Announcement[]> | null;
  loading: boolean;
  error: string | null;

  defaultPage: number;
  defaultPageSize: number;
  
  fetchCourseAnnouncements: (
    course_id: string | null | undefined,
    page?: number | null,
    page_size?: number | null,
  ) => Promise<void>;

  fetchAnnouncement: (
    announcement_id: string | null | undefined,

  ) => Promise<Announcement | null>;

  /* ---------- WRITE ---------- */
  createAnnouncement: (
    payload: CreateAnnouncementPayload
  ) => Promise<Announcement | null>;

  updateAnnouncement: (
    announcement_id: string,
    payload: UpdateAnnouncementPayload
  ) => Promise<Announcement | null>;

  deleteAnnouncement: (
    announcement_id: string,
    course_id: string
  ) => Promise<void>;

  //Utilities
  getCourseAnnouncementsLocal: (course_id: string| null | undefined) => Announcement[] | null;

};



export const AnnouncementContext =
  createContext<AnnouncementContextValue | null>(null);