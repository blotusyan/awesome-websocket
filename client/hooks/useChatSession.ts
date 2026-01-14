import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ClientEnvelopeType,
  ConnectionState,
  ServerEnvelopeType,
  type ClientEnvelope,
  type DraftMap,
  type MessageEntry,
  type ServerEnvelope
} from '../types';
import { applyDraft, createMessageEntry, createSystemEntry } from '../utils/messages';
import { parseServerEnvelope } from '../utils/envelopes';
import { resolveSocketUrl } from '../utils/network';

export function useChatSession(displayName: string) {
  const [status, setStatus] = useState<ConnectionState>(ConnectionState.Connecting);
  const [participants, setParticipants] = useState(0);
  const [messages, setMessages] = useState<MessageEntry[]>([]);
  const [drafts, setDrafts] = useState<DraftMap>({});
  const socketRef = useRef<WebSocket | null>(null);

  console.log(socketRef.current)

  const handleEnvelope = useCallback((envelope: ServerEnvelope) => {
    switch (envelope.type) {
      case ServerEnvelopeType.System:
        setMessages((currentMessages) => [...currentMessages, createSystemEntry(envelope.payload.text)]);
        break;
      case ServerEnvelopeType.StreamChunk:
        /**
         * In this app, sendChunk sends the full current draft on each change, 
         * so the server broadcasts the latest full draft and the client overwrites the previous value.
         */
        setDrafts((currentDrafts) => applyDraft(currentDrafts, envelope.payload.author, envelope.payload.chunk));
        break;
      case ServerEnvelopeType.MessageCommitted:
        /** create message entry with author, kind, text and timestamp fields */
        setMessages((currentMessages) => [...currentMessages, createMessageEntry(envelope.payload)]);
        setDrafts((currentDrafts) => applyDraft(currentDrafts, envelope.payload.author, ''));
        break;
      case ServerEnvelopeType.Participants:
        setParticipants(envelope.payload.count);
        break;
    }
  }, []);

  useEffect(() => { // return null or function
    const socket = new WebSocket(resolveSocketUrl());
    socketRef.current = socket;

    const goOffline = () => setStatus(ConnectionState.Offline);

    socket.addEventListener('open', () => setStatus(ConnectionState.Online));
    socket.addEventListener('close', goOffline);
    socket.addEventListener('error', goOffline);
    /**
     * server envelop is a combination of multi types
     * export type ServerEnvelope =
       | SystemEnvelope
       | BroadcastChunkEnvelope
       | BroadcastCommitEnvelope
       | ParticipantsEnvelope;
     */
    socket.addEventListener('message', (event) => {
      const envelope = parseServerEnvelope(event.data);
      if (envelope) {
        handleEnvelope(envelope);
      }
    });

    /**
     * cleanup function calls socket.close() so the connection is terminated,
     * when the component unmounts or when handleEnvelope changes and the effect re-runs.
     * 
     * run setup code now, register cleanup for “next time.”
     */
    return () => {
      socket.close();
    };
  }, [handleEnvelope]);

  const send = useCallback((envelope: ClientEnvelope) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }
    socket.send(JSON.stringify(envelope));
  }, []);

  useEffect(() => {
    if (status !== ConnectionState.Online) {
      return;
    }
    send({ type: ClientEnvelopeType.Join, payload: { name: displayName } });
  }, [displayName, send, status]); // currently displayName is part of the dependency

  const sendChunk = useCallback(
    (chunk: string) => {
      send({ type: ClientEnvelopeType.StreamChunk, payload: { chunk } });
    },
    [send]
  );

  const commitMessage = useCallback(
    (text: string) => {
      send({ type: ClientEnvelopeType.CommitMessage, payload: { text } });
    },
    [send]
  );

  return { status, participants, messages, drafts, sendChunk, commitMessage };
}
