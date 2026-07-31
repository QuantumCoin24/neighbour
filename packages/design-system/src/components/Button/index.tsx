import React from "react";

export interface NeighbourButtonProps
extends React.ButtonHTMLAttributes<HTMLButtonElement>{
  variant?:
    | "primary"
    | "secondary"
    | "ghost";
}


export function NeighbourButton({
  variant="primary",
  children,
  style,
  ...props
}:NeighbourButtonProps){

const variants={

primary:{
background:"#D6A84F",
color:"#08111F",
},

secondary:{
background:"#2F80ED",
color:"#FFFFFF",
},

ghost:{
background:"transparent",
color:"#08111F",
},

};


return (

<button
{...props}
style={{
padding:"12px 24px",
borderRadius:"999px",
border:"none",
fontWeight:600,
cursor:"pointer",
...variants[variant],
...style,
}}
>

{children}

</button>

);

}
