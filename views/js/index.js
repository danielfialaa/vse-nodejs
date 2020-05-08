import { api } from "/js/fetchApi.js";
const socket = io(location.host);
const newRoomForm = document.getElementById("new-room-form");

newRoomForm.addEventListener("submit", e => {
  e.preventDefault();
  const newRoomInput = document.getElementById("new-room-input");
  api("create-new-room", "post", { room: newRoomInput.value })
    .then(data => {
      console.log(data);
    })
    .catch(e => {
      console.error(e);
    });
});

function loadRooms() {
  api("rooms-list", "get").then(data => {
    createRoomList(data);
  });
}
loadRooms();

socket.on('room-updated', () => {
    loadRooms();
});

function createRoomList(data) {
  const roomsList = document.getElementById("rooms-list");
  roomsList.innerHTML = null;
  data.forEach(element => {
    const roomLink = document.createElement("a");
    roomLink.href = "room/" + element;
    roomLink.innerHTML = element;
    const roomLinkContainer = document.createElement("li");
    roomLinkContainer.appendChild(roomLink);
    roomsList.appendChild(roomLinkContainer);
  });
}
