const cors = require("cors");
const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');


const initPassport = require('./passport-config');
initPassport(passport, 
    name => users.find(user => user.name === name),
    id => users.find(user => user.id === id)    
);


server.listen(8000);

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(__dirname + '/views'));
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());


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
            id: Date.now().toString(),
            name: req.body.name,
            password: hashedPassword
        });
        res.redirect('/login');
    }catch{
        res.redirect('/register');
    }
    console.log(users);
});
app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));