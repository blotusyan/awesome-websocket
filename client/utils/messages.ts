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
