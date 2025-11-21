import type { Server } from "socket.io";

class SocketGateway {
  private io?: Server;

  setServer(server: Server): void {
    this.io = server;
  }

  emitToConversation(conversationId: string, event: string, payload: unknown): void {
    this.io?.to(conversationId).emit(event, payload);
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    this.io?.to(userId).emit(event, payload);
  }
}

export const socketGateway = new SocketGateway();
