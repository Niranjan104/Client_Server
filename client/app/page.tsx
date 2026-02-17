"use client";
import {useState} from "react";

export default function Home(){
const [message , setMessage] = useState("");
const getData =  async()=>{
  const res = await fetch("http://localhost:5000/hello");
  const data = await res.text();
  setMessage(data);
};

return(
<div style = {{padding: "40px"}}>
  <h1>Simple clint app</h1>
  <button onClick = {getData}>  Send request</button>
  <p>{message}</p>
  </div>
);
}