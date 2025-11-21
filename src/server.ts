import type { HttpError } from "http-errors";
import http from "http";
import { Server } from "socket.io";
import type { Socket } from "socket.io";
import { z } from "zod";
import { createApp } from "./app";
import { env } from "./config/env";
import { connectMongo } from "./config/mongo";
import { UserModel } from "./models/User";
import { socketGateway } from "./socket/socketGateway";
import { assertConversationParticipant } from "./services/conversation.service";
import { deleteMessage, sendMessage, updateMessage } from "./services/message.service";
import { verifyToken } from "./utils/jwt";

type SocketAck = (response: { success: boolean; error?: string; [key: string]: unknown }) => void;

const conversationTargetSchema = z.object({
  conversationId: z.string().min(1, "conversationId is required")
});

const socketAttachmentArray = z.array(z.string()).optional();

const messagePayloadSchema = z.object({
  conversationId: z.string().min(1, "conversationId is required"),
  content: z.string().optional(),
  attachments: socketAttachmentArray
});

const messageUpdatePayloadSchema = z.object({
  messageId: z.string().min(1, "messageId is required"),
  content: z.string().optional(),
  attachments: socketAttachmentArray
});

const messageDeletePayloadSchema = z.object({
  messageId: z.string().min(1, "messageId is required")
});

const app = createApp();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true
  }
});

socketGateway.setServer(io);

io.use(async (socket, next) => {
  try {
    const token = extractToken(socket);

    if (!token) {
      next(new Error("AUTH_REQUIRED"));
      return;
    }

    const payload = verifyToken(token);
    const user = await UserModel.findById(payload.sub).select("_id");

    if (!user) {
      next(new Error("AUTH_INVALID"));
      return;
    }

    socket.data = { ...(socket.data as Record<string, unknown>), userId: user.id };
    next();
  } catch (error) {
    console.warn("[socket] authentication failed", error);
    next(new Error("AUTH_INVALID"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.data.userId as string | undefined;

  if (!userId) {
    socket.disconnect(true);
    return;
  }

  socket.join(userId);

  socket.on("conversation:join", async (rawPayload: unknown, ack?: SocketAck) => {
    const reply = buildAck(ack);

    try {
      const { conversationId } = normalizeConversationTarget(rawPayload);
      await assertConversationParticipant(conversationId, userId);
      socket.join(conversationId);
      reply.success();
    } catch (error) {
      console.warn("[socket] join failed", { error, userId });
      reply.error(resolveSocketError(error));
    }
  });

  socket.on("conversation:leave", async (rawPayload: unknown, ack?: SocketAck) => {
    const reply = buildAck(ack);

    try {
      const { conversationId } = normalizeConversationTarget(rawPayload);
      socket.leave(conversationId);
      reply.success();
    } catch (error) {
      reply.error(resolveSocketError(error));
    }
  });

  socket.on("message:send", async (rawPayload: unknown, ack?: SocketAck) => {
    const reply = buildAck(ack);

    try {
      const payload = messagePayloadSchema.parse(rawPayload);

      await assertConversationParticipant(payload.conversationId, userId);
      const message = await sendMessage({
        conversationId: payload.conversationId,
        senderId: userId,
        content: payload.content,
        attachments: payload.attachments
      });

      reply.success({ message });
    } catch (error) {
      console.warn("[socket] message send failed", { error, userId });
      reply.error(resolveSocketError(error));
    }
  });

  socket.on("message:update", async (rawPayload: unknown, ack?: SocketAck) => {
    const reply = buildAck(ack);

    try {
      const payload = messageUpdatePayloadSchema.parse(rawPayload);
      const message = await updateMessage({
        messageId: payload.messageId,
        editorId: userId,
        content: payload.content,
        attachments: payload.attachments
      });
      reply.success({ message });
    } catch (error) {
      console.warn("[socket] message update failed", { error, userId });
      reply.error(resolveSocketError(error));
    }
  });

  socket.on("message:delete", async (rawPayload: unknown, ack?: SocketAck) => {
    const reply = buildAck(ack);

    try {
      const { messageId } = messageDeletePayloadSchema.parse(rawPayload);
      await deleteMessage({ messageId, requesterId: userId });
      reply.success({ messageId });
    } catch (error) {
      console.warn("[socket] message delete failed", { error, userId });
      reply.error(resolveSocketError(error));
    }
  });
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

function extractToken(socket: Socket): string | null {
  const auth = socket.handshake.auth ?? {};
  const tokenFromAuth = typeof auth.token === "string" ? auth.token : undefined;

  if (tokenFromAuth?.startsWith("Bearer ")) {
    return tokenFromAuth.slice("Bearer ".length);
  }

  if (tokenFromAuth) {
    return tokenFromAuth;
  }

  const header = socket.handshake.headers.authorization;
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice("Bearer ".length);
  }

  return null;
}

function normalizeConversationTarget(payload: unknown): { conversationId: string } {
  if (typeof payload === "string") {
    return { conversationId: payload };
  }

  return conversationTargetSchema.parse(payload);
}

function buildAck(ack?: SocketAck) {
  return {
    success(payload: Record<string, unknown> = {}) {
      ack?.({ success: true, ...payload });
    },
    error(message: string) {
      ack?.({ success: false, error: message });
    }
  };
}

function resolveSocketError(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.errors[0]?.message ?? "Invalid payload";
  }

  if (error instanceof Error) {
    if (error.message === "AUTH_REQUIRED" || error.message === "AUTH_INVALID") {
      return "Authentication required";
    }

    const httpError = error as HttpError;
    if (typeof httpError.status === "number") {
      return httpError.message;
    }

    return error.message;
  }

  return "Unexpected error";
}
