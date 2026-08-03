"use client";

import React from "react";

import Navigation from "./Navigation";
import MobileNavigation from "./MobileNavigation";


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
className="desktop-nav"
style={{
width:"240px",
padding:"24px",
background:"#08111F",
color:"#FFFFFF",
}}
>

<h2>
Neighbour™
</h2>

<Navigation />

</aside>



<main
style={{
flex:1,
paddingBottom:"90px",
}}
>

{children}

</main>



<MobileNavigation />


<style jsx>{`

.desktop-nav{
display:block;
}


@media(max-width:768px){

.desktop-nav{
display:none;
}

}

`}</style>


</div>

);

}
