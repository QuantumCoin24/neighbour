"use client";

import { useEffect, useState } from "react";

import {
  getBusinessDashboard,
  getMyBusiness,
} from "@neighbour/api-client";


export default function BusinessDashboardPage(){


const [dashboard,setDashboard] = useState<any>(null);

const [loading,setLoading] = useState(true);



useEffect(()=>{

async function load(){

try{

const business =
await getMyBusiness();


if(!business){

setDashboard(null);

return;

}


const data =
await getBusinessDashboard(
business.id
);


setDashboard(data);

}
catch(error){

console.error(error);

}
finally{

setLoading(false);

}

}

load();

},[]);



if(loading){

return (

<main style={page}>

<h1>
Neighbour™ Business Centre
</h1>

<p>
Loading your business dashboard...
</p>

</main>

);

}



const business =
dashboard?.business;


const verification =
dashboard?.verification;



return (

<main style={page}>


<header style={hero}>

<h1>
Neighbour™ Business Centre
</h1>

<p>
Manage your local business presence and connect with your community.
</p>

</header>



<section style={businessCard}>


<div>

<h2>
{
business?.name ??
"Your Business"
}
</h2>


<p>
{
business?.category ??
"Business Category"
}
</p>


</div>



<div style={badge}>

🟢

{
verification?.status ??
"Pending"
}

</div>


</section>





<section style={grid}>


<DashboardCard

title="Offers"

value={
dashboard?.offers?.length ?? 0
}

label="Active Offers"

/>



<DashboardCard

title="Events"

value={
dashboard?.events?.length ?? 0
}

label="Upcoming Events"

/>



<DashboardCard

title="Verification"

value={
verification?.status ??
"Pending"
}

label="Business Trust"

/>



</section>





<section style={actions}>


<h2>
Quick Actions
</h2>


<div>

<button style={primary}>
Create Offer
</button>


<button style={secondary}>
Create Event
</button>


<button style={secondary}>
Edit Profile
</button>


</div>


</section>




</main>

);

}





function DashboardCard({

title,
value,
label,

}:{

title:string;
value:any;
label:string;

}){


return (

<div style={card}>

<h3>
{title}
</h3>


<strong>
{value}
</strong>


<p>
{label}
</p>


</div>

);

}





const page={

padding:"40px",

maxWidth:"1100px",

margin:"auto",

};



const hero={

background:
"linear-gradient(135deg,#08111F,#18283F)",

color:"#fff",

padding:"35px",

borderRadius:"24px",

};



const businessCard={

marginTop:"25px",

padding:"30px",

borderRadius:"22px",

background:"#fff",

display:"flex",

justifyContent:"space-between",

alignItems:"center",

boxShadow:"0 10px 30px rgba(0,0,0,.08)",

};



const badge={

background:"#E8F7E8",

padding:"12px 18px",

borderRadius:"30px",

fontWeight:700,

};



const grid={

display:"grid",

gridTemplateColumns:
"repeat(auto-fit,minmax(220px,1fr))",

gap:"20px",

marginTop:"25px",

};



const card={

background:"#fff",

padding:"25px",

borderRadius:"20px",

boxShadow:
"0 10px 30px rgba(0,0,0,.08)",

};



const actions={

marginTop:"30px",

background:"#fff",

padding:"30px",

borderRadius:"22px",

boxShadow:
"0 10px 30px rgba(0,0,0,.08)",

};



const primary={

background:"#08111F",

color:"#fff",

padding:"14px 22px",

borderRadius:"14px",

border:"none",

marginRight:"12px",

};



const secondary={

background:"#D6A84F",

color:"#08111F",

padding:"14px 22px",

borderRadius:"14px",

border:"none",

marginRight:"12px",

};


