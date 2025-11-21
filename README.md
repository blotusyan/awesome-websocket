# Awesome WebSocket Chat

Educational WebSocket chat that demonstrates how multiple browser tabs can stream text to one another through a TypeScript backend. The project keeps the codebase intentionally small while honoring clean code and single responsibility principles.

## Features
- TypeScript HTTP + WebSocket server (`ws`) with explicit chat, gateway, and static file layers.
- Streaming UX — messages are broadcast while they are typed and finalized when submitted.
- React front end (TypeScript) bundled with esbuild for a minimal-yet-modern client experience.
- Zero-build HTML/CSS shell so the focus stays on real-time messaging concepts.

## Getting Started

```bash
npm install
npm run build        # runs both TypeScript builds (server + browser)
npm run dev          # starts the TypeScript server via ts-node
```

Open two browser tabs pointing to `http://localhost:3000`, pick different display names, and start typing to watch chunks stream between participants.

## TypeScript Tooling

| Script | Description |
| --- | --- |
| `npm run build:server` | Compiles `src/**/*.ts` to `dist/` via `tsc -p tsconfig.json`. |
| `npm run build:client` | Bundles the React/TypeScript client with esbuild into `public/assets/app.js`. |
| `npm run watch:server` | Runs `tsc --watch` for the server build, ideal alongside `npm run dev`. |
| `npm run watch:client` | esbuild watch mode for instant browser bundle rebuilds. |

Both `tsconfig` files are minimal on purpose so you can inspect the emitted JavaScript to understand how TypeScript features compile down.

## Project Layout

```
src/
  server.ts           # wires the HTTP server, static file handler, and chat gateway
  chat/               # chat room, gateway, and protocol definitions
  http/               # zero-dependency static file server
client/               # browser TypeScript entry point
public/               # HTML shell + compiled client script
```

## Clean Code Notes
- The `ChatRoom` class only knows about participants and events, while `ChatGateway` focuses on WebSocket wiring.
- The React client keeps rendering and state isolated: `App` handles UI, while `useChatSession` in `client/App.tsx` owns WebSocket orchestration.
- Every request flows through `StaticFileServer`, keeping HTTP concerns separate from WebSocket logic.

## Client Flow (Mermaid)
```
flowchart TD
    subgraph Components
        App(App)
        Header(ChatHeader)
        Log(ChatLog)
        Drafts(DraftPanel)
        Composer(ChatComposer)
    end

    subgraph Hook_and_State
        Hook(useChatSession)
        SendChunk(sendChunk)
        Commit(commitMessage)
        State{{status\nparticipants\nmessages\ndrafts}}
    end

    App -->|uses| Header
    App -->|uses| Log
    App -->|uses| Drafts
    App -->|uses| Composer

    App -->|invokes| Hook
    Hook -->|returns| State
    Hook -->|returns| SendChunk
    Hook -->|returns| Commit

    Composer -->|on change| SendChunk
    Composer -->|on submit| Commit
    State --> Header
    State --> Log
    State --> Drafts
```

## WebSocket Flow
```
sequenceDiagram
    participant Client as Browser App
    participant StaticServer as HTTP Server
    participant Gateway as ChatGateway
    participant Room as ChatRoom
    Client->>StaticServer: GET / (HTML + JS)
    StaticServer-->>Client: index.html + assets/app.js
    Client->>Gateway: WebSocket connection upgrade
    Gateway->>Room: register(socket)
    Room-->>Client: SYSTEM welcome message
    Client->>Gateway: STREAM_CHUNK envelope
    Gateway->>Room: handle(clientId, envelope)
    Room->>Room: broadcast chunk
    Room-->>Client: STREAM_CHUNK broadcast
```

Experiment freely: tweak chunk handling, add persistence, or extend the UI — the abstractions keep changes localized.
