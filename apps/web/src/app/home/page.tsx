"use client";

import { useEffect, useState } from "react";
import {
  apiRequest,
  getMyProfile,
} from "@neighbour/api-client";

interface User {
  id: string;
  email: string;
  displayName: string;
}

interface Profile {
  id: string;
  userId: string;
  username: string;
  localArea: string | null;
  bio?: string | null;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState(
    "Loading your neighbourhood...",
  );

  useEffect(() => {
    async function loadUser() {
      try {
        const token = localStorage.getItem("accessToken");

        if (!token) {
          setMessage("No active session found.");
          return;
        }

        const response = await apiRequest<User>(
          "/auth/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        setUser(response);

        const profileResponse =
          await getMyProfile(token);

        setProfile(profileResponse);
      } catch {
        setMessage("Unable to load your profile.");
      }
    }

    loadUser();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "50px",
        fontFamily: "Arial, sans-serif",
        background:
          "linear-gradient(135deg,#f5f9ff,#ffffff)",
      }}
    >
      <h1>
        NEIGHBOUR™
      </h1>

      {user ? (
        <>
          <h2>
            Welcome {user.displayName} 👋
          </h2>

          <section
            style={{
              marginTop: "40px",
              padding: "30px",
              borderRadius: "20px",
              background: "#fff",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.08)",
            }}
          >
            <h3>
              Your neighbourhood
            </h3>

            <p>
              📍{" "}
              <a
                href="/community"
                style={{
                  color: "#111",
                  textDecoration: "underline",
                }}
              >
                {profile?.localArea ?? "Find your community"}
              </a>
            </p>

            {profile?.bio && (
              <p>
                {profile.bio}
              </p>
            )}
          </section>

          <section
            style={{
              marginTop: "30px",
              padding: "30px",
              borderRadius: "20px",
              background: "#fff",
            }}
          >
            <h3>
              Community Feed
            </h3>

            <p>
              No posts yet.
            </p>

            <p>
              Be the first neighbour to share something.
            </p>
          </section>
        </>
      ) : (
        <p>{message}</p>
      )}
    </main>
  );
}
