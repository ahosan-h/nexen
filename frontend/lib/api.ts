const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4445/nexen";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiFetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
  headers?: HeadersInit;
  cache?: RequestCache;
};

export async function apiFetch<T>(
  endpoint: string,
  {
    method = "GET",
    body,
    token,
    headers,
    cache = "no-store",
  }: ApiFetchOptions = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      method,
      cache,
      headers: {
        "Content-Type": "application/json",
        ...(token && {
          Authorization: `Bearer ${token}`,
        }),
        ...headers,
      },
      ...(body !== undefined && {
        body: JSON.stringify(body),
      }),
    });
  } catch (error) {
    throw new ApiError(
      "Unable to connect to the server. Please try again.",
      0,
      error,
    );
  }

  const contentType = response.headers.get("content-type");

  let data: unknown = null;

  try {
    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }
  } catch {
    // Ignore parsing errors
  }

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : response.statusText || "Something went wrong";

    throw new ApiError(message, response.status, data);
  }

  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return {} as T;
  }

  return data as T;
}
