import { ConnectionState } from '../types';

export function formatStatus(state: ConnectionState): string {
  if (state === ConnectionState.Online) {
    return 'Connected';
  }
  if (state === ConnectionState.Offline) {
    return 'Offline';
  }
  return 'Connecting…';
}
