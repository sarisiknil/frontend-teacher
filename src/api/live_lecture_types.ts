export type LiveLectureStatus = 
  "NO_ACTIVE_LESSON" | "ACTIVE_LESSON" | "CREATABLE_WINDOW"; 


export type LectureCreation = {
  lesson_id: string;
  course_id: string;
  host_id: string;
  host_joined: boolean;
  starts_at: string; // ISO DATE
  ends_at: string; // ISO DATE
  description: "string",
  created_at: string; // ISO DATE
  updated_at: string; //ISO_DATE
};

export type ZoomJWT = {
  token: string;
}