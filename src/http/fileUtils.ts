import { ReadStream, createReadStream, existsSync, statSync } from 'fs';
import { ServerResponse } from 'http';
import { extname, join, resolve } from 'path';

export interface ResolvedAsset {
  filePath: string;
}

/**
 * Resolves a request URL to a file path inside the configured public directory.
 */
export function resolveAssetPath(rootDir: string, urlPath: string): string | null {
  const rawPath = urlPath === '/' ? '/index.html' : urlPath;
  const decoded = safeDecode(rawPath);
  const tentative = resolve(join(rootDir, decoded));

  if (!tentative.startsWith(rootDir)) {
    return null;
  }

  if (!existsSync(tentative) || statSync(tentative).isDirectory()) {
    return null;
  }

  return tentative;
}

/**
 * Decodes URL segments without throwing on malformed encodings.
 */
export function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * Streams the resolved file to the HTTP response with proper headers.
 */
export function streamFile(filePath: string, res: ServerResponse): void {
  const stream: ReadStream = createReadStream(filePath);
  res.statusCode = 200;
  res.setHeader('Content-Type', lookupContentType(filePath));
  stream.pipe(res);
  stream.on('error', () => {
    res.statusCode = 500;
    res.end('File read error');
  });
}

/**
 * Maps a file path to the appropriate Content-Type header.
 */
export function lookupContentType(filePath: string): string {
  const ext = extname(filePath);
  switch (ext) {
    case '.html':
      return 'text/html; charset=UTF-8';
    case '.js':
      return 'application/javascript';
    case '.css':
      return 'text/css';
    case '.json':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Writes a 404 response for missing assets.
 */
export function renderNotFound(res: ServerResponse): void {
  res.statusCode = 404;
  res.end('Not Found');
}
