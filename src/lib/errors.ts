export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = "INTERNAL_ERROR"
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(resource: string, cause?: unknown) {
    super(`${resource} unavailable`, 503, "SERVICE_UNAVAILABLE");
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

export class ProviderError extends AppError {
  constructor(
    public provider: string,
    message: string,
    cause?: unknown,
  ) {
    super(`${provider}: ${message}`, 502, "PROVIDER_ERROR");
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}
