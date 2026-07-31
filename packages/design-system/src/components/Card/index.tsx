import React from "react";


export function NeighbourCard({
children,
style,
}:{
children:React.ReactNode;
style?:React.CSSProperties;
}){


return (

<div
style={{
background:"#FFFFFF",
borderRadius:"24px",
padding:"24px",
boxShadow:"0 10px 30px rgba(0,0,0,0.06)",
...style,
}}
>

{children}

</div>

);

}
