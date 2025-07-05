const express = require("express");
const http = require("http");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

let promptList = [];

io.on("connection", (socket) => {
  console.log("WebSocket: client connected");

  socket.emit("init_prompt_list", promptList);
});

app.post("/broadcast", (req, res) => {
  const prompt = req.body;
  console.log("📥 Received from Rails:", prompt); // ✅ Add this
  promptList.unshift(prompt);
  io.emit("new_prompt", prompt);
  console.log("📤 Emitted new_prompt to all clients"); // ✅ Add this
  res.sendStatus(200);
});

server.listen(4000, () => {
  console.log("✅ WebSocket Server listening on http://localhost:4000");
});
