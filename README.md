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

## Infrastructure (AWS CDK)
The `infra/` directory contains an Application Load Balancer + EC2 deployment modeled with AWS CDK (TypeScript). Each stack has a focused responsibility:

- `NetworkingStack` provisions a two-AZ VPC with public (ALB) and private (app) subnets.
- `ServiceStack` creates security groups, an Auto Scaling Group of Docker-capable EC2 instances, and an internet-facing ALB that routes traffic to port `3000` on the instances.

### Deploy Steps
1. Install the CDK toolchain dependencies (run inside `infra/`):
   ```bash
   npm install
   ```
2. Provide a container image that runs `npm install && npm run build && npm start` for this repository. Push the image to ECR and note the URI.
3. Bootstrap your AWS environment (only once per account/region):
   ```bash
   npm run bootstrap
   ```
4. Export the container image URI before deploying:
   ```bash
   export CONTAINER_IMAGE_URI=123456789012.dkr.ecr.us-east-1.amazonaws.com/awesome-websocket:latest
   npm run deploy
   ```
5. The command prints the ALB URL (`LoadBalancerUrl`) you can open in a browser. All WebSocket traffic flows through the ALB to the EC2 instances.

> **Note:** User data automatically logs into ECR and runs the container image; ensure the image exposes port `3000`. Systems Manager access is enabled for debugging without SSH keys.
### Building and Pushing the App Image
You only need to do this when you want to deploy a new build of the chat server.

1. **Create an ECR repository (one-time):**
   ```bash
   aws ecr create-repository --repository-name awesome-websocket
   ```
   Note the URI in the output, e.g. `123456789012.dkr.ecr.us-east-1.amazonaws.com/awesome-websocket`.

2. **Authenticate Docker to ECR:**
   ```bash
   aws ecr get-login-password --region us-east-1 \
     | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
   ```
   Replace the region/account with yours.

3. **Create a Dockerfile (if not present):**
   ```Dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "run", "start"]
   ```

4. **Build the image:**
   ```bash
   docker build -t awesome-websocket .
   ```

5. **Tag it for ECR:**
   ```bash
   docker tag awesome-websocket:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/awesome-websocket:latest
   ```

6. **Push to ECR:**
   ```bash
   docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/awesome-websocket:latest
   ```

7. **Export the URI** before running `npm run deploy` (as shown above).

> **Reminder:** build/tag/push is on demand. Run the Docker commands whenever you change application code and want a new image in ECR. The `userData` script inside the CDK stack handles provisioning on each EC2 instance (installing Docker, logging into ECR, and starting the container), so you only trigger Docker builds when you need a fresh image; every new instance reuses that image automatically.
