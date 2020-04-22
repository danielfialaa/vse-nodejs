const cors = require("cors");
const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const bodyParser = require('body-parser');

server.listen(8000);

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(__dirname + '/views'));

app.get("/", (req,res) => {
    res.render('chatroom.ejs');
});

io.on("connection", (socket) => {
    console.log('Somebody just connected');
    socket.on("send-chat-message", (msg) => {
        socket.broadcast.emit('chat-message', msg);
    });  
});