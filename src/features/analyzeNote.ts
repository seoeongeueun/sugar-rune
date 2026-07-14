import { HEART_LIST } from "@/shared";
import type { HeartColor } from "@/shared";

type AnalyzeNoteResponse = {
  color: HeartColor;
  label: string;
  confidence: number;
};

const analyzeNoteUrl = import.meta.env.VITE_ANALYZE_NOTE_LAMBDA_URL as
  | string
  | undefined;

export async function analyzeNoteHeartColor(note: string): Promise<HeartColor> {
  if (!analyzeNoteUrl) {
    throw new Error("Analyze note endpoint is not configured.");
  }

  const response = await fetch(`${analyzeNoteUrl}/analyze-note`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ note }),
  });

  if (!response.ok) {
    throw new Error("Failed to analyze note.");
  }

  const result = (await response.json()) as AnalyzeNoteResponse;
  const category = HEART_LIST.find((heart) => heart.color === result.color);

  if (!category || category.label !== result.label) {
    throw new Error("Analyze note returned an invalid heart category.");
  }

  if (
    typeof result.confidence !== "number" ||
    result.confidence < 0 ||
    result.confidence > 1
  ) {
    throw new Error("Analyze note returned an invalid confidence.");
  }

  console.log("Analyze result:", result);
  return category.color;
}
