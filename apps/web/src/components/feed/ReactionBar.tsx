"use client";

import {useEffect,useState} from "react";

import {
  setReaction,
  removeReaction,
  getReactionSummary,
} from "@neighbour/api-client";


export default function ReactionBar({
  postId
}:{
  postId:string;
}){

const [count,setCount]=useState(0);
const [liked,setLiked]=useState(false);


async function load(){

const token =
localStorage.getItem("accessToken");

if(!token)return;


const result =
await getReactionSummary(
token,
postId
);


setCount(result.total);

setLiked(
Boolean(result.viewerReaction)
);

}


useEffect(()=>{
load();
},[]);



async function toggle(){

const token =
localStorage.getItem("accessToken");

if(!token)return;


if(liked){

await removeReaction(
token,
postId
);

setLiked(false);
setCount(
value=>Math.max(0,value-1)
);

}
else{

await setReaction(
token,
postId,
"LIKE"
);

setLiked(true);
setCount(
value=>value+1
);

}

}


return (

<button
onClick={toggle}
style={{
border:"none",
background:"#f5f5f5",
borderRadiu
cd ~/Documents/neighbour

cat > apps/web/src/components/feed/ReactionBar.tsx <<'EOF'
"use client";

import {useEffect,useState} from "react";

import {
  setReaction,
  removeReaction,
  getReactionSummary,
} from "@neighbour/api-client";


export default function ReactionBar({
  postId
}:{
  postId:string;
}){

const [count,setCount]=useState(0);
const [liked,setLiked]=useState(false);


async function load(){

const token =
localStorage.getItem("accessToken");

if(!token)return;


const result =
await getReactionSummary(
token,
postId
);


setCount(result.total);

setLiked(
Boolean(result.viewerReaction)
);

}


useEffect(()=>{
load();
},[]);



async function toggle(){

const token =
localStorage.getItem("accessToken");

if(!token)return;


if(liked){

await removeReaction(
token,
postId
);

setLiked(false);
setCount(
value=>Math.max(0,value-1)
);

}
else{

await setReaction(
token,
postId,
"LIKE"
);

setLiked(true);
setCount(
value=>value+1
);

}

}


return (

<button
onClick={toggle}
style={{
border:"none",
background:"#f5f5f5",
borderRadius:"20px",
padding:"8px 18px",
cursor:"pointer"
}}
>

{liked ? "❤️" : "🤍"} {count}

</button>

);

}
