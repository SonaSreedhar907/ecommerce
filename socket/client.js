const express =require("express");
const io = require("socket.io-client");

const app = express();
const port = 4000;

const lid =2;

const socket = io("http://localhost:4000");

socket.on("connect", () => {
  console.log("Connected to Server 2");
  // socket.emit("message", "Hello from client");
});
socket.on("message", (message) => {
  console.log("Received message from Server:", message);
  
});
socket.on("orderapprovedtouser", (data) => {
  if(data=`orderapproved+lid`){
    console.log("order approved successfully");
  }else{
    console.log("order not approved successfully")
  }
});




