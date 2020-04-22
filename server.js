const cors = require("cors");
const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session')({
    secret: 'secret-key',
    resave: true,
    saveUninitialized: true
});
const sharedsession = require("express-socket.io-session");


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
app.use(session);
app.use(passport.initialize());
app.use(passport.session());


app.get("/", checkAuth, (req,res) => {
    res.render('index.ejs');
});
app.get("/room/:id", checkAuth, (req,res) => {
    if(rooms.indexOf(req.params.id) > -1){
        res.render('chatroom.ejs', { room : req.params.id });
        return;
    }
    return res.status(404).send('Room doesn´t exists');
});
app.get("/register", checkNotAuth, (req,res) => {
    res.render('register.ejs');
});
app.get("/login", checkNotAuth, (req,res) => {
    res.render('login.ejs');
});

io.use(sharedsession(session));

io.on("connection", (socket) => {
    console.log('Somebody just connected');
    socket.on("send-chat-message", (msg, room) => {
        socket.to(room).broadcast.emit("chat-message", msg, socket.username);
    });
    socket.on("join", (room) => {
        socket.username = users.find(user => user.id === socket.handshake.session.passport.user).name;
        socket.join(room, e => {
          socket.to(room).broadcast.emit("joined", socket.username);
          console.log(socket.username + " joined room " + room);
        });
    });
    socket.on("typing", (room, typing) => {
        const index = typingUsers.indexOf(socket.username);
        if(typing && index < 0){
            typingUsers.push(socket.username);
        }else if(!typing && index > -1){
            typingUsers.splice(index, 1);
        }
        socket.to(room).broadcast.emit("users-typing", typingUsers);
    });
});

let rooms = ['Room1', 'Room2'];
let users = [];
let typingUsers = [];
app.get('/rooms-list', checkAuth, (req,res) =>{
    return res.send(rooms);
});
app.post('/create-new-room', checkAuth, (req,res) => {
    rooms.push(req.body.room);
    io.sockets.emit('room-updated');
    return res.send({
      status: 'success'
    });
});
app.post('/register', checkNotAuth, async (req,res) => {
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
app.post('/login', checkNotAuth, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));
app.get('/logout', (req, res) => {
    req.logOut();
    return res.redirect('/login');
});
function checkAuth(req, res, next) {
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/login');
}

function checkNotAuth(req, res, next) {
    if(req.isAuthenticated()){
        return res.redirect('/');
    }
    next();
}