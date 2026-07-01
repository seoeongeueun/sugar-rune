import type { HandLandmarker } from "@mediapipe/tasks-vision";
import { useEffect, useRef, useState } from "react";
import {
  createHandLandmarker,
  hasVictoryGesture,
  type GestureDetectorStatus,
} from "@/lib/gestureDetection";

type GestureDetectorSize = "small" | "medium" | "large";

type Props = {
  onVictoryChange: (isVictory: boolean) => void;
  size?: GestureDetectorSize;
};

const SIZE_CLASSES: Record<GestureDetectorSize, string> = {
  small: "w-40",
  medium: "w-56",
  large: "w-72",
};

export default function GestureDetector({
  onVictoryChange,
  size = "large",
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVictoryRef = useRef(false);
  const [status, setStatus] = useState<GestureDetectorStatus>("loading");
  const [isVictory, setIsVictory] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    let stream: MediaStream | null = null;
    let landmarker: HandLandmarker | null = null;

    const setVictory = (nextValue: boolean) => {
      if (lastVictoryRef.current === nextValue) {
        return;
      }

      lastVictoryRef.current = nextValue;
      setIsVictory(nextValue);
      onVictoryChange(nextValue);
    };

    const detectFrame = () => {
      const video = videoRef.current;

      if (!video || !landmarker || isCancelled) {
        return;
      }

      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        const result = landmarker.detectForVideo(video, performance.now());
        setVictory(hasVictoryGesture(result));
      }

      animationFrameRef.current = requestAnimationFrame(detectFrame);
    };

    const startDetector = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });

        if (isCancelled || !videoRef.current) {
          return;
        }

        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        landmarker = await createHandLandmarker();

        if (isCancelled) {
          return;
        }

        setStatus("ready");
        detectFrame();
      } catch (error) {
        if (isCancelled) {
          return;
        }

        const nextStatus =
          error instanceof DOMException && error.name === "NotAllowedError"
            ? "denied"
            : "error";

        setStatus(nextStatus);
        setVictory(false);
      }
    };

    void startDetector();

    return () => {
      isCancelled = true;

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      landmarker?.close();
      stream?.getTracks().forEach((track) => track.stop());
      onVictoryChange(false);
    };
  }, [onVictoryChange]);

  return (
    <aside
      className={`border border-white/50 fixed bottom-8 right-8 z-90 flex ${SIZE_CLASSES[size]} flex-col gap-3 rounded-lg bg-pink p-3 text-white`}
    >
      <button
        aria-label={isMinimized ? "Expand" : "Minimize"}
        onClick={() => setIsMinimized((prev) => !prev)}
        className="flex flex-row !justify-between text-white text-md font-medium leading-2"
      >
        <span>Camera</span>
        {isMinimized ? "+" : "-"}
      </button>
      {!isMinimized && (
        <>
          <video
            ref={videoRef}
            className={`bg-secondary/70 aspect-video w-full rounded-md object-cover [transform:scaleX(-1)] ${status !== "ready" ? "animate-pulse" : ""}`}
            muted
            playsInline
          />
          <span
            className={`self-end h-3 w-3 shrink-0 border border-white rounded-full ${
              status === "error"
                ? "bg-red-500 animate-pulse"
                : isVictory
                  ? "bg-green-500 animate-pulse"
                  : "bg-white/20"
            }`}
            aria-hidden="true"
          />
        </>
      )}
    </aside>
  );
}
