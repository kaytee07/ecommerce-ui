import { ApiResponse, ApiError } from '@/types';

export class ApiException extends Error {
  code: number;
  errorCode: string;
  details?: Record<string, unknown>;
  traceId?: string;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiException';
    this.code = error.code;
    this.errorCode = error.errorCode;
    this.details = error.details;
    this.traceId = error.traceId;
  }
}

export function handleApiResponse<T>(response: { data: ApiResponse<T> }): T {
  const { status, data, message } = response.data;

  if (!status) {
    throw new ApiException(data as unknown as ApiError);
  }

  return data;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiException) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

export function getFieldErrors(error: unknown): Record<string, string> | null {
  if (error instanceof ApiException && error.details) {
    const fieldErrors: Record<string, string> = {};
    Object.entries(error.details).forEach(([key, value]) => {
      if (typeof value === 'string') {
        fieldErrors[key] = value;
      }
    });
    return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
  }
  return null;
}
