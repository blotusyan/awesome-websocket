import { IncomingMessage, ServerResponse } from 'http';
import { resolve } from 'path';
import { renderNotFound, resolveAssetPath, streamFile } from './fileUtils';

export class StaticFileServer {
  private readonly publicDir: string;

  constructor(publicDir: string) {
    this.publicDir = resolve(publicDir);
  }

  /**
   * Handles an incoming HTTP request and responds with the requested asset.
   */
  handle(req: IncomingMessage, res: ServerResponse): void {
    if (req.method !== 'GET') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    /** If the request somehow lacks a URL, we treat it as the root path / */
    console.log(`Serving request for ${req.url ?? '/'}`);
    const assetPath = resolveAssetPath(this.publicDir, req.url ?? '/');
    if (!assetPath) {
      renderNotFound(res);
      return;
    }

    /** stream the static server file index.html */
    streamFile(assetPath, res);
  }
}
