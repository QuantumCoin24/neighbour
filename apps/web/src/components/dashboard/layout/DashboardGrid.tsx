"use client";

import React from "react";


export default function DashboardGrid({
children,
}:{
children:React.ReactNode;
}){


return (

<div
style={{
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",
gap:"24px",
alignItems:"start",
}}
>

{children}

</div>

);

}
