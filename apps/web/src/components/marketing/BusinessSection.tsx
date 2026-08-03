export default function BusinessSection(){

const features = [

{
icon:"✓",
title:"Verified Profiles",
text:"Businesses can create trusted profiles that help residents discover local services."
},

{
icon:"📢",
title:"Community Updates",
text:"Share announcements, offers and news directly with local communities."
},

{
icon:"📅",
title:"Events & Sponsorship",
text:"Support local events and become part of community activity."
},

{
icon:"📊",
title:"Insights",
text:"Understand engagement and how your business connects locally."
}

];


return (

<section

style={{
padding:"90px 40px",
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
Support The Places That Make Communities Thrive
</h2>


<p

style={{
fontSize:"20px",
maxWidth:"750px",
margin:"0 auto 50px",
color:"#555"
}}

>
Neighbour™ helps local businesses build meaningful
connections with the communities around them.
</p>



<div

style={{
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",
gap:"25px",
maxWidth:"1100px",
margin:"auto"
}}

>


{
features.map(feature=>(

<div

key={feature.title}

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
{feature.icon}
</div>


<h3

style={{
fontSize:"24px",
marginTop:"20px"
}}

>
{feature.title}
</h3>


<p

style={{
marginTop:"15px",
color:"#555",
lineHeight:"1.5"
}}

>
{feature.text}
</p>


</div>

))

}


</div>



<button

style={{
marginTop:"45px",
padding:"15px 30px",
borderRadius:"30px",
border:"none",
background:"#111",
color:"#fff",
fontSize:"18px",
cursor:"pointer"
}}

>
For Businesses
</button>


</section>

);

}
