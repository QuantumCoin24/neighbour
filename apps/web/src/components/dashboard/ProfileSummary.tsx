"use client";

import {
  NeighbourAvatar,
  NeighbourBadge,
  NeighbourCard,
} from "@neighbour/design-system";


interface Props {
  name:string;
  bio?:string|null;
}


export default function ProfileSummary({
  name,
  bio,
}:Props){


return (

<NeighbourCard>


<div
style={{
display:"flex",
alignItems:"center",
gap:"20px",
flexWrap:"wrap",
}}
>


<NeighbourAvatar
name={name}
size={64}
verified
/>



<div
style={{
flex:1,
}}
>


<h3
style={{
margin:0,
fontSize:"22px",
}}
>

{name}

</h3>


<div
style={{
marginTop:"8px",
}}
>

<NeighbourBadge>
🏡 Local Neighbour
</NeighbourBadge>

</div>


{
bio &&

<p
style={{
marginTop:"12px",
color:"#667085",
}}
>

{bio}

</p>

}


</div>


</div>


</NeighbourCard>

);

}
