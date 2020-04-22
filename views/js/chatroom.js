const msgForm = document.getElementById("send-msg-container");
const msgInput = document.getElementById("msg-input");
const socket = io("http://localhost:8000");
const room = window.location.pathname.split("/")[2];

socket.emit("join", room);

socket.on("chat-message", (msg, from) => {
  appendMsg(msg, from, true);
});

socket.on("joined", (user) => {
  appendMsg(user + " has joined a room!", "Info", true);
});

socket.on("users-typing", typing => {
  console.log(typing);
  showTyping(typing);
});

msgForm.addEventListener("submit", e => {
  e.preventDefault();
  let msgInput = document.getElementById("msg-input");
  console.log(msgInput.value);
  socket.emit("send-chat-message", msgInput.value, room);
  // socket.emit("typing", room, false);
  appendMsg(msgInput.value, 'You', false);
  msgInput.value = "";
});

function appendMsg(msg, from, received) {
  const msgContainer = document.getElementById("msg-container");
  const msgEl = document.createElement("div");
  msgEl.classList.add("container");
  if (!received) {
    msgEl.classList.add("darker");
  }
  msgEl.innerText = from + ': ' + msg;
  msgContainer.append(msgEl);
  msgContainer.scrollTop = msgContainer.scrollHeight;
}

msgInput.addEventListener("keyup", e => {
  const isTyping = e.target.value.length > 0 ? true : false;
  socket.emit("typing", room, isTyping);
});

function showTyping(typing) {
  const typingUsers = document.getElementById("typing-users");
  if (typing.length === 0) {
    typingUsers.style.visibility = "hidden";
  } else {
    typingUsers.style.visibility = "visible";
    typingUsers.style.fontSize = "8px";
    typingUsers.style.color = "grey";
    typingUsers.innerText =
      typing.toString() + (typing.length > 1 ? " are " : " is ") + "typing";
  }
}
