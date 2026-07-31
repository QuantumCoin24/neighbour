"use client";

import React from "react";

import Navigation from "./Navigation";


export default function AppShell({
  children,
}:{
  children:React.ReactNode;
}){


return (

<div
style={{
minHeight:"100vh",
background:"#F7F9FC",
display:"flex",
}}
>


<aside
style={{
width:"240px",
padding:"24px",
background:"#08111F",
color:"#FFFFFF",
}}
>


<h2
style={{
marginBottom:"30px",
}}
>
Neighbour™
</h2>


<Navigation />


</aside>



<main
style={{
flex:1,
padding:"32px",
}}
>

{children}

</main>


</div>

);

}
