"use client";

import { useEffect, useState } from "react";

import {
  getCommunityEvents,
  type EventItem,
} from "@neighbour/api-client";

import {
  NeighbourCard,
  NeighbourBadge,
  NeighbourButton,
} from "@neighbour/design-system";


interface Props {
  communityId?:string;
}


export default function EventPreview({

  communityId,

}:Props){


const [events,setEvents] =
useState<EventItem[]>([]);



useEffect(()=>{


async function load(){


if(!communityId){

return;

}


try{


const response =
await getCommunityEvents(
communityId,
);


setEvents(
response.slice(0,3)
);


}
catch{


setEvents([]);

}


}


load();


},[
communityId,
]);



return (

<NeighbourCard

style={{

marginTop:"24px",

}}

>


<h2
style={{
margin:0,
fontSize:"24px",
}}
>

📅 Upcoming Events

</h2>


<p
style={{
marginTop:"8px",
color:"#667085",
}}
>

Discover what's happening locally.

</p>



{
events.length === 0 ?

<div
style={{
marginTop:"20px",
padding:"20px",
background:"#F7F9FC",
borderRadius:"16px",
}}
>

<p>
No upcoming events yet.
</p>

<p
style={{
color:"#667085",
}}
>

Create the first community event.

</p>

</div>


:


events.map(event=>(


<div

key={event.id}

style={{

marginTop:"20px",

padding:"20px",

background:"#F7F9FC",

borderRadius:"20px",

}}


>


<h3
style={{
margin:0,
}}
>

🎉 {event.title}

</h3>



<p
style={{
marginTop:"12px",
color:"#667085",
lineHeight:1.5,
}}
>

{event.description}

</p>



<NeighbourBadge>

📅 {
new Date(
event.startsAt
).toLocaleDateString()
}

</NeighbourBadge>


</div>


))

}



<div
style={{
marginTop:"20px",
}}
>

<NeighbourButton>

View Events

</NeighbourButton>

</div>



</NeighbourCard>

);

}
