// app.js
const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const directpath = path.join(__dirname, 'public');

app.use(express.static(directpath));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Add this before the io.on('connection') block
const roomUsers = {};

io.on('connection', (socket) => {
    console.log("user connected");

    socket.on('send name', (username1) => {
        io.emit('send name', username1);
    });

    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });

    socket.on('join room', (data) => {
        const { username, room } = data;
        socket.join(room);

        if (!roomUsers[room]) {
            roomUsers[room] = [];
        }

        // Add user to the roomUsers list for the specific room
        roomUsers[room].push(username);

        // Update user list for the specific room
        io.to(room).emit('update user list', roomUsers[room]);

        // Notify others in the room about the new user
        socket.to(room).emit('chat message', `${username} has joined the room`);
    });

    socket.on('disconnect', () => {
        // Remove the user from the roomUsers list when disconnected
        Object.keys(roomUsers).forEach(room => {
            roomUsers[room] = roomUsers[room].filter(user => user !== socket.username);
        });

        // Notify others in the room about the user's disconnection
        socket.to(socket.room).emit('chat message', `${socket.username} has left the room`);

        console.log('user disconnected');
    });
});

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/', (req, res) => {
    var room = req.body.uroom;
    username = req.body.uname;
    res.redirect(`/room?username=${username}&room=${room}`);
});

app.get('/room', (req, res) => {
    var username = req.query.username;
    var room = req.query.room;

    // Set username and room as properties of the socket for later use
    res.render('room', { username, room });
});

app.get('/logout', (req, res) => {
    res.redirect('/');
});

server.listen(PORT, function () {
    console.log(`listening on ${PORT}`);
});
