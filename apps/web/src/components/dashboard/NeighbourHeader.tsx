"use client";

import {
  NeighbourAvatar,
  NeighbourBadge,
  NeighbourCard,
} from "@neighbour/design-system";


interface Props {
  name:string;
  area:string|null;
}


export default function NeighbourHeader({
  name,
  area,
}:Props){


return (

<NeighbourCard
style={{
background:
"linear-gradient(135deg,#08111F,#162A45)",
color:"#FFFFFF",
marginBottom:"24px",
overflow:"hidden",
}}
>

<div
style={{
display:"flex",
alignItems:"center",
gap:"24px",
flexWrap:"wrap",
}}
>


<NeighbourAvatar
name={name}
size={84}
verified
/>


<div
style={{
flex:1,
}}
>


<h1
style={{
margin:0,
fontSize:"clamp(28px,5vw,40px)",
fontWeight:700,
}}
>

Good evening {name} 👋

</h1>


<p
style={{
marginTop:"8px",
opacity:.85,
fontSize:"18px",
}}
>

Welcome back to your neighbourhood

</p>


<div
style={{
marginTop:"16px",
}}
>

<NeighbourBadge>

📍 {area ?? "Discover your community"}

</NeighbourBadge>


</div>


</div>


</div>


</NeighbourCard>

);

}
