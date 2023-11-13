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

app.set('views', path.join(__dirname, 'views'));

const roomUsers = {};

let uname;
let uroom;

io.on('connection', (socket) => {
    console.log("user connected");

    socket.on('join-room', ({ username, room }) => {
        // Leave the current room before joining a new one
        if (socket.room) {
            socket.leave(socket.room);
        }
        socket.join(room);
        uname = username;
        uroom = room;

        io.to(room).emit('updateUserList', getUsersInRoom(room));
    });

    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        if (socket.room && roomUsers[socket.room]) {
            roomUsers[socket.room] = roomUsers[socket.room].filter(user => user !== socket.uname);
            io.to(socket.room).emit('update-user-list', getUsersInRoom(socket.room));
            io.to(socket.room).emit('chat message', `${socket.uname} has left the room`);
        }
        console.log('user disconnected');
    });
});

function getUsersInRoom(room) {
    const users = io.sockets.adapter.rooms[room];
    return users ? Array.from(users) : [];
}

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/room', (req, res) => {
    const room = req.body.uroom;
    const username = req.body.uname;

    io.to(room).emit('join-room', { username, room });

    uname = username;
    uroom = room;

    res.redirect(`/room?username=${username}&room=${room}`);
});

app.get('/room', (req, res) => {
    const username = req.query.username;
    const room = req.query.room;
    res.render('room', { username, room });
});

app.get('/logout', (req, res) => {
    res.redirect('/');
});

server.listen(PORT, function () {
    console.log(`listening on ${PORT}`);
});
