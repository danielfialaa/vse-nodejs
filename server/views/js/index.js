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
