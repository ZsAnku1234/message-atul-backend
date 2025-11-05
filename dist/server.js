"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_1 = require("./app");
const env_1 = require("./config/env");
const mongo_1 = require("./config/mongo");
const message_service_1 = require("./services/message.service");
const app = (0, app_1.createApp)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: env_1.env.clientOrigin ?? "*"
    }
});
io.on("connection", (socket) => {
    socket.on("conversation:join", (conversationId) => {
        socket.join(conversationId);
    });
    socket.on("message:send", async (payload, ack) => {
        try {
            const message = await (0, message_service_1.sendMessage)(payload);
            io.to(payload.conversationId).emit("message:new", message);
            ack?.({ success: true, message });
        }
        catch (error) {
            ack?.({ success: false, error: error instanceof Error ? error.message : "Failed to send message" });
        }
    });
});
const start = async () => {
    await (0, mongo_1.connectMongo)();
    server.listen(env_1.env.port, () => {
        console.log(`API running on port ${env_1.env.port}`);
    });
};
start().catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
});
