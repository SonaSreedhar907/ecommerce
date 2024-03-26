const express = require('express')
const http = require('http')
const app = express();
const servers = http.createServer(app);
const {Server} = require("socket.io")
const io = new Server(servers);

// Handle socket connection
io.on('connection', (socket) => {
    socket.on('orderapproved', (data) => {
        console.log('message:',data);
        io.emit("orderapprovedtouser",data)
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Start the server
const PORT = 4000;
servers.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});