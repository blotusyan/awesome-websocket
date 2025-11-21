export enum ClientEnvelopeType {
  Join = 'JOIN',
  StreamChunk = 'STREAM_CHUNK',
  CommitMessage = 'COMMIT_MESSAGE'
}

export enum ServerEnvelopeType {
  System = 'SYSTEM',
  StreamChunk = 'STREAM_CHUNK',
  MessageCommitted = 'MESSAGE_COMMITTED',
  Participants = 'PARTICIPANTS'
}

export type ClientEnvelope = JoinEnvelope | StreamChunkEnvelope | CommitEnvelope;

export type ServerEnvelope =
  | SystemEnvelope
  | BroadcastChunkEnvelope
  | BroadcastCommitEnvelope
  | ParticipantsEnvelope;

export interface JoinEnvelope {
  type: ClientEnvelopeType.Join;
  payload: { name: string };
}

export interface StreamChunkEnvelope {
  type: ClientEnvelopeType.StreamChunk;
  payload: { chunk: string };
}

export interface CommitEnvelope {
  type: ClientEnvelopeType.CommitMessage;
  payload: { text: string };
}

export interface SystemEnvelope {
  type: ServerEnvelopeType.System;
  payload: { text: string };
}

export interface BroadcastChunkEnvelope {
  type: ServerEnvelopeType.StreamChunk;
  payload: BroadcastStreamPayload;
}

export interface BroadcastCommitEnvelope {
  type: ServerEnvelopeType.MessageCommitted;
  payload: BroadcastCommitPayload;
}

export interface ParticipantsEnvelope {
  type: ServerEnvelopeType.Participants;
  payload: { count: number };
}

export interface BroadcastStreamPayload {
  author: string;
  chunk: string;
  timestamp: number;
}

export interface BroadcastCommitPayload {
  author: string;
  text: string;
  timestamp: number;
}

export function parseClientEnvelope(raw: string): ClientEnvelope | null {
  const tentative = safeParse(raw);
  if (!tentative || typeof tentative !== 'object' || tentative === null) {
    return null;
  }

  switch ((tentative as { type?: string }).type) {
    case ClientEnvelopeType.Join:
      return validateJoin(tentative) ? tentative : null;
    case ClientEnvelopeType.StreamChunk:
      return validateChunk(tentative) ? tentative : null;
    case ClientEnvelopeType.CommitMessage:
      return validateCommit(tentative) ? tentative : null;
    default:
      return null;
  }
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function validateJoin(value: any): value is JoinEnvelope {
  return (
    value &&
    value.payload &&
    typeof value.payload.name === 'string' &&
    Boolean(value.payload.name.trim())
  );
}

function validateChunk(value: any): value is StreamChunkEnvelope {
  return value && value.payload && typeof value.payload.chunk === 'string';
}

function validateCommit(value: any): value is CommitEnvelope {
  return (
    value &&
    value.payload &&
    typeof value.payload.text === 'string' &&
    Boolean(value.payload.text.trim())
  );
}
