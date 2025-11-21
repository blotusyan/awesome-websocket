import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import type { RawData } from 'ws';
import { ChatRoom } from './ChatRoom';
import { ClientSession } from './ChatMessenger';
import { parseClientEnvelope } from './protocol';

export class ChatGateway {
  private readonly wss: WebSocketServer;
  
  /** room is used to register/remove socket and handle envelope */
  constructor(httpServer: Server, private readonly room: ChatRoom) {
    /** Upgrades HTTP connections to WebSocket connections */
    this.wss = new WebSocketServer({ server: httpServer });

    /** Every time a socket connects, register runs */
    this.wss.on('connection', (socket) => this.register(socket));
  }

  /** TODO(weiheng): Decide cleaner code between keeping current style and relocating helper functions */
  private register(socket: WebSocket): void {
    const session: ClientSession = this.room.register(socket);
    socket.on('message', (data) => this.handleMessage(session.id, data));
    socket.on('close', () => this.room.remove(session.id));
    socket.on('error', () => this.room.remove(session.id));
  }

  private handleMessage(clientId: string, data: RawData): void {
    const envelope = parseClientEnvelope(this.toText(data));
    if (!envelope) {
      return;
    }
    this.room.handle(clientId, envelope);
  }

  private toText(data: RawData): string {
    if (typeof data === 'string') {
      return data;
    }
    return data.toString('utf-8');
  }
}
