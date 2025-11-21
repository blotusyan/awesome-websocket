/**
 * ConnectionState tracks whether the browser is connected to the WebSocket chat.
 */
export enum ConnectionState {
  Connecting = 'connecting',
  Online = 'online',
  Offline = 'offline'
}

/**
 * MessageKind differentiates between server system notices and user messages.
 */
export enum MessageKind {
  System = 'system',
  Chat = 'message'
}

/**
 * ClientEnvelopeType represents actions the browser can send to the server.
 */
export enum ClientEnvelopeType {
  Join = 'JOIN',
  StreamChunk = 'STREAM_CHUNK',
  CommitMessage = 'COMMIT_MESSAGE'
}

/**
 * ServerEnvelopeType represents broadcast events sent from the server.
 */
export enum ServerEnvelopeType {
  System = 'SYSTEM',
  StreamChunk = 'STREAM_CHUNK',
  MessageCommitted = 'MESSAGE_COMMITTED',
  Participants = 'PARTICIPANTS'
}

/** Client request to enter the chat room. */
export interface JoinEnvelope {
  type: ClientEnvelopeType.Join;
  payload: { name: string };
}

/** Client request to stream a partial message chunk. */
export interface StreamChunkEnvelope {
  type: ClientEnvelopeType.StreamChunk;
  payload: { chunk: string };
}

/** Client request to finalize a streamed message. */
export interface CommitEnvelope {
  type: ClientEnvelopeType.CommitMessage;
  payload: { text: string };
}

/** typescript union type. */ 
export type ClientEnvelope = JoinEnvelope | StreamChunkEnvelope | CommitEnvelope;

/** Server notification emitted from system events (joins/leaves/etc). */
export interface SystemEnvelope {
  type: ServerEnvelopeType.System;
  payload: { text: string };
}

/** Server broadcast for incremental typing updates. */
export interface BroadcastChunkEnvelope {
  type: ServerEnvelopeType.StreamChunk;
  payload: { author: string; chunk: string; timestamp: number };
}

/** Server broadcast for committed messages. */
export interface BroadcastCommitEnvelope {
  type: ServerEnvelopeType.MessageCommitted;
  payload: { author: string; text: string; timestamp: number };
}

/** Server broadcast showing how many participants are online. */
export interface ParticipantsEnvelope {
  type: ServerEnvelopeType.Participants;
  payload: { count: number };
}

/** typescript union type. */ 
export type ServerEnvelope =
  | SystemEnvelope
  | BroadcastChunkEnvelope
  | BroadcastCommitEnvelope
  | ParticipantsEnvelope;

/** Shape of items rendered inside the ChatLog component. */
export interface MessageEntry {
  id: string;
  kind: MessageKind;
  text: string;
  author?: string;
  timestamp?: number;
}

/** Temporary store of live drafts keyed by author name. */
export type DraftMap = Record<string, string>;
