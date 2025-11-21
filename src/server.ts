import http from 'http';
import path from 'path';
import { ChatGateway } from './chat/ChatGateway';
import { ChatRoom } from './chat/ChatRoom';
import { StaticFileServer } from './http/StaticFileServer';

const staticServer = new StaticFileServer(path.resolve(__dirname, '../public'));
const httpServer = http.createServer((req, res) => staticServer.handle(req, res));
const chatRoom = new ChatRoom(() => Date.now());
new ChatGateway(httpServer, chatRoom);

const PORT = Number(process.env.PORT ?? 3000);
httpServer.listen(PORT, () => {
  console.log(`WebSocket chat ready at http://localhost:${PORT}`);
});

httpServer.on('error', (error) => {
  console.error('Server error', error);
});
