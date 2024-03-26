import io from "socket.io-client";
export const socket = io("http://localhost:4000");


socket.on("connect", () => {
  console.log("Connected to Server 1");
  // socket.emit("message", "Hello from client");
});

export function sendSocket(params:any) {
  console.log('params is ',params)
  socket.emit('orderapproved',params)
}