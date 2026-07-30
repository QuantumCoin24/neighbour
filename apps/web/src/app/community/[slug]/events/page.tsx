"use client";

import {useParams} from "next/navigation";


export default function EventsPage(){

const params=useParams();


return (

<main style={{
padding:"40px"
}}>

<h1>
Community Events
</h1>

<p>
Upcoming events for {params.slug as string}
</p>


<div>
No events yet
</div>


</main>

);

}
