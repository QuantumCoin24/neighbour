"use client";

import { useEffect, useState } from "react";

import {
  apiRequest,
  getMyProfile,
} from "@neighbour/api-client";

import {
  NeighbourAvatar,
  NeighbourBadge,
  NeighbourButton,
  NeighbourCard,
} from "@neighbour/design-system";

import PageContainer from "../../components/layout/PageContainer";


interface User {
  id:string;
  email:string;
  displayName:string;
}


interface Profile {
  id:string;
  userId:string;
  username:string;
  localArea:string|null;
  bio?:string|null;
}


export default function HomePage(){

const [user,setUser] =
useState<User|null>(null);

const [profile,setProfile] =
useState<Profile|null>(null);

const [message,setMessage] =
useState("Loading your neighbourhood...");


useEffect(()=>{

async function load(){

try{

const token =
localStorage.getItem("accessToken");


if(!token){

setMessage("No active session found.");

return;

}


const response =
await apiRequest<User>(
"/auth/me",
{
headers:{
Authorization:`Bearer ${token}`,
},
},
);


setUser(response);


const profileResponse =
await getMyProfile(token);


setProfile(profileResponse);


}
catch{

setMessage(
"Unable to load your profile."
);

}

}


load();

},[]);



if(!user){

return (

<PageContainer>

<NeighbourCard>

<h2>
{message}
</h2>

</NeighbourCard>

</PageContainer>

);

}



return (

<PageContainer>


<h1>
Neighbour™
</h1>


<h2>
Good evening {user.displayName} 👋
</h2>



<NeighbourCard>

<NeighbourAvatar
name={user.displayName}
/>


<h3>
{user.displayName}
</h3>


<NeighbourBadge>
Local Neighbour
</NeighbourBadge>


<p>
📍 {profile?.localArea ?? "Discover your community"}
</p>


{
profile?.bio &&
<p>
{profile.bio}
</p>
}


</NeighbourCard>




<NeighbourCard>

<h2>
Your Community
</h2>


<p>
{
profile?.localArea ??
"Find neighbours near you"
}
</p>


<NeighbourButton>
Explore Community
</NeighbourButton>


</NeighbourCard>




<NeighbourCard>

<h2>
Community Activity
</h2>


<p>
No posts yet.
</p>


<p>
Be the first neighbour to share something.
</p>


<NeighbourButton
variant="secondary"
>
Create Post
</NeighbourButton>


</NeighbourCard>




<NeighbourCard>

<h2>
Upcoming Events
</h2>


<p>
Discover local events happening nearby.
</p>


</NeighbourCard>



</PageContainer>

);

}
