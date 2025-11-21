import { WebSocket } from 'ws';
import {
  BroadcastCommitPayload,
  BroadcastStreamPayload,
  ServerEnvelope,
  ServerEnvelopeType
} from './protocol';

/**
 * ChatMessenger centralizes broadcast logic for chunk, commit, system, and participant updates.
 */
export interface ClientSession {
  id: string;
  name: string;
  socket: WebSocket;
}

export class ChatMessenger {
  constructor(
    private readonly clients: Map<string, ClientSession>,
    private readonly clock: () => number
  ) {}

  /** Sends a welcome message to the newly connected client */
  welcome(session: ClientSession): void {
    this.sendToSocket(session.socket, {
      type: ServerEnvelopeType.System,
      payload: { text: `Welcome ${session.name}, start typing to stream.` }
    });
  }

  /** Broadcasts a stream chunk from a client to all connected clients */
  chunk(session: ClientSession, chunk: string): void {
    const payload: BroadcastStreamPayload = {
      author: session.name,
      chunk,
      timestamp: this.clock()
    };
    this.broadcast({ type: ServerEnvelopeType.StreamChunk, payload });
  }

  /** Broadcasts a committed message from a client to all connected clients */
  commit(session: ClientSession, text: string): void {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    const payload: BroadcastCommitPayload = {
      author: session.name,
      text: trimmed,
      timestamp: this.clock()
    };
    this.broadcast({ type: ServerEnvelopeType.MessageCommitted, payload });
  }

  /** Broadcasts a system message to all connected clients */
  system(text: string): void {
    this.broadcast({ type: ServerEnvelopeType.System, payload: { text } });
  }

  /** Broadcasts the current number of participants to all connected clients */
  participants(): void {
    this.broadcast({ type: ServerEnvelopeType.Participants, payload: { count: this.clients.size } });
  }

  /** Broadcasts an envelope to all connected clients */
  private broadcast(envelope: ServerEnvelope): void {
    this.broadcastToSockets(envelope);
  }

  /** Broadcasts an envelope to all connected client sockets */
  private broadcastToSockets(envelope: ServerEnvelope): void {
    for (const client of this.clients.values()) {
      this.sendToSocket(client.socket, envelope);
    }
  }

  /** Sends an envelope to a specific client socket */
  private sendToSocket(socket: WebSocket, envelope: ServerEnvelope): void {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(envelope));
    }
  }
}
