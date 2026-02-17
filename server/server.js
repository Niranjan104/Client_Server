const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
console.log("File started");

app.get("/hello", (req,res) => {res.send("Hello from Server")});

app.listen(5000, () => {console.log("server is running on port 5000")});
