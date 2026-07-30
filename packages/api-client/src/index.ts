export const API_BASE_URL =
  process.env.NEIGHBOUR_API_URL ??
  "http://localhost:4000/api/v1";

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Neighbour API Error: ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}

export * from "./auth";
export * from "./profile";
export * from "./neighbourhood";
export * from "./membership";

export * from "./community";
export * from "./feed";

export * from "./posts";

export * from "./session";
export * from "./interaction";
