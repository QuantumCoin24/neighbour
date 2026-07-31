"use client";

import { useEffect, useState } from "react";

import {
  getConversations,
  type Conversation,
} from "@neighbour/api-client";


export default function MessagesPage(){

  const [conversations,setConversations] =
    useState<Conversation[]>([]);

  const [loading,setLoading] =
    useState(true);


  async function load(){

    const token =
      localStorage.getItem("accessToken");

    if(!token)return;


    const result =
      await getConversations(token);


    setConversations(result.items);

    setLoading(false);

  }


  useEffect(()=>{

    load();

  },[]);



  if(loading){

    return (
      <main style={{padding:"40px"}}>
        Loading messages...
      </main>
    );

  }


  return (

    <main
      style={{
        padding:"40px",
        maxWidth:"800px",
        margin:"auto"
      }}
    >

      <h1>
        Messages
      </h1>


      {
        conversations.length === 0 ?

        (
          <p>
            No conversations yet.
          </p>
        )

        :

        conversations.map(conversation=>(

          <section
            key={conversation.id}
            style={{
              padding:"20px",
              marginTop:"15px",
              background:"#fff",
              borderRadius:"20px"
            }}
          >

            <h3>
              {
                conversation.title ??
                "Conversation"
              }
            </h3>


            <p>
              {
                conversation.lastMessage?.content ??
                "No messages yet"
              }
            </p>

          </section>

        ))

      }


    </main>

  );

}
