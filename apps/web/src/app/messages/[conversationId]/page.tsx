"use client";

import {
  useEffect,
  useState
} from "react";

import {
  useParams
} from "next/navigation";

import ReportButton from "../../../components/security/ReportButton";

import {
  getConversation,
  getMessages,
  sendMessage,
  markConversationRead,
  type Conversation,
  type Message,
} from "@neighbour/api-client";


export default function ConversationPage(){

  const params = useParams();

  const conversationId =
    params.conversationId as string;


  const [conversation,setConversation] =
    useState<Conversation|null>(null);

  const [messages,setMessages] =
    useState<Message[]>([]);

  const [content,setContent] =
    useState("");



  async function load(){

    const token =
      localStorage.getItem("accessToken");

    if(!token)return;


    const c =
      await getConversation(
        token,
        conversationId
      );

    setConversation(c);


    const feed =
      await getMessages(
        token,
        conversationId
      );

    setMessages(feed.items);


    await markConversationRead(
      token,
      conversationId
    );

  }



  useEffect(()=>{

    load();

  },[]);



  async function send(){

    const token =
      localStorage.getItem("accessToken");

    if(!token)return;

    if(!content.trim())return;


    await sendMessage(
      token,
      conversationId,
      content
    );


    setContent("");

    await load();

  }



  if(!conversation){

    return (
      <main style={{padding:"40px"}}>
        Loading conversation...
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
        Conversation
      </h1>


      <section>

      {
        messages.map(message=>(

          <div
            key={message.id}
            style={{
              padding:"15px",
              margin:"10px 0",
              background:"#fff",
              borderRadius:"15px"
            }}
          >

            <strong>
              {message.sender.displayName}
            </strong>

            <p>
              {message.content}
            </p>


            <ReportButton
              targetType="MESSAGE"
              targetId={message.id}
            />

          </div>

        ))
      }

      </section>



      <section>

        <textarea
          value={content}
          onChange={
            e=>setContent(e.target.value)
          }
          placeholder="Write a message..."
          style={{
            width:"100%",
            minHeight:"100px"
          }}
        />


        <button
          onClick={send}
          style={{
            marginTop:"10px",
            padding:"10px 25px"
          }}
        >
          Send
        </button>


      </section>


    </main>

  );

}
