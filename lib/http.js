import { ApiError as BaseApiError, request } from "@/lib/api";
import { LOGIN_PATH } from "@/lib/config";
import { clearSession } from "@/lib/session";

export class ApiError extends BaseApiError {
  constructor(status, message, fieldErrors = {}) {
    super(status, message);
    this.name = "ApiError";
    this.fieldErrors = fieldErrors;
  }
}

const FRIENDLY_MESSAGES = {
  401: "Your session has ended. Please log in again.",
  403: "You don't have permission to do this.",
  404: "We couldn't find what you were looking for.",
  409: "This action is no longer possible.",
  503: "This service is temporarily unavailable. Please try again shortly.",
};

function cleanMessage(message) {
  return message.replace(/^Value error,\s*/i, "");
}

function toApiError(error) {
  const status = error.status;
  const detail = error.detail;
  const fieldErrors = {};
  let message = FRIENDLY_MESSAGES[status] ?? error.message;

  if (status !== 401 && typeof detail === "string") {
    message = detail;
  } else if (Array.isArray(detail)) {
    for (const item of detail) {
      const loc = item.loc;
      const msg = item.msg;
      const field = Array.isArray(loc) ? loc[loc.length - 1] : undefined;

      if (typeof msg !== "string") continue;

      if (typeof field === "string" && field !== "body") {
        fieldErrors[field] ??= cleanMessage(msg);
      } else {
        message = cleanMessage(msg);
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      message = "Some details need fixing before you can continue.";
    }
  }

  return new ApiError(status, message, fieldErrors);
}

export function isAbortError(error) {
  return error?.name === "AbortError";
}

export function toError(error) {
  if (error instanceof ApiError) return error;

  if (error instanceof BaseApiError) {
    return new ApiError(error.status, error.message);
  }

  if (isAbortError(error)) return error;

  return new ApiError(0, "Something went wrong. Please try again.");
}

export async function apiRequest(path, options = {}) {
  try {
    return await request(path, {
      ...options,
      auth: options.auth ?? true,
    });
  } catch (caught) {
    if (isAbortError(caught)) throw caught;

    const error =
      caught instanceof BaseApiError ? toApiError(caught) : toError(caught);

    if (error.status === 401 && typeof window !== "undefined") {
      clearSession();
      window.location.replace(LOGIN_PATH);
    }

    throw error;
  }
}
