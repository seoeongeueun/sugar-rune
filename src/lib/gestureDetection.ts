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

function isFingerExtended(
  landmarks: NormalizedLandmark[],
  tipIndex: number,
  pipIndex: number,
) {
  return landmarks[tipIndex].y < landmarks[pipIndex].y;
}

function isThumbAwayFromPalm(landmarks: NormalizedLandmark[]) {
  const thumbTip = landmarks[4];
  const indexMcp = landmarks[5];
  const pinkyMcp = landmarks[17];
  const wrist = landmarks[0];
  const palmWidth = Math.abs(indexMcp.x - pinkyMcp.x);
  const thumbDistance = Math.hypot(thumbTip.x - wrist.x, thumbTip.y - wrist.y);

  return thumbDistance > palmWidth * 0.85;
}

export function hasVictoryGesture(result: HandLandmarkerResult) {
  return result.landmarks.some((landmarks) => {
    if (landmarks.length < 21) {
      return false;
    }

    const indexExtended = isFingerExtended(landmarks, 8, 6);
    const middleExtended = isFingerExtended(landmarks, 12, 10);
    const ringFolded = !isFingerExtended(landmarks, 16, 14);
    const pinkyFolded = !isFingerExtended(landmarks, 20, 18);
    const fingersSeparated = Math.abs(landmarks[8].x - landmarks[12].x) > 0.035;
    const thumbRelaxed = !isThumbAwayFromPalm(landmarks);

    return (
      indexExtended &&
      middleExtended &&
      ringFolded &&
      pinkyFolded &&
      fingersSeparated &&
      thumbRelaxed
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
    context.strokeStyle = "#8a70be";
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

    // for (const landmark of landmarks) {
    //   const point = getCanvasPoint(landmark, canvas);

    //   context.beginPath();
    //   context.arc(point.x, point.y, 5, 0, Math.PI * 2);
    //   context.fillStyle = "white";
    //   context.fill();
    // }
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
