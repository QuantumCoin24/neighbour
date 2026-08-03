export default function CommunityShowcase(){

const communities = [

{
name:"Blackley Residents",
area:"Manchester",
members:"Local community"
},

{
name:"Neighbourhood Events",
area:"Your area",
members:"Events and activities"
},

{
name:"Community Support",
area:"Nearby",
members:"Help and connection"
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
Find Your Community
</h2>


<p

style={{
fontSize:"20px",
maxWidth:"700px",
margin:"0 auto 50px",
color:"#555"
}}

>
Discover neighbourhoods, connect with local people,
and take part in the communities around you.
</p>



<div

style={{
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",
gap:"25px",
maxWidth:"1000px",
margin:"auto"
}}

>


{
communities.map((community)=>(

<div

key={community.name}

style={{
background:"#fff",
padding:"30px",
borderRadius:"24px",
border:"1px solid #e5e7eb",
textAlign:"left"
}}

>


<h3

style={{
fontSize:"24px"
}}

>
🏘️ {community.name}
</h3>


<p>

📍 {community.area}

</p>


<p

style={{
marginTop:"15px",
color:"#555"
}}

>
{community.members}
</p>


<button

style={{
marginTop:"20px",
padding:"12px 22px",
borderRadius:"20px",
border:"none",
background:"#111",
color:"#fff",
cursor:"pointer"
}}

>
Explore Community
</button>


</div>

))

}


</div>


</section>

);

}
