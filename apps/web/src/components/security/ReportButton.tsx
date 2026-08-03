"use client";

import {
  useState,
} from "react";


import {
  createSecurityReport,
} from "@neighbour/api-client";


import {
  NeighbourButton,
} from "@neighbour/design-system";


interface Props {

targetType:
"USER"
|"POST"
|"COMMENT"
|"MESSAGE"
|"EVENT";

targetId:string;

}


export default function ReportButton({

targetType,

targetId,

}:Props){


const [message,setMessage] =
useState("");



async function report(){


const token =
localStorage.getItem("accessToken");


if(!token){

return;

}


try{


await createSecurityReport(

token,

{

targetType,

targetId,

reason:"Community Report",

},

);


setMessage(
"Reported"
);


}
catch{

setMessage(
"Unable to report"
);

}


}



return (

<div>


<NeighbourButton

variant="ghost"

onClick={report}

>

🚩 Report

</NeighbourButton>


{
message &&

<small>
{message}
</small>

}


</div>

);

}
