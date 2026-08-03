"use client";

import {
  NeighbourBadge,
  NeighbourButton,
  NeighbourCard,
} from "@neighbour/design-system";


interface Props {
  area:string|null;
}


export default function CommunityPulse({
  area,
}:Props){

return (

<NeighbourCard
style={{
marginTop:"24px",
}}
>

<h2>
Community Pulse
</h2>


<p>
Your local neighbourhood activity
</p>


<div
style={{
display:"flex",
gap:"12px",
flexWrap:"wrap",
marginTop:"16px",
}}
>

<NeighbourBadge>
📍 {area ?? "Discover your area"}
</NeighbourBadge>


<NeighbourBadge>
👥 Local Neighbours
</NeighbourBadge>


<NeighbourBadge>
🏘️ Community
</NeighbourBadge>


</div>


<div
style={{
marginTop:"20px",
display:"flex",
gap:"12px",
}}
>

<NeighbourButton>
Explore Community
</NeighbourButton>


<NeighbourButton
variant="secondary"
>
Create Post
</NeighbourButton>


</div>


</NeighbourCard>

);

}
