export default function OrganisationSection(){

const organisations = [

{
icon:"🏫",
title:"Schools",
text:"Share updates, events and important information with your community."
},

{
icon:"🏛️",
title:"Councils",
text:"Connect local services and community information in one trusted place."
},

{
icon:"⚽",
title:"Clubs",
text:"Bring members together through events, updates and activities."
},

{
icon:"❤️",
title:"Charities",
text:"Create stronger connections with the people you support."
}

];


return (

<section
style={{
padding:"90px 40px",
background:"#f8fafc",
textAlign:"center"
}}
>

<h2
style={{
fontSize:"42px",
marginBottom:"20px"
}}
>
Bring Organisations Closer To Communities
</h2>


<p
style={{
fontSize:"20px",
maxWidth:"750px",
margin:"0 auto 50px",
color:"#555"
}}
>
Schools, councils, clubs and charities can create trusted
connections with the communities they serve.
</p>


<div
style={{
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",
gap:"25px",
maxWidth:"1100px",
margin:"auto"
}}
>

{
organisations.map(org=>(

<div
key={org.title}
style={{
background:"#fff",
padding:"30px",
borderRadius:"24px",
border:"1px solid #e5e7eb"
}}
>

<div
style={{
fontSize:"40px"
}}
>
{org.icon}
</div>


<h3
style={{
fontSize:"24px",
marginTop:"20px"
}}
>
{org.title}
</h3>


<p
style={{
marginTop:"15px",
color:"#555",
lineHeight:"1.5"
}}
>
{org.text}
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
For Organisations
</button>


</section>

);

}
