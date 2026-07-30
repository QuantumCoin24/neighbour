"use client";

export default function CommunityHeader({
  community
}:{
  community:any;
}) {

  return (
    <section
      style={{
        padding:"30px",
        borderRadius:"20px",
        background:"#f5f7fb",
        marginBottom:"20px"
      }}
    >

      <h1>
        📍 {community.name}
      </h1>

      <p>
        {community.description}
      </p>

      <p>
        👥 {community.memberCount ?? 0} neighbours
      </p>

    </section>
  );
}
