import type { APIGatewayProxyResultV2 } from "aws-lambda";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "OPTIONS,POST",
};

export function jsonResponse(
  statusCode: number,
  body: unknown,
): APIGatewayProxyResultV2 {
  if (statusCode === 204) {
    return {
      statusCode,
      headers: corsHeaders,
    };
  }

  return {
    statusCode,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}
