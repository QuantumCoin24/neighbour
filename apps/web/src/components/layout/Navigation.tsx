"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";


const links = [
  {
    href:"/home",
    label:"Home",
    icon:"🏠",
  },
  {
    href:"/community",
    label:"Communities",
    icon:"👥",
  },
  {
    href:"/my-community",
    label:"My Area",
    icon:"🏘️",
  },
  {
    href:"/messages",
    label:"Messages",
    icon:"💬",
  },
  {
    href:"/notifications",
    label:"Notifications",
    icon:"🔔",
  },
  {
    href:"/search",
    label:"Search",
    icon:"🔍",
  },
  {
    href:"/profile/setup",
    label:"Profile",
    icon:"👤",
  },
];


export default function Navigation(){

const pathname = usePathname();


return (

<nav
style={{
display:"flex",
flexDirection:"column",
gap:"8px",
}}
>

{
links.map(link=>{

const active =
pathname === link.href;


return (

<Link
key={link.href}
href={link.href}
style={{
display:"flex",
alignItems:"center",
gap:"12px",
padding:"12px 16px",
borderRadius:"16px",
textDecoration:"none",
color:
active
? "#08111F"
: "#FFFFFF",
background:
active
? "#D6A84F"
: "transparent",
fontWeight:600,
transition:"all .2s ease",
}}
>

<span>
{link.icon}
</span>

<span>
{link.label}
</span>

</Link>

);

})

}

</nav>

);

}
