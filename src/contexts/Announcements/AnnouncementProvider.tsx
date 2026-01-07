import { useCallback, useMemo, useRef, useState } from "react";
import { DeleteAnnouncement, getCourseAnnouncement, getCourseAnnouncements, PatchUpdateAnnouncement, postCreateAnnouncement, type Announcement, type CourseAnnouncements, type CreateAnnouncementPayload, type UpdateAnnouncementPayload } from "../../api/AnnouncementApi";
import type { ApiListResponse } from "../../api/CourseApi";
import { AnnouncementContext } from "./AnnouncementContext";

const DEFAULT_PAGE = 0;
const DEFAULT_PAGE_SIZE = 10;

/* =====================================
   Helpers
===================================== */

function safeString(x: unknown): string | null {
  return typeof x === "string" && x.trim().length > 0 ? x : null;
}

function safeNumber(x: unknown, fallback: number) {
  return typeof x === "number" && Number.isFinite(x) ? x : fallback;
}


/**
 * Supports:
 * - res.items as CourseAnnouncements
 * - res.items[0] as CourseAnnouncements
*/
function extractCourseAnnouncementsPayload(res: ApiListResponse<CourseAnnouncements>): CourseAnnouncements | null {
  const items = res?.items;

  if (items && !Array.isArray(items) && typeof items === "object") {
    if ("items" in items && "unseen" in items) {
      return items as CourseAnnouncements;
    }
  }

  if (Array.isArray(items) && items.length > 0) {
    const first = items[0];
    if (first && typeof first === "object" && "items" in first && "unseen" in first) {
      return first as CourseAnnouncements;
    }
  }

  return null;
}

export function AnnouncementProvider ({children} : {children: React.ReactNode}) {

  const [announcementsByCourse, setAnnouncementsByCourse] = useState<Record<string, Announcement[]> | null>(null);

  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reqSeq = useRef(0);

  const getCourseAnnouncementsLocal = useCallback(
    (course_id: string | null | undefined): Announcement[] | null => {
    const cid = safeString(course_id);
    if(!cid || !announcementsByCourse) return null;
    return announcementsByCourse[cid] ?? null;
  }, [announcementsByCourse]);

  const fetchCourseAnnouncements = useCallback(
    async (
      course_id: string | null | undefined,
      page?: number | null,
      page_size?: number | null
    ) => {
      const cid = safeString(course_id);
      if (!cid) return;

      const p = safeNumber(page, DEFAULT_PAGE);
      const ps = safeNumber(page_size, DEFAULT_PAGE_SIZE);

      setLoading(true);
      setError(null);

      const mySeq = ++reqSeq.current;

      try {
        const res = await getCourseAnnouncements(cid, p, ps);
        if(mySeq !== reqSeq.current) return;
        const payload = extractCourseAnnouncementsPayload(res);
        if (!payload) {
          setError("Duyuru verisi çözümlenemedi.");
          return;
        }

        setAnnouncementsByCourse((prev) => ({
          ...(prev ?? {}),
          [cid]: payload.items ?? [],
        }));

       
      } catch (e: unknown) {
        if (mySeq !== reqSeq.current) return;
        setError(e instanceof Error ? e.message : "Duyurular alınamadı.");
      } finally {
        if (mySeq === reqSeq.current) setLoading(false);
      }
    }, []
  ); 
  
  const fetchAnnouncement = useCallback(
    async (announcement_id: string | null | undefined): Promise<Announcement | null> => {
      const aid = safeString(announcement_id);
      if (!aid) return null;

      try {
        const res = await getCourseAnnouncement(aid);
        return Array.isArray(res?.items) ? res.items[0] ?? null : null;
      } catch {
        return null;
      }
    },
    []
  );

  /* ---------- CREATE ---------- */

  const createAnnouncement = useCallback(
    async (payload: CreateAnnouncementPayload) => {
      try {
        const res = await postCreateAnnouncement(payload);
        const created = res.items?.[0];
        if (!created) return null;

        setAnnouncementsByCourse((prev) => ({
          ...(prev ?? {}),
          [created.course_id]: [
            created,
            ...(prev?.[created.course_id] ?? []),
          ],
        }));

        return created;
      } catch {
        return null;
      }
    },
    []
  );

  /* ---------- UPDATE ---------- */

  const updateAnnouncement = useCallback(
    async (announcement_id : string, payload : UpdateAnnouncementPayload ) => {
      try {
        const res = await PatchUpdateAnnouncement(announcement_id, payload);
        const updated = res.items?.[0];
        if (!updated) return null;

        setAnnouncementsByCourse((prev) => {
          if (!prev) return prev;

          const cid = updated.course_id;
          return {
            ...prev,
            [cid]: (prev[cid] ?? []).map((a) =>
              a.announcement_id === updated.announcement_id ? updated : a
            ),
          };
        });

        return updated;
      } catch {
        return null;
      }
    },
    []
  );

  /* ---------- DELETE ---------- */

  const deleteAnnouncement = useCallback(
    async (announcement_id: string, course_id: string) => {
      await DeleteAnnouncement(announcement_id);

      setAnnouncementsByCourse((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [course_id]: (prev[course_id] ?? []).filter(
            (a) => a.announcement_id !== announcement_id
          ),
        };
      });
    },
    []
  );

  const value = useMemo(
    () => ({
      announcementsByCourse,
      loading,
      error,

      defaultPage: DEFAULT_PAGE,
      defaultPageSize: DEFAULT_PAGE_SIZE,

      fetchCourseAnnouncements,
      fetchAnnouncement,

      createAnnouncement,
      updateAnnouncement,
      deleteAnnouncement,

      getCourseAnnouncementsLocal,
    }),
    [announcementsByCourse, loading, error]
  );


  return (
    <AnnouncementContext.Provider value={value}>
      {children}
    </AnnouncementContext.Provider>
  ); 
}