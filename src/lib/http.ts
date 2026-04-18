import type { AppError } from "@/lib/errors";
import type { ErrorResponse } from "@/openapi/common";

export function toErrorResponse(error: AppError): ErrorResponse {
  return {
    code: error.code,
    message: error.message,
    statusCode: error.statusCode,
  };
}
