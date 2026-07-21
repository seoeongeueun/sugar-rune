import type { HandLandmarker } from "@mediapipe/tasks-vision";
import type { PointerEvent } from "react";
import { useEffect, useRef, useState } from "react";
import {
  createHandLandmarker,
  drawHandFrame,
  hasVictoryGesture,
  normalizeString,
  startSpeechRecognition,
  type GestureDetectorStatus,
  type SpeechRecognitionSession,
} from "@/lib";
import { Eye, EyeOff, Mic } from "lucide-react";

type Props = {
  onVictoryChange: (isVictory: boolean) => void;
  cameraAccessRequestCount: number;
  isLockMode: boolean;
  spell: string;
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

const DEFAULT_GESTURE_MESSAGE = "Show your gesture and say your spell!";

export default function GestureDetector({
  onVictoryChange,
  cameraAccessRequestCount,
  isLockMode,
  spell,
}: Props) {
  const detectorRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const victoryMessageTimeoutRef = useRef<number | null>(null);
  const nonLockGestureTextTimeoutRef = useRef<number | null>(null);
  const unlockSessionRef = useRef<SpeechRecognitionSession | null>(null);
  const isUnlockListeningRef = useRef(false);
  const shouldWaitForGestureReleaseRef = useRef(false);
  const lastVictoryRef = useRef(false);
  const dragStateRef = useRef<DragState | null>(null);
  const didDragRef = useRef(false);
  const currentPositionRef = useRef<DetectorPosition | null>(null);
  const [status, setStatus] = useState<GestureDetectorStatus>("loading");
  const [isVictory, setIsVictory] = useState(false);
  const [gestureMessage, setGestureMessage] = useState<string>(
    isLockMode ? DEFAULT_GESTURE_MESSAGE : "",
  );
  const [isUnlockListening, setIsUnlockListening] = useState(false);
  const [unlockTranscript, setUnlockTranscript] = useState("");
  const [isDetectionEnabled, setIsDetectionEnabled] = useState(false);
  const [shouldShowNonLockGestureText, setShouldShowNonLockGestureText] =
    useState(false);
  const [position, setPosition] = useState<DetectorPosition | null>(() =>
    getSavedDetectorPosition(),
  );

  useEffect(() => {
    if (cameraAccessRequestCount > 0) {
      setIsDetectionEnabled(true);
    }
  }, [cameraAccessRequestCount]);

  useEffect(() => {
    let isCancelled = false;
    let stream: MediaStream | null = null;
    let landmarker: HandLandmarker | null = null;
    const videoElement = videoRef.current;

    const showGestureMessage = (message: string, durationMs?: number) => {
      setGestureMessage(message);

      if (victoryMessageTimeoutRef.current !== null) {
        window.clearTimeout(victoryMessageTimeoutRef.current);
        victoryMessageTimeoutRef.current = null;
      }

      if (durationMs === undefined) {
        return;
      }

      victoryMessageTimeoutRef.current = window.setTimeout(() => {
        setGestureMessage(DEFAULT_GESTURE_MESSAGE);
        victoryMessageTimeoutRef.current = null;
      }, durationMs);
    };

    const clearVictory = () => {
      lastVictoryRef.current = false;
      setIsVictory(false);
      onVictoryChange(false);
    };

    const showNonLockGestureText = () => {
      setShouldShowNonLockGestureText(true);

      if (nonLockGestureTextTimeoutRef.current !== null) {
        window.clearTimeout(nonLockGestureTextTimeoutRef.current);
      }

      nonLockGestureTextTimeoutRef.current = window.setTimeout(() => {
        setShouldShowNonLockGestureText(false);
        nonLockGestureTextTimeoutRef.current = null;
      }, 3000);
    };

    const startUnlockListening = () => {
      if (isUnlockListeningRef.current) {
        return;
      }

      const savedSpell = normalizeString(spell);

      if (!savedSpell) {
        showGestureMessage("No spell is saved.", 3000);
        shouldWaitForGestureReleaseRef.current = true;
        clearVictory();
        return;
      }

      isUnlockListeningRef.current = true;
      setIsUnlockListening(true);
      setUnlockTranscript("");
      setIsVictory(true);
      showGestureMessage("Gesture detected!");

      const result = startSpeechRecognition({
        maxListeningTimeMs: 10_000,
        onTranscript: (transcript) => {
          setUnlockTranscript(transcript);
        },
        onComplete: (transcript) => {
          unlockSessionRef.current = null;
          isUnlockListeningRef.current = false;
          setIsUnlockListening(false);
          setUnlockTranscript(transcript);

          if (!transcript) {
            showGestureMessage("No spell heard.", 3000);
            shouldWaitForGestureReleaseRef.current = true;
            clearVictory();
            return;
          }

          if (normalizeString(transcript) !== savedSpell) {
            showGestureMessage("Your spell does not match.", 3000);
            shouldWaitForGestureReleaseRef.current = true;
            clearVictory();
            return;
          }

          showGestureMessage("Unlocked.", 2000);
          onVictoryChange(true);
        },
        onError: () => {
          unlockSessionRef.current = null;
          isUnlockListeningRef.current = false;
          setIsUnlockListening(false);
          showGestureMessage("Voice unlock failed.", 3000);
          shouldWaitForGestureReleaseRef.current = true;
          clearVictory();
        },
      });

      if (!result.ok) {
        unlockSessionRef.current = null;
        isUnlockListeningRef.current = false;
        setIsUnlockListening(false);
        showGestureMessage("Voice unlock is not available.", 3000);
        shouldWaitForGestureReleaseRef.current = true;
        clearVictory();
        return;
      }

      unlockSessionRef.current = result.session;
    };

    const setVictory = (nextValue: boolean) => {
      if (lastVictoryRef.current === nextValue) {
        return;
      }

      lastVictoryRef.current = nextValue;

      if (nextValue) {
        if (isLockMode) {
          startUnlockListening();
          return;
        }

        setIsVictory(true);
        onVictoryChange(true);
        showNonLockGestureText();
        showGestureMessage("Sugar Sugar Rune, Choco Rune!", 2000);
        return;
      }

      setIsVictory(false);
      onVictoryChange(false);
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

        if (isUnlockListeningRef.current) {
          animationFrameRef.current = requestAnimationFrame(detectFrame);
          return;
        }

        const hasGesture = hasVictoryGesture(result);

        if (!hasGesture) {
          shouldWaitForGestureReleaseRef.current = false;
        }

        if (hasGesture && shouldWaitForGestureReleaseRef.current) {
          animationFrameRef.current = requestAnimationFrame(detectFrame);
          return;
        }

        setVictory(hasGesture);
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

      if (nonLockGestureTextTimeoutRef.current !== null) {
        window.clearTimeout(nonLockGestureTextTimeoutRef.current);
        nonLockGestureTextTimeoutRef.current = null;
      }

      unlockSessionRef.current?.abort();
      unlockSessionRef.current = null;
      isUnlockListeningRef.current = false;
      setIsUnlockListening(false);
      setUnlockTranscript("");
      setShouldShowNonLockGestureText(false);
      shouldWaitForGestureReleaseRef.current = false;
      landmarker?.close();
      stream?.getTracks().forEach((track) => track.stop());
      clearCanvas();

      if (videoElement) {
        videoElement.pause();
        videoElement.srcObject = null;
      }

      onVictoryChange(false);
    };
  }, [isDetectionEnabled, isLockMode, onVictoryChange, spell]);

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
      className={`fixed z-90 ${isLockMode ? "w-100" : "w-fit"} flex touch-none select-none hover:cursor-grab flex-col bg-black/40 text-white ${
        position === null ? "bottom-8 left-8" : ""
      }`}
      style={positionStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="relative flex flex-col border-2 border-white outline outline-night bg-white/40 backdrop-blur-xl drop-shadow-2xl rounded-lg p-4 gap-4">
        <div
          onClick={(event) => {
            event.stopPropagation();
            if (didDragRef.current) {
              event.preventDefault();
              didDragRef.current = false;
              return;
            }
          }}
          className="flex flex-row items-center !justify-between h-4 leading-2 text-white text-md font-medium gap-8"
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
                <Eye className="inline-block mr-1 h-6 w-6 mb-px" />
              ) : (
                <EyeOff className="inline-block mr-1 h-6 w-6 mb-px" />
              )}
            </button>
          </div>
        </div>
        {isDetectionEnabled && (
          <div className="relative max-h-50 flex flex-row items-center justify-between gap-4">
            <div
              className={`${!isDetectionEnabled ? "hidden" : ""} max-h-50 relative aspect-square overflow-hidden h-full shrink-0 rounded-md border border-white transition-[box-shadow,filter] duration-100 ${
                isVictory ? "shadow-[0_0_5px_1px_var(--secondary)]" : ""
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
            {isLockMode ? (
              <div className="flex flex-col gap-2 w-full">
                {isUnlockListening && (
                  <div
                    className="flex items-center gap-2 text-white"
                    aria-live="polite"
                  >
                    <Mic className="h-5 w-5 animate-pulse" />
                    <div className="flex items-center gap-1" aria-hidden="true">
                      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                      <span className="h-2 w-2 rounded-full bg-white animate-pulse [animation-delay:150ms]" />
                      <span className="h-2 w-2 rounded-full bg-white animate-pulse [animation-delay:300ms]" />
                    </div>
                  </div>
                )}
                <p className="text-md text-left">{gestureMessage}</p>
              </div>
            ) : shouldShowNonLockGestureText ? (
              <p className="absolute text-center text-md top-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-night/50 px-2 rounded rotate-z-5 will-change-transform">
                Sugar Sugar Rune!
              </p>
            ) : null}
          </div>
        )}
        {isUnlockListening && unlockTranscript?.length > 0 && (
          <p className="absolute -bottom-8 min-h-6 rounded bg-night/50 px-2 py-1 text-sm tracking-widest uppercase">
            {unlockTranscript}
          </p>
        )}
      </div>
    </aside>
  );
}
