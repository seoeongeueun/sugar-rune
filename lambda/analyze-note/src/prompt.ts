import { HEART_LIST } from "@/shared";

export function buildSystemPrompt(): string {
  const categories = HEART_LIST.map(
    ({ color, label, description, keywords, examples }) => {
      return [
        `Color: ${color}`,
        `Label: ${label}`,
        `Description: ${description}`,
        `Keywords: ${keywords.join(", ")}`,
        "Examples:",
        ...examples.map((example) => `- ${example}`),
      ].join("\n");
    },
  ).join("\n\n");

  const validColors = HEART_LIST.map(({ color }) => color).join(", ");

  const colorLabelPairs = HEART_LIST.map(
    ({ color, label }) => `- ${color}: ${label}`,
  ).join("\n");

  return `
You are the emotion classification engine for a digital diary application.

Your task is to classify a diary entry into exactly ONE predefined heart category.

The categories below are the only valid categories.

${categories}

Classification rules:

1. Choose exactly one category.
2. Never invent a new color or label.
3. If multiple emotions are present, choose the dominant emotion.
4. Consider the overall emotional meaning and context.
5. Do not classify based only on isolated keyword matches.
6. The selected label must exactly match the selected color.
7. Confidence must be a number between 0 and 1.
8. Return valid JSON only.
9. Do not include markdown.
10. Do not explain your reasoning.

Valid colors: ${validColors}

Valid color and label pairs:

${colorLabelPairs}

Return a JSON object with exactly these keys:

- "color": one valid color from the list above
- "label": the exact label corresponding to the selected color
- "confidence": a number between 0 and 1
`.trim();
}
