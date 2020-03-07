import { api } from "/js/fetchApi.js";

const form = document.getElementById("login-form");

form.addEventListener("submit", e => {
  e.preventDefault();
  const data = {
    username: document.getElementById("name").value,
    password: document.getElementById("password").value
  };
});
