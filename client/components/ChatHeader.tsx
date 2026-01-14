import { ConnectionState } from '../types';
import { formatParticipants } from '../utils/participants';
import { formatStatus } from '../utils/status';

interface ChatHeaderProps {
  participants: number;
  status: ConnectionState;
}

/**
 * Render the chat header by returning the html dom
 */
export function ChatHeader({ participants, status }: ChatHeaderProps) {
  /**
   * tells the number of explorers
   */
  const participantLabel = formatParticipants(participants);
  /**
   * connected / offline / connecting
   */
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
