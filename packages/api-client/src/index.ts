export const API_BASE_URL =
  process.env.NEIGHBOUR_API_URL ??
  "http://localhost:4000/api/v1";


export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {


  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("accessToken")
      : null;


  const response =
    await fetch(
      `${API_BASE_URL}${path}`,
      {
        ...options,

        headers: {
          "Content-Type": "application/json",

          ...(token
            ? {
                Authorization:
                  `Bearer ${token}`,
              }
            : {}),

          ...(options.headers ?? {}),
        },
      },
    );


  if (!response.ok) {

    const body =
      await response.text();

    console.error(
      "Neighbour API Failure:",
      response.status,
      body,
    );

    throw new Error(
      `Neighbour API Error ${response.status}`,
    );
  }


  return response.json();

}


export * from "./auth";
export * from "./community";
export * from "./feed";
export * from "./posts";
export * from "./profile";
export * from "./membership";
export * from "./interaction";
export * from "./neighbourhood";

export * from "./social";
