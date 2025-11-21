export function formatTime(timestamp?: number): string {
  if (!timestamp) {
    return '';
  }
  return new Date(timestamp).toLocaleTimeString();
}
