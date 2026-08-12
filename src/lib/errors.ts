import { ZodError } from "zod";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_COORDINATES"
  | "AUTHENTICATION_REQUIRED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "EXTERNAL_SERVICE_ERROR"
  | "CONFIGURATION_ERROR"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly status = 500,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ExternalServiceError extends AppError {
  constructor(
    provider: string,
    message = `${provider} is temporarily unavailable.`,
  ) {
    super("EXTERNAL_SERVICE_ERROR", message, 502);
    this.name = "ExternalServiceError";
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof ZodError) {
    const issue = error.issues[0];
    return Response.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: issue?.message ?? "Invalid request.",
        },
      },
      { status: 400 },
    );
  }

  if (error instanceof AppError) {
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status },
    );
  }

  console.error("Unhandled application error", error);
  return Response.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred.",
      },
    },
    { status: 500 },
  );
}
