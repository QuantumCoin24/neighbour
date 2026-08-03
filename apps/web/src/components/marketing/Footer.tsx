export default function Footer(){

return (

<footer

style={{
padding:"60px 40px",
background:"#0f172a",
color:"#fff"
}}

>


<div

style={{
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",
gap:"40px",
maxWidth:"1200px",
margin:"auto"
}}

>


<div>

<h3>
NEIGHBOUR™
</h3>

<p
style={{
color:"#cbd5e1",
lineHeight:"1.5"
}}
>
Your local community,
connected.
</p>

</div>



<div>

<h4>
Explore
</h4>

<p>Communities</p>
<p>How It Works</p>
<p>Safety</p>

</div>



<div>

<h4>
For Organisations
</h4>

<p>Schools</p>
<p>Councils</p>
<p>Clubs & Charities</p>

</div>



<div>

<h4>
For Businesses
</h4>

<p>Business Profiles</p>
<p>Community Events</p>
<p>Sponsorship</p>

</div>



<div>

<h4>
Company
</h4>

<p>Contact</p>
<p>Privacy</p>
<p>Terms</p>

</div>


</div>



<div

style={{
marginTop:"50px",
paddingTop:"25px",
borderTop:"1px solid #334155",
textAlign:"center",
color:"#94a3b8"
}}

>

© {new Date().getFullYear()} Neighbour™. All rights reserved.

</div>


</footer>

);

}
