import { HEART_LIST } from "@/shared";
import type { HeartColor } from "@/shared";

export type EmotionResult = {
  color: HeartColor;
  label: string;
  confidence: number;
};

type RawEmotionResult = {
  color?: unknown;
  label?: unknown;
  confidence?: unknown;
};

export function parseEmotionResult(responseText: string): EmotionResult {
  const parsed = JSON.parse(
    extractJsonObject(responseText),
  ) as RawEmotionResult;

  if (
    typeof parsed.color !== "string" ||
    typeof parsed.label !== "string" ||
    typeof parsed.confidence !== "number"
  ) {
    throw new Error(
      "Bedrock response does not match the expected emotion schema",
    );
  }

  const category = HEART_LIST.find((heart) => heart.color === parsed.color);

  if (!category) {
    throw new Error(`Bedrock returned an invalid heart color: ${parsed.color}`);
  }

  if (category.label !== parsed.label) {
    throw new Error(
      `Bedrock returned label "${parsed.label}" for color "${parsed.color}", expected "${category.label}"`,
    );
  }

  if (parsed.confidence < 0 || parsed.confidence > 1) {
    throw new Error("Bedrock response confidence must be between 0 and 1");
  }

  return {
    color: category.color,
    label: category.label,
    confidence: parsed.confidence,
  };
}

function extractJsonObject(responseText: string): string {
  const trimmed = responseText.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Bedrock response did not include a JSON object");
  }

  return trimmed.slice(start, end + 1);
}
