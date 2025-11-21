import type { ServerEnvelope } from '../types';

export function parseServerEnvelope(data: unknown): ServerEnvelope | null {
  if (typeof data !== 'string') {
    return null;
  }
  try {
    return JSON.parse(data) as ServerEnvelope;
  } catch {
    return null;
  }
}
