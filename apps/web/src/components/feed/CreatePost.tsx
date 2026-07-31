"use client";


export default function CreatePost({
content,
setContent,
submit
}:any){

return (

<section
style={{
background:"#fff",
border:"1px solid #ddd",
borderRadius:"20px",
padding:"20px",
marginBottom:"30px"
}}
>


<textarea

value={content}

onChange={
e=>setContent(e.target.value)
}

placeholder="What's happening in your community?"

style={{
width:"100%",
minHeight:"100px",
borderRadius:"15px",
padding:"15px",
fontSize:"16px",
border:"1px solid #ddd"
}}

/>


<button

onClick={submit}

style={{
marginTop:"15px",
padding:"12px 30px",
borderRadius:"25px",
border:"none",
background:"#111827",
color:"#fff",
cursor:"pointer"
}}

>

Post

</button>


</section>

);

}
