import type { HandLandmarker } from "@mediapipe/tasks-vision";
import { useEffect, useRef, useState } from "react";
import {
  createHandLandmarker,
  drawHandFrame,
  hasVictoryGesture,
  type GestureDetectorStatus,
} from "@/lib";

type GestureDetectorSize = "small" | "medium" | "large";

type Props = {
  onVictoryChange: (isVictory: boolean) => void;
  size?: GestureDetectorSize;
};

const SIZE_CLASSES: Record<GestureDetectorSize, string> = {
  small: "w-40",
  medium: "w-56",
  large: "w-110",
};

export default function GestureDetector({
  onVictoryChange,
  size = "large",
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const victoryMessageTimeoutRef = useRef<number | null>(null);
  const lastVictoryRef = useRef(false);
  const [status, setStatus] = useState<GestureDetectorStatus>("loading");
  const [isVictory, setIsVictory] = useState(false);
  const [showVictoryMessage, setShowVictoryMessage] = useState(false);
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

      if (nextValue) {
        setShowVictoryMessage(true);

        if (victoryMessageTimeoutRef.current !== null) {
          window.clearTimeout(victoryMessageTimeoutRef.current);
        }

        victoryMessageTimeoutRef.current = window.setTimeout(() => {
          setShowVictoryMessage(false);
          victoryMessageTimeoutRef.current = null;
        }, 4000);
      }
    };

    const detectFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !landmarker || isCancelled) {
        return;
      }

      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        const result = landmarker.detectForVideo(video, performance.now());
        if (canvas) {
          drawHandFrame(result, canvas, video);
        }
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

      if (victoryMessageTimeoutRef.current !== null) {
        window.clearTimeout(victoryMessageTimeoutRef.current);
      }

      landmarker?.close();
      stream?.getTracks().forEach((track) => track.stop());
      onVictoryChange(false);
    };
  }, [onVictoryChange]);

  return (
    <aside
      className={`fixed bottom-8 right-8 z-90 flex ${SIZE_CLASSES[size]} flex-col text-white`}
    >
      {showVictoryMessage && (
        <span className="text-sm text-end">あなたのハート、ピックアップ！</span>
      )}
      <div className="flex flex-col bg-pink rounded-lg p-4 border border-secondary gap-4">
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
            <div
              className={`relative aspect-video w-full overflow-hidden rounded-md transition-[box-shadow,filter] duration-500 ${
                isVictory
                  ? "shadow-[0_0_2px_2px_white] ring ring-secondary"
                  : ""
              }`}
            >
              <video
                ref={videoRef}
                className={`bg-secondary/70 h-full w-full object-cover [transform:scaleX(-1)] ${status !== "ready" ? "animate-pulse" : ""}`}
                muted
                playsInline
              />
              <canvas
                ref={canvasRef}
                className="pointer-events-none absolute inset-0 h-full w-full"
                aria-hidden="true"
                style={{ background: "transparent" }}
              />
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
