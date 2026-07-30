import Link from "next/link";

export default function Navigation(){

return (

<nav
style={{
display:"flex",
gap:"20px"
}}
>

<Link href="/home">
Home
</Link>


<Link href="/community">
Communities
</Link>


<Link href="/my-community">
My Communities
</Link>


<Link href="/profile">
Profile
</Link>


</nav>

)

}
