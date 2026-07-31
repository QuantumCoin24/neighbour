"use client";

import Link from "next/link";


export default function MobileNavigation(){

return (

<nav
style={{
position:"fixed",
bottom:0,
left:0,
right:0,
height:"70px",
background:"#FFFFFF",
borderTop:"1px solid #E5E7EB",
display:"flex",
justifyContent:"space-around",
alignItems:"center",
zIndex:1000,
}}
>

<Link href="/home">
🏠
</Link>

<Link href="/community">
👥
</Link>

<Link href="/messages">
💬
</Link>

<Link href="/notifications">
🔔
</Link>

<Link href="/profile/setup">
👤
</Link>


</nav>

);

}
