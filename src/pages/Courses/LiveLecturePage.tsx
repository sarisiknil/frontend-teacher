import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ZoomVideo, { VideoQuality } from "@zoom/videosdk";

import { useLiveLecture } from "../../contexts/LiveLectureContext";
import { postLeftSession, postNotifyHeartbeat } from "../../api/LiveLectureApi";

const HEARTBEAT_INTERVAL_MS = 15_000;

export default function LiveLecturePage() {
  const { zoomJWT, topic } = useLiveLecture();
  const navigate = useNavigate();

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoPlayerRef = useRef<any>(null);

  const clientRef = useRef<any>(null);
  const streamRef = useRef<any>(null);

  const startedRef = useRef(false);
  const heartbeatRef = useRef<number | null>(null);
  const userIdRef = useRef<number | null>(null);

  /* ───────────────────────── START ───────────────────────── */

  useEffect(() => {
    if (startedRef.current) {
      console.warn("[LiveLecturePage] start() skipped (already running)");
      return;
    }
    startedRef.current = true;

    if (!zoomJWT || !topic) {
      console.error("[LiveLecturePage] Missing token or topic → redirecting");
      navigate("/");
      return;
    }

    const client = ZoomVideo.createClient();
    clientRef.current = client;

    async function start() {
      try {
        console.log("[Zoom] init()");
        await client.init("en-US", "Global");
        console.log("[Zoom] init OK");

        console.log("[Zoom] join()", { topic });
        await client.join(topic!, zoomJWT!, "Teacher", "");
        console.log("[Zoom] join OK");

        const stream = client.getMediaStream();
        streamRef.current = stream;

        await stream.startVideo();
        console.log("[Zoom] startVideo OK");

        const userId = client.getCurrentUserInfo().userId;
        userIdRef.current = userId;

        console.log("[Zoom] current user:", userId);

        await attachSelfVideo(stream, userId);

        startHeartbeat();
        attachZoomListeners(client, stream);
      } catch (err: unknown) {
        if(err instanceof Error)
          console.error("[LiveLecturePage] START FAILED : ", err);
      }
    }

    start();

    return () => {
      console.log("[LiveLecturePage] cleanup → leave()");
      safeLeave();
    };
  }, [zoomJWT, topic, navigate]);

  /* ───────────────────────── VIDEO ATTACH ───────────────────────── */

  async function attachSelfVideo(stream: any, userId: number) {
    if (!videoContainerRef.current) {
      throw new Error("Video container missing");
    }

    // Clean old video if exists
    if (videoPlayerRef.current) {
      try {
        await stream.detachVideo(userId, videoPlayerRef.current);
        videoPlayerRef.current.remove();
      } catch (err: unknown) {
          if(err instanceof Error){
            console.log("Error while cleaning : " , err);
          }
      }
    }

    const player = await stream.attachVideo(
      userId,
      VideoQuality.Video_1080P
    );

    player.style.width = "100%";
    player.style.height = "100%";
    player.style.objectFit = "cover";

    videoContainerRef.current.appendChild(player);
    videoPlayerRef.current = player;

    console.log("[Zoom] attachVideo OK");
  }

  /* ───────────────────────── HEARTBEAT ───────────────────────── */

  function startHeartbeat() {
    stopHeartbeat();

    heartbeatRef.current = window.setInterval(() => {
      if (!topic) return;
      postNotifyHeartbeat(topic).catch((e) =>
        console.warn("[Heartbeat] failed", e)
      );
    }, HEARTBEAT_INTERVAL_MS);

    console.log("[Heartbeat] started");
  }

  function stopHeartbeat() {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
      console.log("[Heartbeat] stopped");
    }
  }

  /* ───────────────────────── ZOOM EVENTS ───────────────────────── */

  function attachZoomListeners(client: any, stream: any) {
    client.on("connection-change", async (payload: any) => {
      console.log("[Zoom] connection-change", payload);

      if (payload.state === "Reconnecting") {
        console.warn("[Zoom] reconnecting…");
      }

      if (payload.state === "Connected") {
        console.log("[Zoom] reconnected");

        if (userIdRef.current) {
          await attachSelfVideo(stream, userIdRef.current);
        }
      }

      if (payload.state === "Closed") {
        console.warn("[Zoom] connection closed");
        safeLeave();
      }
    });
  }

  /* ───────────────────────── LEAVE LOGIC ───────────────────────── */

  async function safeLeave() {
    stopHeartbeat();

    if (topic) {
      try {
        navigator.sendBeacon(
          `/api/zoom/course/lesson/exit?lesson_id=${topic}`
        );
      } catch {
        postLeftSession(topic).catch(() => {});
      }
    }

    try {
      if (streamRef.current && userIdRef.current) {
        const elements = await streamRef.current.detachVideo(userIdRef.current);
        if (Array.isArray(elements)) {
          elements.forEach((e) => e.remove());
        } else {
          elements?.remove();
        }
      }
      clientRef.current?.leave();
    } catch (e) {
      console.warn("[safeLeave] issue", e);
    }
  }

  /* ───────────────────────── BROWSER EVENTS ───────────────────────── */

  useEffect(() => {
    const onUnload = () => {
      console.log("[Browser] unload");
      safeLeave();
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        console.log("[Browser] tab hidden");
        safeLeave();
      }
    };

    window.addEventListener("beforeunload", onUnload);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("beforeunload", onUnload);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [topic]);

  /* ───────────────────────── RENDER ───────────────────────── */

  return (
    <div className="live-lecture-page">
      {/*do not delete below */}
      {/* @ts-expect-error html component */}
      <video-player-container
      ref={videoContainerRef}
      className="video-player-container"
      style={{ width: "1280px", height: "720px", background: "black" }}
      />
    </div>
  );
}
