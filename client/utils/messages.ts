import { MessageKind, type DraftMap, type MessageEntry } from '../types';

export function createSystemEntry(text: string): MessageEntry {
  return { id: createMessageId(), kind: MessageKind.System, text };
}

export function createMessageEntry(payload: { author: string; text: string; timestamp: number }): MessageEntry {
  return {
    id: createMessageId(),
    kind: MessageKind.Chat,
    author: payload.author,
    text: payload.text,
    timestamp: payload.timestamp
  };
}

/**
 * applyDraft replaces the draft for that author with whatever chunk is. If chunk is empty, it removes the draft entry.
 * In this app, sendChunk sends the full current draft on each change, 
 * so the server broadcasts the latest full draft and the client overwrites the previous value.
 */
export function applyDraft(map: DraftMap, author: string, chunk: string): DraftMap {
  /** Create a shallow copy so that update applies to that copy */
  const next = { ...map };
  if (chunk) {
    next[author] = chunk;
  } else {
    delete next[author];
  }
  return next;
}

function createMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
