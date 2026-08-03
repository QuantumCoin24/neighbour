export default function HowItWorks(){

const steps = [

{
icon:"🔎",
title:"Discover",
text:"Find neighbourhoods and communities around you."
},

{
icon:"🤝",
title:"Connect",
text:"Meet neighbours, share updates and build relationships."
},

{
icon:"📅",
title:"Participate",
text:"Join events and activities happening locally."
},

{
icon:"🏘️",
title:"Build",
text:"Help create stronger communities together."
}

];


return (

<section
style={{
padding:"80px 40px",
background:"#ffffff",
textAlign:"center"
}}
>

<h2
style={{
fontSize:"42px",
marginBottom:"20px"
}}
>
How Neighbour™ Works
</h2>


<p
style={{
fontSize:"20px",
maxWidth:"700px",
margin:"0 auto 50px",
color:"#555"
}}
>
A simple way to discover, connect and participate
in the communities around you.
</p>



<div
style={{
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",
gap:"25px",
maxWidth:"1100px",
margin:"auto"
}}
>


{
steps.map(step=>(

<div
key={step.title}
style={{
padding:"30px",
borderRadius:"24px",
background:"#f8fafc",
border:"1px solid #e5e7eb"
}}
>


<div
style={{
fontSize:"40px"
}}
>
{step.icon}
</div>


<h3
style={{
fontSize:"24px",
marginTop:"20px"
}}
>
{step.title}
</h3>


<p
style={{
marginTop:"15px",
lineHeight:"1.5",
color:"#555"
}}
>
{step.text}
</p>


</div>

))
}


</div>


</section>

);

}
