import React from "react";

import {
  shadows,
  colors,
  radius,
} from "../../index";


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
background:colors.background.surface,
borderRadius:radius.lg,
padding:"24px",
boxShadow:shadows.card,
...style,
}}
>

{children}

</div>

);

}
