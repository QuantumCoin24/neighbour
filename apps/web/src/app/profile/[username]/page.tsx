"use client";

import { use, useEffect, useState } from "react";

import {
  getPublicProfile,
  type PublicProfile,
} from "@neighbour/api-client";


export default function PublicProfilePage({
  params,
}: {
  params: Promise<{
    username: string;
  }>;
}) {

  const { username } = use(params);

  const [profile,setProfile] =
    useState<PublicProfile | null>(null);

  const [message,setMessage] =
    useState("Loading profile...");


  useEffect(()=>{

    async function load(){

      try {

        const result =
          await getPublicProfile(
            username
          );

        setProfile(result);

      } catch {

        setMessage(
          "Profile not found."
        );

      }

    }

    load();

  },[username]);


  if(!profile){

    return (
      <main style={{padding:"40px"}}>
        {message}
      </main>
    );

  }


  return (
    <main
      style={{
        padding:"40px",
        background:"#f5f7fb",
        minHeight:"100vh"
      }}
    >

      <section
        style={{
          background:"#fff",
          padding:"30px",
          borderRadius:"24px"
        }}
      >

        <h1>
          {profile.displayName}
        </h1>

        <p>
          @{profile.username}
        </p>

        <p>
          📍 {profile.localArea ?? "Location hidden"}
        </p>

        <p>
          {profile.bio ?? "No bio yet"}
        </p>

        <p>
          Profile created:
          {" "}
          {new Date(profile.createdAt).toLocaleDateString()}
        </p>

      </section>

    </main>
  );

}
