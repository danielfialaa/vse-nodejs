const cors = require("cors");
const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');


server.listen(8000);

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(__dirname + '/views'));
app.use(express.urlencoded({ extended: false }));

app.get("/", (req,res) => {
    res.render('index.ejs');
});
app.get("/room/:id", (req,res) => {
    if(rooms.indexOf(req.params.id) > -1){
        res.render('chatroom.ejs', { room : req.params.id });
        return;
    }
    return res.status(404).send('Room doesn´t exists');
});
app.get("/register", (req,res) => {
    res.render('register.ejs');
});
app.get("/login", (req,res) => {
    res.render('login.ejs');
});

io.on("connection", (socket) => {
    console.log('Somebody just connected');
    socket.on("send-chat-message", (msg, room) => {
        socket.to(room).broadcast.emit("chat-message", msg);
    });
    socket.on("join", (room) => {
        socket.join(room, e => {
          console.log("Someone joined room " + room);
        });
    });
});

let rooms = ['Room1', 'Room2'];
let users = [];
app.get('/rooms-list', (req,res) =>{
    return res.send(rooms);
});
app.post('/create-new-room', (req,res) => {
    rooms.push(req.body.room);
    io.sockets.emit('room-updated');
    return res.send({
      status: 'success'
    });
});
app.post('/register', async (req,res) => {
    try{
        const hashedPassword = await bcrypt.hash(req.body.password, 5);
        users.push({
            name: req.body.name,
            password: hashedPassword
        });
        res.redirect('/login');
    }catch{
        res.redirect('/register');
    }
    console.log(users);
});