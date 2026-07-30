"use client";


export default function PostComposer({
content,
setContent,
submit
}:{
content:string;
setContent:(value:string)=>void;
submit:()=>void;
}){


return (

<section
style={{
marginBottom:"30px"
}}
>


<textarea

value={content}

onChange={
e=>setContent(e.target.value)
}

placeholder="Share something with your neighbours..."

style={{
width:"100%",
height:"120px",
padding:"15px",
borderRadius:"15px"
}}

/>


<button

onClick={submit}

style={{
marginTop:"10px",
padding:"12px 25px",
borderRadius:"20px"
}}

>

Post

</button>


</section>

);

}
