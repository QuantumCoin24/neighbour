"use client";

import {
  useEffect,
  useState
} from "react";

import {
  getNotifications,
  markNotificationRead,
  type Notification
} from "@neighbour/api-client";


export default function NotificationsPage(){

  const [items,setItems] =
    useState<Notification[]>([]);

  const [unread,setUnread] =
    useState(0);



  async function load(){

    const token =
      localStorage.getItem("accessToken");

    if(!token)return;


    const result =
      await getNotifications(token);


    setItems(result.items);

    setUnread(result.unreadCount);

  }



  useEffect(()=>{

    load();

  },[]);



  async function read(id:string){

    const token =
      localStorage.getItem("accessToken");

    if(!token)return;


    await markNotificationRead(
      token,
      id
    );


    await load();

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
        Notifications
      </h1>


      <p>
        Unread: {unread}
      </p>


      {
        items.length === 0 ?

        (
          <p>
            No notifications yet.
          </p>
        )

        :

        items.map(item=>(

          <section
            key={item.id}
            onClick={() => read(item.id)}
            style={{
              padding:"20px",
              marginTop:"15px",
              background:"#fff",
              borderRadius:"20px",
              cursor:"pointer"
            }}
          >

            <strong>
              {item.type}
            </strong>

            <p>
              {
                item.actor?.displayName ??
                "System"
              }
            </p>

          </section>

        ))

      }


    </main>

  );

}
