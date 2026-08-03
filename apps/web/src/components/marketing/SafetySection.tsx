export default function SafetySection(){

const features = [

{
icon:"🚩",
title:"Community Reporting",
text:"Report concerns, content or behaviour directly through built-in community tools."
},

{
icon:"🛡️",
title:"Moderation Tools",
text:"Communities have structured review processes to help maintain safer spaces."
},

{
icon:"🔒",
title:"Privacy Controls",
text:"Users have control over their identity, information and interactions."
},

{
icon:"🤝",
title:"Community Standards",
text:"Neighbour™ is designed to encourage respectful and positive connections."
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
Built For Real Communities
</h2>


<p

style={{
fontSize:"20px",
maxWidth:"750px",
margin:"0 auto 50px",
color:"#555"
}}

>
Connection works best when people feel trusted,
respected and supported.
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
lineHeight:"1.5",
color:"#555"
}}

>
{feature.text}
</p>


</div>

))

}


</div>


</section>

);

}
