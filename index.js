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

const roomUsers = {};

io.on('connection', (socket) => {
    console.log("user connected");

    socket.on('join room', (data) => {
        const { username, room } = data;

        // Leave the current room before joining a new one
        if (socket.room) {
            socket.leave(socket.room);
        }

        socket.join(room);
        socket.username = username;
        socket.room = room;

        if (!roomUsers[room]) {
            roomUsers[room] = [];
        }

        roomUsers[room].push(username);

        io.to(room).emit('update user list', roomUsers[room]);
        socket.to(room).emit('chat message', `${username} has joined the room`);
    });

    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        if (socket.room && roomUsers[socket.room]) {
            roomUsers[socket.room] = roomUsers[socket.room].filter(user => user !== socket.username);
            io.to(socket.room).emit('chat message', `${socket.username} has left the room`);
        }
        console.log('user disconnected');
    });
});

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/room', (req, res) => {
    var room = req.body.uroom;
    var username = req.body.uname;
    io.emit('join room', { username, room });
    res.redirect(`/room?username=${username}&room=${room}`);
});

app.get('/room', (req, res) => {
    var username = req.query.username;
    var room = req.query.room;
    res.render('room', { username, room });
});

app.get('/logout', (req, res) => {
    res.redirect('/');
});

server.listen(PORT, function () {
    console.log(`listening on ${PORT}`);
});
