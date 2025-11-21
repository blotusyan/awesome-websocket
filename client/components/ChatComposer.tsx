import { FormEvent } from 'react';

interface ChatComposerProps {
  draft: string;
  canSend: boolean;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
}

export function ChatComposer({ draft, canSend, onDraftChange, onSubmit }: ChatComposerProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form id="composer" onSubmit={handleSubmit}>
      <label htmlFor="messageInput">Type to stream your message</label>
      <textarea
        id="messageInput"
        placeholder="Stream your thoughts in real-time"
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        disabled={!canSend}
      />
      <button type="submit" disabled={!canSend}>
        Send message
      </button>
    </form>
  );
}
