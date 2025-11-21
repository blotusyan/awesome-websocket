import { randomUUID } from 'crypto';
import { WebSocket } from 'ws';
import { ClientEnvelope, ClientEnvelopeType } from './protocol';
import { ChatMessenger, ClientSession } from './ChatMessenger';

export class ChatRoom {
  private readonly clients = new Map<string, ClientSession>();
  private guestCounter = 1;
  private readonly messenger: ChatMessenger;

  constructor(private readonly clock: () => number) {
    this.messenger = new ChatMessenger(this.clients, this.clock);
  }

  register(socket: WebSocket): ClientSession {
    const session: ClientSession = {
      id: randomUUID(),
      name: this.createGuestName(),
      socket
    };
    this.clients.set(session.id, session);
    this.messenger.welcome(session);
    this.messenger.participants();
    return session;
  }

  remove(clientId: string): void {
    const session = this.clients.get(clientId);
    if (!session) {
      return;
    }
    this.clients.delete(clientId);
    this.messenger.system(`${session.name} left the chat.`);
    this.messenger.participants();
  }

  handle(clientId: string, envelope: ClientEnvelope): void {
    const session = this.clients.get(clientId);
    if (!session) {
      return;
    }

    switch (envelope.type) {
      case ClientEnvelopeType.Join:
        this.rename(session, envelope.payload.name);
        break;
      case ClientEnvelopeType.StreamChunk:
        this.messenger.chunk(session, envelope.payload.chunk);
        break;
      case ClientEnvelopeType.CommitMessage:
        this.messenger.commit(session, envelope.payload.text);
        break;
    }
  }

  private rename(session: ClientSession, requestedName: string): void {
    const trimmed = requestedName.trim();
    if (!trimmed || session.name === trimmed) {
      return;
    }
    session.name = trimmed;
    this.messenger.system(`${session.name} is now chatting.`);
    this.messenger.participants();
  }

  private createGuestName(): string {
    const suffix = this.guestCounter.toString().padStart(2, '0');
    this.guestCounter += 1;
    return `Guest-${suffix}`;
  }
}
