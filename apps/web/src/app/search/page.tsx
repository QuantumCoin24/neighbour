"use client";

import {
  useState
} from "react";

import {
  search,
  type SearchResult
} from "@neighbour/api-client";


export default function SearchPage(){

  const [query,setQuery] =
    useState("");

  const [results,setResults] =
    useState<SearchResult[]>([]);

  const [loading,setLoading] =
    useState(false);


  async function runSearch(){

    if(!query.trim()) return;


    setLoading(true);


    const data =
      await search(query);


    setResults(data);

    setLoading(false);

  }



  return (

    <main
      style={{
        padding:"40px",
        maxWidth:"900px",
        margin:"auto"
      }}
    >

      <h1>
        Search Neighbour™
      </h1>


      <section
        style={{
          display:"flex",
          gap:"10px",
          marginTop:"20px"
        }}
      >

        <input
          value={query}
          onChange={
            e=>setQuery(e.target.value)
          }
          placeholder="Search people, communities, events..."
          style={{
            flex:1,
            padding:"12px",
            borderRadius:"12px"
          }}
        />


        <button
          onClick={runSearch}
          style={{
            padding:"12px 25px"
          }}
        >
          Search
        </button>


      </section>



      {
        loading ?

        <p>
          Searching...
        </p>

        :

        results.length === 0 ?

        <p style={{marginTop:"30px"}}>
          No results.
        </p>

        :

        results.map(result=>(

          <section
            key={result.id}
            style={{
              marginTop:"15px",
              padding:"20px",
              background:"#fff",
              borderRadius:"20px"
            }}
          >

            <h3>
              {result.category}
            </h3>

            <p>
              {result.query}
            </p>

            <small>
              ID: {result.targetId}
            </small>

          </section>

        ))

      }


    </main>

  );

}
