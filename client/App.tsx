/**
 * ================================ Motivation for WebSockets ================================
 * WebSockets provide a full-duplex, long-lived connection between browser and server. That means:
 * 
 * The client doesn’t need to poll for updates; the server can push messages instantly whenever anything changes.
 * The same connection is reused for both directions—typing events go up to the server immediately, and broadcasts flow back down with no extra setup.
 * Latency stays low because there’s no HTTP request/response cycle for each chunk; once the WebSocket is open, messages are just lightweight frames.
 * 
 * That continuous, bidirectional channel is what lets the chat stream live typing updates in real time. 
 * Without WebSockets, you’d have to fall back to polling or long-polling, which would be less efficient and less responsive.
 * 
 * ===========================================================================================
 * 
 * 
 * 
 * ================================ Points Of Extension ======================================
 * You could reuse this architecture as the client for an AI streaming endpoint:
 * 
 * WebSocket connection: Instead of human-to-human chat, the browser would open a WebSocket (or Server-Sent Events) connection to an AI service. 
 * Your useChatSession hook would still handle live chunks but the “sender” would be the AI backend streaming tokens as they’re generated.
 * 
 * Chunk handling: Each token (or small text fragment) the AI emits would come through as a STREAM_CHUNK envelope. 
 * The DraftPanel (or a new component) could show the AI’s response as it forms, giving the same live typing effect.
 * 
 * Commit message: Once the AI finishes a response, the backend would send a MESSAGE_COMMITTED envelope, 
 * letting the client move the streamed draft into the chat log—exactly like when a human user hits “Send”.
 * 
 * Server bridging: If you’re proxying an external AI API, your Node server can maintain the WebSocket to the frontend while streaming data 
 * from the AI provider (via fetch streaming or their own WebSocket) and relaying it chunk-by-chunk. So the UI stays the same; 
 * 
 * the AI service effectively becomes another “participant” streaming messages through the existing pipeline,
 * letting webpages display AI responses in real time without polling.
 * ===========================================================================================
 * Server -> Client
 * OnMessage -> SendMessage ---->>>>> AddListener -> SetDraft
 * OnStreamingResponse -> SendStreamingResponse ---->>>>> AddListener -> SetDraft
 */
import { useState } from 'react';
import { ChatComposer } from './components/ChatComposer';
import { ChatHeader } from './components/ChatHeader';
import { ChatLog } from './components/ChatLog';
import { DraftPanel } from './components/DraftPanel';
import { useChatSession } from './hooks/useChatSession';
import { ConnectionState } from './types';
import { createDefaultName } from './utils/names';

export function App() {
  const [displayName, setDisplayName] = useState(createDefaultName());
  const [draft, setDraft] = useState('');
  const { status, participants, messages, drafts, sendChunk, commitMessage } = useChatSession(displayName);
  const canSend = status === ConnectionState.Online;

  /** these two functions are where user typing is sent to server and for later broadcast */
  const handleDraftChange = (value: string) => {
    setDraft(value);
    sendChunk(value);
  };

  const handleSubmit = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }
    commitMessage(trimmed);
    setDraft('');
    sendChunk('');
  };

  /**
   * When a browser tab (client WebSocket) sends a chunk, ChatGateway receives it and hands the parsed envelope to ChatRoom. 
   * ChatRoom then broadcasts that chunk via ChatMessenger, which iterates over every connected socket 
   * (including the original sender) and sends the broadcast message. 
   * So a single client write becomes a server-side broadcast to all websockets.
   * 
   * (user initiate send) App.tsx -> ChatComposer -> hanldeDraftChange -> sendChunk (this is where user types in the chat section
   * gets sent to the server)
   * 
   * This means client code is responsible for both the role of sender(message creator/initiator) and listener(message consumer)
   * 
   * server.ts -> ChatGateway -> WebSocketServer -> register(on-message)(ChatGateway.ts)
   * -> handleMessage(ChatRoom.ts) -> messeager.chunk(ChatRoom.ts) -> socket.send() bare metal
   * 
   * ChatComposer -> handleDraftChange(App.tsx) -> sendDraft() to websocket server (App.tsx) -> -> socket.send() bare metal
   * // BLACK BOX SERVER BROADCAST STUB //
   * WebSocket add listener (useChatSession.ts) -> when message comes -> handleEnvelope (useChatSession.ts)
   * -> setDrafts (useChatSession.ts) -> DraftPanel[draft] (DraftPanel.tsx) -> re-render draft panel
   */
  return (
    <main>
      <ChatHeader participants={participants} status={status} />

      <section className="row">
        <label>
          Display name
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Jane"
            disabled={status === ConnectionState.Connecting}
          />
        </label>
        <label>
          Live drafts
          {/** ChatComposer is different from DraftPanel, ChatComposer is for user input, DraftPanel is for broadcast display */}
          <DraftPanel drafts={drafts} />
        </label>
      </section>

      <section>
        <label>Chat log</label>
        <ChatLog messages={messages} />
      </section>

      {/* That composer is where draft messages are converted to committed messages, ie two sections above */}
      <ChatComposer draft={draft} canSend={canSend} onDraftChange={handleDraftChange} onSubmit={handleSubmit} />
    </main>
  );
}
