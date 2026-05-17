export class JsonBodyError extends Error {
  readonly code: "payload_too_large" | "invalid_json";
  readonly status: number;

  constructor(code: "payload_too_large" | "invalid_json", message: string) {
    super(message);
    this.name = "JsonBodyError";
    this.code = code;
    this.status = code === "payload_too_large" ? 413 : 400;
  }
}

export async function readJsonBody(
  request: Request,
  maxBytes: number,
): Promise<unknown> {
  const body = await request.text();
  const byteLength = new TextEncoder().encode(body).length;

  if (byteLength > maxBytes) {
    throw new JsonBodyError(
      "payload_too_large",
      `JSON body exceeds ${maxBytes} bytes.`,
    );
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new JsonBodyError("invalid_json", "Request body must be valid JSON.");
  }
}
