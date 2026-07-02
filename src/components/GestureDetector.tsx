import type { HandLandmarker } from "@mediapipe/tasks-vision";
import type { PointerEvent } from "react";
import { useEffect, useRef, useState } from "react";
import {
  createHandLandmarker,
  drawHandFrame,
  hasVictoryGesture,
  type GestureDetectorStatus,
} from "@/lib";
import { Eye, EyeOff } from "lucide-react";

type Props = {
  onVictoryChange: (isVictory: boolean) => void;
};

type DetectorPosition = {
  x: number;
  y: number;
};

type DragState = {
  pointerId: number;
  offsetX: number;
  offsetY: number;
};

const DETECTOR_POSITION_KEY = "gestureDetectorPosition";

function getSavedDetectorPosition(): DetectorPosition | null {
  try {
    const savedPosition = window.sessionStorage.getItem(DETECTOR_POSITION_KEY);

    if (!savedPosition) {
      return null;
    }

    const parsedPosition = JSON.parse(
      savedPosition,
    ) as Partial<DetectorPosition>;

    if (
      typeof parsedPosition.x !== "number" ||
      typeof parsedPosition.y !== "number"
    ) {
      return null;
    }

    return {
      x: parsedPosition.x,
      y: parsedPosition.y,
    };
  } catch {
    return null;
  }
}

function saveDetectorPosition(position: DetectorPosition) {
  window.sessionStorage.setItem(
    DETECTOR_POSITION_KEY,
    JSON.stringify(position),
  );
}

function clampDetectorPosition(
  position: DetectorPosition,
  element: HTMLElement,
) {
  const bounds = element.getBoundingClientRect();
  const maxX = Math.max(0, window.innerWidth - bounds.width);
  const maxY = Math.max(0, window.innerHeight - bounds.height);

  return {
    x: Math.min(Math.max(position.x, 0), maxX),
    y: Math.min(Math.max(position.y, 0), maxY),
  };
}

export default function GestureDetector({ onVictoryChange }: Props) {
  const detectorRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const victoryMessageTimeoutRef = useRef<number | null>(null);
  const lastVictoryRef = useRef(false);
  const dragStateRef = useRef<DragState | null>(null);
  const didDragRef = useRef(false);
  const currentPositionRef = useRef<DetectorPosition | null>(null);
  const [status, setStatus] = useState<GestureDetectorStatus>("loading");
  const [isVictory, setIsVictory] = useState(false);
  const [showVictoryMessage, setShowVictoryMessage] = useState(false);
  const [isDetectionEnabled, setIsDetectionEnabled] = useState(true);
  const [position, setPosition] = useState<DetectorPosition | null>(() =>
    getSavedDetectorPosition(),
  );

  useEffect(() => {
    let isCancelled = false;
    let stream: MediaStream | null = null;
    let landmarker: HandLandmarker | null = null;
    const videoElement = videoRef.current;

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
        }, 2000);
      }
    };

    const clearCanvas = () => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");

      if (!canvas || !context) {
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
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
      if (!isDetectionEnabled) {
        setStatus("loading");
        setVictory(false);
        clearCanvas();
        return;
      }

      try {
        setStatus("loading");
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });

        if (isCancelled || !videoElement) {
          return;
        }

        videoElement.srcObject = stream;
        await videoElement.play();

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
      clearCanvas();

      if (videoElement) {
        videoElement.pause();
        videoElement.srcObject = null;
      }

      onVictoryChange(false);
    };
  }, [isDetectionEnabled, onVictoryChange]);

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || !detectorRef.current) {
      return;
    }

    const bounds = detectorRef.current.getBoundingClientRect();
    dragStateRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
    };
    didDragRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const dragState = dragStateRef.current;

    if (
      !dragState ||
      dragState.pointerId !== event.pointerId ||
      !detectorRef.current
    ) {
      return;
    }

    const nextPosition = clampDetectorPosition(
      {
        x: event.clientX - dragState.offsetX,
        y: event.clientY - dragState.offsetY,
      },
      detectorRef.current,
    );

    didDragRef.current = true;
    currentPositionRef.current = nextPosition;
    setPosition(nextPosition);
  };

  const handlePointerUp = (event: PointerEvent<HTMLElement>) => {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    dragStateRef.current = null;
    didDragRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);

    if (currentPositionRef.current) {
      saveDetectorPosition(currentPositionRef.current);
    }
  };

  const positionStyle =
    position === null
      ? undefined
      : {
          left: `${position.x}px`,
          top: `${position.y}px`,
        };

  return (
    <aside
      ref={detectorRef}
      className={`fixed z-90 w-100 flex touch-none select-none hover:cursor-grab flex-col text-white opacity-95 ${
        position === null ? "bottom-8 right-8" : ""
      }`}
      style={positionStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {showVictoryMessage && (
        <span
          id="modal"
          className="absolute bottom-1/2 font-bold z-99 rotate-15 right-4 text-sm text-end"
        >
          あなたのハート、ピックアップ！
        </span>
      )}
      <div className="flex flex-col bg-night/90 rounded-lg p-4 gap-4">
        <div
          onClick={(event) => {
            event.stopPropagation();
            if (didDragRef.current) {
              event.preventDefault();
              didDragRef.current = false;
              return;
            }
          }}
          className="flex flex-row items-center !justify-between h-4 leading-2 text-white text-md font-medium"
        >
          <span>{status === "error" ? "Error" : "Camera"}</span>
          <div className="flex flex-row items-center">
            <button
              aria-label={
                isDetectionEnabled ? "Turn camera off" : "Turn camera on"
              }
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.stopPropagation();
                setIsDetectionEnabled((prev) => !prev);
              }}
              className="cursor-pointer"
            >
              {isDetectionEnabled ? (
                <Eye className="inline-block mr-2 h-6 w-6 mb-px" />
              ) : (
                <EyeOff className="inline-block mr-2 h-6 w-6 mb-px" />
              )}
            </button>
          </div>
        </div>
        <div
          className={`${!isDetectionEnabled ? "hidden" : ""} relative aspect-square overflow-hidden rounded-md border border-secondary transition-[box-shadow,filter] duration-500 ${
            isVictory ? "shadow-[0_0_2px_2px_white] ring ring-secondary" : ""
          }`}
        >
          <video
            ref={videoRef}
            className={`bg-secondary/70 h-full object-cover [transform:scaleX(-1)] scale-110 ${isDetectionEnabled && status !== "ready" ? "animate-pulse" : ""}`}
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
      </div>
    </aside>
  );
}
