import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { Server } from "socket.io";

import authRoute from "./routes/auth.route.js";
import postRoute from "./routes/post.route.js";
import testRoute from "./routes/test.route.js";
import userRoute from "./routes/user.route.js";
import chatRoute from "./routes/chat.route.js";
import messageRoute from "./routes/message.route.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());


app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);
app.use("/api/test", testRoute);
app.use("/api/chats", chatRoute);
app.use("/api/messages", messageRoute);

const server = app.listen(8800, () => {
  console.log("server is running!");
});

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

let onlineUsers = [];

// Add new user safely
const addUser = (userId, socketId) => {
  if (!userId || !socketId) {
    console.warn("addUser called with invalid parameters.");
    return;
  }
  const userExists = onlineUsers.find((user) => user.userId === userId);
  if (!userExists) {
    onlineUsers.push({ userId, socketId });
    console.log("Current online users:", onlineUsers);
  }
};

// Remove user by socketId
const removeUser = (socketId) => {
  if (!socketId) return;
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
};

// Get user by userId
const getUser = (userId) => {
  if (!userId) return null;
  return onlineUsers.find((user) => user.userId === userId);
};

// Socket connection handling
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Handle new user
  socket.on("newUser", (userId) => {
    if (!userId) {
      console.warn(`Client ${socket.id} tried to register without a userId.`);
      return;
    }
    addUser(userId, socket.id);
  });

  // Handle sending message
  socket.on("sendMessage", ({ receiverId, data }) => {
    if (!receiverId) {
      console.warn(`Client ${socket.id} tried to send a message without a receiverId.`);
      return;
    }
    if (!data) {
      console.warn(`Client ${socket.id} tried to send an empty message to ${receiverId}.`);
      return;
    }

    const receiver = getUser(receiverId);
    if (receiver) {
      io.to(receiver.socketId).emit("getMessage", data);
      console.log(`Message sent to ${receiver.socketId}`);
    } else {
      console.log(`User with ID ${receiverId} is not online.`);
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    removeUser(socket.id);
  });
});
