import express from "express";
import { createServer } from "http";
import cors from "cors";
import { Server } from "socket.io";

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

io.on("connection", (socket) => {
    socket.on("chat message", (message) => {
        const text = message.trim();
        if (!text) return;

        io.emit("chat message", { senderId: socket.id, text });
    });
});

server.listen();
