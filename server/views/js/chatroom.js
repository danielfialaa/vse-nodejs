const msgForm = document.getElementById("send-msg-container");
const msgInput = document.getElementById("msg-input");
const socket = io("http://localhost:8000");


socket.on("chat-message", (msg, from) => {
  appendMsg(msg, "Someone", true);
});

msgForm.addEventListener("submit", e => {
  e.preventDefault();
  let msgInput = document.getElementById("msg-input");
  console.log(msgInput.value);
  socket.emit("send-chat-message", msgInput.value);
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
