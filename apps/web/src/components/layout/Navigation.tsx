import Link from "next/link";

export default function Navigation(){

return (

<nav
style={{
display:"flex",
gap:"20px",
flexWrap:"wrap"
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


<Link href="/messages">
Messages
</Link>


<Link href="/notifications">
Notifications
</Link>


<Link href="/search">
Search
</Link>


<Link href="/profile/setup">
Profile
</Link>


</nav>

)

}
