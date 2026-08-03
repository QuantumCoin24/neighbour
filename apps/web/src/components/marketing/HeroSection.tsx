export default function HeroSection(){

return (

<section
style={{
minHeight:"70vh",
display:"flex",
flexDirection:"column",
justifyContent:"center",
alignItems:"center",
textAlign:"center",
padding:"80px 30px",
background:
"linear-gradient(135deg,#f5f9ff,#ffffff)"
}}
>


<h1
style={{
fontSize:"72px",
fontWeight:800,
margin:0
}}
>
Your local community,
<br/>
connected.
</h1>


<p
style={{
fontSize:"24px",
maxWidth:"700px",
marginTop:"30px",
lineHeight:1.5
}}
>
Discover your neighbourhood.
Connect with people nearby.
Build stronger communities together.
</p>



<div
style={{
marginTop:"40px",
display:"flex",
gap:"20px"
}}
>

<button
style={{
padding:"16px 30px",
borderRadius:"30px",
border:"none",
background:"#111",
color:"#fff",
fontSize:"18px"
}}
>
Find My Neighbourhood
</button>



<button
style={{
padding:"16px 30px",
borderRadius:"30px",
border:"1px solid #111",
background:"#fff",
fontSize:"18px"
}}
>
Download App
</button>


</div>


</section>

);

}
