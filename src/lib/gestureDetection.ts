import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import type {
  HandLandmarkerResult,
  NormalizedLandmark,
} from "@mediapipe/tasks-vision";

const WASM_PATH = "/mediapipe/wasm";
const HAND_LANDMARKER_MODEL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export type GestureDetectorStatus = "loading" | "ready" | "denied" | "error";

function getCanvasPoint(
  landmark: NormalizedLandmark,
  canvas: HTMLCanvasElement,
) {
  return {
    x: (1 - landmark.x) * canvas.width,
    y: landmark.y * canvas.height,
  };
}

function isFingerExtendedHorizontally(
  landmarks: NormalizedLandmark[],
  mcpIndex: number,
  tipIndex: number,
  pipIndex: number,
) {
  const mcp = landmarks[mcpIndex];
  const pip = landmarks[pipIndex];
  const tip = landmarks[tipIndex];
  const horizontalReach = Math.abs(tip.x - mcp.x);
  const verticalDrift = Math.abs(tip.y - mcp.y);
  const tipPastPip = Math.abs(tip.x - mcp.x) > Math.abs(pip.x - mcp.x);

  return (
    horizontalReach > 0.05 &&
    horizontalReach > verticalDrift * 0.8 &&
    tipPastPip
  );
}

function areTipsHorizontallyAligned(
  landmarks: NormalizedLandmark[],
  firstTipIndex: number,
  secondTipIndex: number,
) {
  const firstTip = landmarks[firstTipIndex];
  const secondTip = landmarks[secondTipIndex];
  const xDistance = Math.abs(firstTip.x - secondTip.x);
  const yDistance = Math.abs(firstTip.y - secondTip.y);

  return yDistance < 0.15 && xDistance > 0.02;
}

export function hasVictoryGesture(result: HandLandmarkerResult) {
  return result.landmarks.some((landmarks) => {
    if (landmarks.length < 21) {
      return false;
    }

    const indexExtended = isFingerExtendedHorizontally(landmarks, 5, 8, 6);
    const middleExtended = isFingerExtendedHorizontally(landmarks, 9, 12, 10);
    const ringFolded = !isFingerExtendedHorizontally(landmarks, 13, 16, 14);
    const pinkyFolded = !isFingerExtendedHorizontally(landmarks, 17, 20, 18);
    const fingersHorizontal = areTipsHorizontallyAligned(landmarks, 8, 12);

    return (
      indexExtended &&
      middleExtended &&
      ringFolded &&
      pinkyFolded &&
      fingersHorizontal
    );
  });
}

export function drawHandFrame(
  result: HandLandmarkerResult,
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
) {
  if (
    canvas.width !== video.videoWidth ||
    canvas.height !== video.videoHeight
  ) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  }

  const context = canvas.getContext("2d", { alpha: true });

  if (!context) {
    return;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);

  for (const landmarks of result.landmarks) {
    context.lineWidth = 6;
    context.strokeStyle = "white";
    context.lineCap = "round";
    context.lineJoin = "round";

    for (const connection of HandLandmarker.HAND_CONNECTIONS) {
      const start = landmarks[connection.start];
      const end = landmarks[connection.end];

      if (!start || !end) {
        continue;
      }

      const startPoint = getCanvasPoint(start, canvas);
      const endPoint = getCanvasPoint(end, canvas);

      context.beginPath();
      context.moveTo(startPoint.x, startPoint.y);
      context.lineTo(endPoint.x, endPoint.y);
      context.stroke();
    }

    for (const landmark of landmarks) {
      const point = getCanvasPoint(landmark, canvas);

      context.beginPath();
      context.arc(point.x, point.y, 5, 0, Math.PI * 2);
      context.fillStyle = "#e977a3";
      context.fill();
    }
  }
}

export async function createHandLandmarker() {
  const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);

  return HandLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath: HAND_LANDMARKER_MODEL,
    },
    numHands: 1,
    runningMode: "VIDEO",
    minHandDetectionConfidence: 0.55,
    minHandPresenceConfidence: 0.55,
    minTrackingConfidence: 0.55,
  });
}
