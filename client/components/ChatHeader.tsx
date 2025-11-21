import { ConnectionState } from '../types';
import { formatParticipants } from '../utils/participants';
import { formatStatus } from '../utils/status';

interface ChatHeaderProps {
  participants: number;
  status: ConnectionState;
}

export function ChatHeader({ participants, status }: ChatHeaderProps) {
  const participantLabel = formatParticipants(participants);
  const statusText = formatStatus(status);

  return (
    <header>
      <h1>Awesome WebSocket Chat</h1>
      <span id="participants">{participantLabel}</span>
      <span id="status" data-state={status}>
        {statusText}
      </span>
    </header>
  );
}
