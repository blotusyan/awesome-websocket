import { MessageKind, type MessageEntry } from '../types';
import { formatTime } from '../utils/time';

interface ChatLogProps {
  messages: MessageEntry[];
}

export function ChatLog({ messages }: ChatLogProps) {
  return (
    <ul id="messages">
      {messages.map((entry) => (
        <li key={entry.id} className={entry.kind === MessageKind.System ? 'system' : 'message'}>
          {entry.kind === MessageKind.System ? (
            entry.text
          ) : (
            <>
              <strong>{entry.author}</strong> — <span>{formatTime(entry.timestamp)}</span>
              <br />
              {entry.text}
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
