"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "next/navigation";

import {
  getModerationReports,
  updateModerationReport,
} from "@neighbour/api-client";

import {
  NeighbourBadge,
  NeighbourButton,
  NeighbourCard,
} from "@neighbour/design-system";


export default function ReportReviewPage(){

const params = useParams();

const id =
params.id as string;


const [report,setReport] =
useState<any>(null);



async function load(){

const token =
localStorage.getItem("accessToken");

if(!token){
return;
}


const reports =
await getModerationReports(token);


const found =
reports.find(
(item)=>item.id===id
);


setReport(found);

}



useEffect(()=>{

load();

},[]);



async function update(status:string){

const token =
localStorage.getItem("accessToken");

if(!token){
return;
}


await updateModerationReport(
token,
id,
{
status,
notes:"Reviewed in Safety Centre",
},
);


await load();

}



if(!report){

return (
<main style={{padding:"40px"}}>
Loading case...
</main>
);

}



return (

<main
style={{
padding:"40px",
maxWidth:"1000px",
margin:"auto",
}}
>


<h1>
🛡️ Report Review
</h1>


<NeighbourCard>

<h2>
Report Information
</h2>

<NeighbourBadge>
{report.status}
</NeighbourBadge>

<p>
Target: {report.targetType}
</p>

<p>
Reason: {report.reason}
</p>

<p>
Created:
{" "}
{new Date(report.createdAt).toLocaleString()}
</p>

</NeighbourCard>



<NeighbourCard
style={{
marginTop:"20px",
}}
>

<h2>
Reporter
</h2>

<p>
{
report.reporter?.displayName ??
"Unknown"
}
</p>

<p>
Role:
{" "}
{
report.reporter?.role ??
"Unknown"
}
</p>

</NeighbourCard>




<NeighbourCard
style={{
marginTop:"20px",
}}
>

<h2>
Evidence
</h2>


{
report.evidence ?

<>

<p>
{
report.evidence.content ??
report.evidence.title ??
"No content available"
}
</p>


{
report.evidence.author &&
<p>
Author:
{" "}
{report.evidence.author.displayName}
</p>
}


{
report.evidence.community &&
<p>
Community:
{" "}
{report.evidence.community.name}
</p>
}

</>

:

<p>
No evidence available.
</p>

}


</NeighbourCard>




<NeighbourCard
style={{
marginTop:"20px",
}}
>

<h2>
Moderation History
</h2>


{
report.actions?.length ?

report.actions.map(
(action:any)=>(

<p key={action.id}>

{action.action}

{" by "}

{
action.moderator?.displayName ??
"Moderator"
}

</p>

)

)

:

<p>
No actions recorded.
</p>

}


</NeighbourCard>




<div
style={{
marginTop:"24px",
display:"flex",
gap:"12px",
}}
>


<NeighbourButton
onClick={()=>update("RESOLVED")}
>
Resolve
</NeighbourButton>


<NeighbourButton
variant="secondary"
onClick={()=>update("DISMISSED")}
>
Dismiss
</NeighbourButton>


</div>


</main>

);

}
