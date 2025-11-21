export function formatParticipants(count: number): string {
  if (!Number.isFinite(count) || count <= 0) {
    return 'No explorers online';
  }
  if (count === 1) {
    return '1 explorer online';
  }
  return `${count} explorers online`;
}
