import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ZoomVideo, { VideoQuality } from "@zoom/videosdk";

import { useLiveLecture } from "../../contexts/LiveLectureContext";
import { postNotifyLiveLectureJoined } from "../../api/LiveLectureApi";

export default function LiveLecturePage() {
  const { zoomJWT, topic } = useLiveLecture();
  const navigate = useNavigate();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!zoomJWT) {
      navigate("/");
      return;
    }

    const client = ZoomVideo.createClient();
    client.init("en-US", "Global");

    async function start() {
      await client.join(
        topic!,
        zoomJWT!,
        "Teacher",
        ""
      );

      await postNotifyLiveLectureJoined(zoomJWT!);

      const stream = client.getMediaStream();
      await stream.startVideo();

      const userId = client.getCurrentUserInfo().userId;

      stream.renderVideo(
        canvasRef.current!,
        userId,
        1280,
        720,
        0,
        0,
        3
      );
      
      //This is the current version that should be used
      //stream.attachVideo(
      //  userId,
      //  VideoQuality.Video_1080P,
      //)
    }

    start();

    return () => {
      client.leave();
    };
  }, [zoomJWT, navigate]);

  return (
    <div className="live-lecture-page">
      <canvas
        ref={canvasRef}
        className="video-canvas"
        width={1280}
        height={720}
      />
    </div>
  );
}
