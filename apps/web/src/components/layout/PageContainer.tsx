import React from "react";


export default function PageContainer({
children,
}:{
children:React.ReactNode;
}){


return (

<div
style={{
width:"100%",
maxWidth:"1200px",
margin:"0 auto",
padding:"clamp(16px,3vw,32px)",
}}
>

{children}

</div>

);

}
