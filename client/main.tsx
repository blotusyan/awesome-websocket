import { createRoot } from 'react-dom/client';
import { App } from './App';

/**
 * This searches public/index.html for the <div id="root"> placeholder.
 * That’s where the React app should mount.
 */
const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container not found');
}

createRoot(container).render(<App />);
