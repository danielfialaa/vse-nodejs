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
const redis = require("redis");
let redisClient;

if(process.env.REDIS_URL){
	console.log('Running on Heroku redis...');
	redisClient = redis.createClient(process.env.REDIS_URL);
}else{
	console.log('No env.REDIS_URL, redis on local');
	redisClient = redis.createClient(process.env.REDIS_URL);
}

redisClient.on('error', (err) => {
	console.log(err);
	process.exit(1);
});


const initPassport = require('./passport-config');
initPassport(passport, getUserByName, getUserById);


const PORT = process.env.PORT || 8000;
server.listen(PORT);

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
    // if(rooms.indexOf(req.params.id) > -1){
    //     res.render('chatroom.ejs', { room : req.params.id });
    //     return;
    // }
		// return res.status(404).send('Room doesn´t exists');
		redisClient.smembers('rooms', (err, rooms) => {
			if(rooms.indexOf(req.params.id) > -1){
        res.render('chatroom.ejs', { room : req.params.id });
        return;
			}
			return res.status(404).send('Room doesn´t exists');
		});
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
				// socket.username = users.find(user => user.id === socket.handshake.session.passport.user).name;
				socket.username = socket.handshake.session.passport.user.split(':')[1];
        socket.join(room, e => {
          socket.to(room).broadcast.emit("joined", socket.username);
          console.log(socket.username + " joined room " + room);
        });
    });
    socket.on("typing", (room, typing) => {
			let typingKey = 'typing:' + room;
			redisClient.expire(typingKey, 5);
			if(typing){
				redisClient.sadd(typingKey, socket.username);
			}else{
				redisClient.srem(typingKey, socket.username);
			}
			redisClient.smembers(typingKey, (err, obj) => {
				socket.to(room).broadcast.emit("users-typing", obj);
			});
    });
});

let users = [];
app.get('/rooms-list', checkAuth, (req,res) =>{
		// return res.send(rooms);
		redisClient.smembers('rooms', (err, obj) => {
			return res.send(obj);
		});
});
app.post('/create-new-room', checkAuth, (req,res) => {
		// rooms.push(req.body.room);
		redisClient.sadd('rooms', req.body.room);
    io.sockets.emit('room-updated');
    return res.send({
      status: 'success'
    });
});
app.post('/register', checkNotAuth, async (req,res) => {
    try{
        const hashedPassword = await bcrypt.hash(req.body.password, 5);
				redisClient.hmset('user:' + req.body.name, 
						['name', req.body.name, 'password', hashedPassword],
						(err, reply) => {
							if(err){
								return res.redirect('/register');
							}else{
								return res.redirect('/login');
							}
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

async function getUserByName(name, callback){
	let id = 'user:' + name;
	getUserById(id, callback);
}

async function getUserById(id, callback){
	await redisClient.hgetall(id, (err, obj) => {
		if(!obj) return callback(null);
		obj.id = id;
		return callback(obj);
	});
}