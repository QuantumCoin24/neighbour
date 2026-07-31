"use client";

export default function CommunityHeader({
  community,
}: {
  community:any;
}) {

return (

<section
style={{
background:"linear-gradient(135deg,#111827,#1f2937)",
color:"#fff",
borderRadius:"24px",
padding:"30px",
marginBottom:"25px"
}}
>

<h1
style={{
fontSize:"36px",
marginBottom:"8px"
}}
>
{community.name}
™
</h1>

<p
style={{
opacity:.8,
fontSize:"18px"
}}
>
{community.localArea ?? "Local community"}
</p>


<div
style={{
display:"flex",
gap:"20px",
marginTop:"20px"
}}
>

<span>
🏘️ Community
</span>

<span>
✓ Joined
</span>

</div>


</section>

);

}
