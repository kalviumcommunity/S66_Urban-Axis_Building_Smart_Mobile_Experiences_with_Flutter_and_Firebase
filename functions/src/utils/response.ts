import { Response } from "express";
import { SuccessResponse, ErrorResponse, ErrorCode } from "../models/types";

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = "Success",
  statusCode = 200
): void {
  const body: SuccessResponse<T> = { success: true, message, data };
  res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  errorCode: ErrorCode,
  message: string,
  statusCode = 400
): void {
  const body: ErrorResponse = { success: false, errorCode, message };
  res.status(statusCode).json(body);
}

export function sendNotFound(res: Response, entity = "Resource"): void {
  sendError(res, "RESOURCE_NOT_FOUND", `${entity} not found`, 404);
}

export function sendUnauthorized(res: Response, msg = "Authentication required"): void {
  sendError(res, "AUTH_ERROR", msg, 401);
}

export function sendForbidden(res: Response, msg = "Permission denied"): void {
  sendError(res, "PERMISSION_DENIED", msg, 403);
}

export function sendValidationError(res: Response, msg: string): void {
  sendError(res, "VALIDATION_ERROR", msg, 422);
}

export function sendServerError(res: Response, err?: unknown): void {
  const msg =
    err instanceof Error ? err.message : "An unexpected error occurred";
  sendError(res, "SERVER_ERROR", msg, 500);
}
