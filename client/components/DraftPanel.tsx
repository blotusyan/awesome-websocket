import { useMemo } from 'react';
import type { DraftMap } from '../types';

interface DraftPanelProps {
  drafts: DraftMap;
}

export function DraftPanel({ drafts }: DraftPanelProps) {
  /**
   * useMemo caches data, useCallback caches functions, and useEffect manages side effects.
   */
  const entries = useMemo(() => Object.entries(drafts), [drafts]);
  if (!entries.length) {
    return <div id="drafts">No live streams yet.</div>;
  }
  const text = entries.map(([author, chunk]) => `${author}: ${chunk}`).join('\n');
  return <div id="drafts">{text}</div>;
}
