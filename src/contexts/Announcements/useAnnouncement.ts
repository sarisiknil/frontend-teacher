import { useContext } from "react";
import { AnnouncementContext, type AnnouncementContextValue } from "./AnnouncementContext";


export function useAnnouncement(): AnnouncementContextValue {
  const ctx = useContext(AnnouncementContext);
  if (!ctx) {
    throw new Error("useAnnouncement must be used within AnnouncementProvider");
  }
  return ctx;
}