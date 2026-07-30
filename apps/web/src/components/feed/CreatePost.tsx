"use client";


export default function CreatePost({
content,
setContent,
submit
}:any){


return (

<section
style={{
margin:"30px 0"
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
minHeight:"120px",
borderRadius:"15px",
padding:"15px"
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

)

}
