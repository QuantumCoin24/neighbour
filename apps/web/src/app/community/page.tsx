"use client";

import { useEffect, useState } from "react";

import {
  getNeighbourhoods,
  joinNeighbourhood,
  type Neighbourhood,
} from "@neighbour/api-client";


export default function CommunityPage() {

  const [communities,setCommunities] =
    useState<Neighbourhood[]>([]);

  const [joined,setJoined] =
    useState<string[]>([]);

  const [message,setMessage] =
    useState("");


  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("accessToken");
    console.log("COMMUNITY ACCESS TOKEN:", storedToken);
    setToken(storedToken);
  }, []);



  useEffect(()=>{

    if(!token){
      setMessage("Please login first.");
      return;
    }


    getNeighbourhoods(token)
      .then(setCommunities)
      .catch(error =>
        setMessage(
          error instanceof Error
          ? error.message
          : "Unable to load communities"
        )
      );

  },[token]);



  async function handleJoin(id:string){

    if(!token){
      setMessage("Please login first.");
      return;
    }


    try{

      await joinNeighbourhood(
        token,
        id
      );


      setJoined(prev=>[
        ...prev,
        id
      ]);


      setMessage(
        "Joined community ✅"
      );


    }catch(error){

      setMessage(
        error instanceof Error
        ? error.message
        : "Unable to join"
      );

    }

  }



  return (

    <main
      style={{
        minHeight:"100vh",
        padding:"50px",
        fontFamily:"Arial",
        background:
        "linear-gradient(135deg,#f5f9ff,#ffffff)"
      }}
    >

      <h1>
        NEIGHBOUR™
      </h1>


      <h2>
        Find your neighbourhood
      </h2>


      {
        message &&
        <p>{message}</p>
      }


      {
        communities.map(
          community=>(

            <section
              key={community.id}
              style={{
                marginTop:"20px",
                padding:"25px",
                background:"#fff",
                borderRadius:"20px"
              }}
            >

              <h3>
                📍 {community.name}
              </h3>


              <p>
                {community.localArea}
              </p>


              <p>
                {community.description}
              </p>


              <button
                onClick={() =>
                  handleJoin(community.id)
                }
              >

                {
                  joined.includes(
                    community.id
                  )
                  ?
                  "Joined ✅"
                  :
                  "Join Community"
                }

              </button>


            </section>

          )
        )
      }


    </main>

  );

}