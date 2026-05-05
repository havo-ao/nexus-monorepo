function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseApiErrorMessage(status: number, body: unknown): string {
  if (status === 429 && isRecord(body)) {
    const base =
      typeof body.message === "string" && body.message.trim()
        ? body.message.trim()
        : "Too many failed sign-in attempts. Your account is temporarily locked.";
    const retryAfter = body.retryAfter;
    if (typeof retryAfter === "number" && retryAfter > 0) {
      const minutes = Math.max(1, Math.ceil(retryAfter / 60));
      return `${base}\n\nYou can try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`;
    }
    return base;
  }

  if (status === 400 && isRecord(body)) {
    const fieldLines = Object.entries(body)
      .filter(([key]) => key !== "error" && key !== "message" && key !== "retryAfter")
      .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
      .map(([key, value]) => `${key}: ${value}`);

    if (fieldLines.length > 0) {
      return fieldLines.join("\n");
    }
  }

  if (isRecord(body)) {
    const message = body.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }

    const error = body.error;
    if (typeof error === "string" && error.trim()) {
      const msg = body.message;
      if (typeof msg === "string" && msg.trim()) {
        return `${error}: ${msg}`;
      }
      return error;
    }

    const fieldMessages = Object.entries(body)
      .filter(([key]) => key !== "error" && key !== "message")
      .map(([, value]) => value)
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0);

    if (fieldMessages.length > 0) {
      return fieldMessages.slice(0, 8).join("\n");
    }
  }

  if (typeof body === "string" && body.trim()) {
    return body;
  }

  return `Request failed (${status}). Please try again.`;
}
