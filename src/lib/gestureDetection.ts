import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import type {
  HandLandmarkerResult,
  NormalizedLandmark,
} from "@mediapipe/tasks-vision";

const WASM_PATH = "/mediapipe/wasm";
const HAND_LANDMARKER_MODEL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export type GestureDetectorStatus = "loading" | "ready" | "denied" | "error";

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
