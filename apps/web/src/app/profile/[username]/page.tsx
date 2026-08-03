"use client";

import { use, useEffect, useState } from "react";

import ReportButton from "../../../components/security/ReportButton";

import {
  getPublicProfile,
  getPostsByProfile,
  getRelationshipStatus,
  sendConnectionRequest,
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

  const [posts,setPosts] =
    useState<any[]>([]);

  const [relationship,setRelationship] =
    useState<any>(null);


  useEffect(()=>{

    async function load(){

      try {

        const result =
          await getPublicProfile(
            username
          );

        setProfile(result);

        const profilePosts =
          await getPostsByProfile(
            username
          );

        setPosts(profilePosts.items);

        const relation =
          await getRelationshipStatus(
            localStorage.getItem("accessToken") ?? "",
            result.userId
          );

        setRelationship(relation);

      } catch {

        setMessage(
          "Profile not found."
        );

      }

    }

    load();

  },[username]);



async function connect(){

const token =
localStorage.getItem("accessToken");

if(!token)return;

await sendConnectionRequest(
 token,
 profile?.userId
);

const updated =
await getRelationshipStatus(
 token,
 profile?.userId
);

setRelationship(updated);

}


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

        <button
          onClick={connect}
          disabled={
            relationship?.status === "CONNECTED" ||
            relationship?.status === "OUTGOING_REQUEST"
          }
          style={{
            marginTop:"15px",
            padding:"10px 20px",
            borderRadius:"20px",
            border:"none",
            cursor:"pointer"
          }}
        >
          {
            relationship?.status === "CONNECTED"
              ? "Connected"
              :
            relationship?.status === "OUTGOING_REQUEST"
              ? "Request Sent"
              :
              "Add Neighbour"
          }
        </button>


        <ReportButton
          targetType="USER"
          targetId={profile.userId}
        />


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

        <hr />

        <h2>
          Posts
        </h2>

        {
          posts.map(post => (
            <div
              key={post.id}
              style={{
                marginTop:"15px",
                padding:"15px",
                background:"#f5f5f5",
                borderRadius:"15px"
              }}
            >
              {post.content}
            </div>
          ))
        }

      </section>

    </main>
  );

}
