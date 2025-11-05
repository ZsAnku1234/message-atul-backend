import http from "http";
import { Server } from "socket.io";
import { createApp } from "./app";
import { env } from "./config/env";
import { connectMongo } from "./config/mongo";
import { sendMessage } from "./services/message.service";

const app = createApp();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.clientOrigin ?? "*"
  }
});

io.on("connection", (socket) => {
  socket.on("conversation:join", (conversationId: string) => {
    socket.join(conversationId);
  });

  socket.on(
    "message:send",
    async (
      payload: { conversationId: string; senderId: string; content: string; attachments?: string[] },
      ack?: (response: { success: boolean; message?: unknown; error?: string }) => void
    ) => {
      try {
        const message = await sendMessage(payload);
        io.to(payload.conversationId).emit("message:new", message);
        ack?.({ success: true, message });
      } catch (error) {
        ack?.({ success: false, error: error instanceof Error ? error.message : "Failed to send message" });
      }
    }
  );
});

const start = async () => {
  await connectMongo();
  server.listen(env.port, () => {
    console.log(`API running on port ${env.port}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
