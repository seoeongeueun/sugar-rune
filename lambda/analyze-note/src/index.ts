import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";

import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";

import { buildSystemPrompt } from "./prompt";
import { parseEmotionResult } from "./parse-result";
import { jsonResponse } from "./response";

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.BEDROCK_REGION ?? process.env.AWS_REGION ?? "us-east-1",
});

const modelId = process.env.BEDROCK_MODEL_ID ?? "amazon.nova-micro-v1:0";

export async function handler(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  try {
    if (event.requestContext?.http?.method === "OPTIONS") {
      return jsonResponse(204, null);
    }

    const note = readDiary(event.body);

    if (!note) {
      return jsonResponse(400, {
        message: "Note must be a non-empty string",
      });
    }

    if (note.length > 10_000) {
      return jsonResponse(400, {
        message: "Note must be 10,000 characters or fewer",
      });
    }

    const command = new ConverseCommand({
      modelId,
      system: [
        {
          text: buildSystemPrompt(),
        },
      ],
      messages: [
        {
          role: "user",
          content: [
            {
              text: `Diary:\n${note}`,
            },
          ],
        },
      ],
      inferenceConfig: {
        temperature: 0,
        maxTokens: 100,
      },
    });

    const result = await bedrockClient.send(command);

    const responseText = result.output?.message?.content?.find(
      (content) => "text" in content,
    )?.text;

    if (!responseText) {
      throw new Error("Bedrock returned an empty response");
    }

    const emotion = parseEmotionResult(responseText);

    return jsonResponse(200, emotion);
  } catch (error) {
    console.error("AnalyzeNote Lambda error", error);

    return jsonResponse(500, {
      message: "Failed to analyze note",
    });
  }
}

function readDiary(body?: string): string | null {
  if (!body) return null;

  try {
    const parsed = JSON.parse(body) as {
      note?: unknown;
    };

    if (typeof parsed.note !== "string" || parsed.note.trim().length === 0) {
      return null;
    }

    return parsed.note.trim();
  } catch {
    return null;
  }
}
