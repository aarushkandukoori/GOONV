import { useState } from 'react';
import {
  getStoredApiKey,
  IS_STATIC_DEPLOY,
  setStoredApiKey,
} from '../lib/config';

export function ApiKeySettings() {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(() => getStoredApiKey() ?? '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setStoredApiKey(key);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings">
      <button
        type="button"
        className="settings-toggle"
        onClick={() => setOpen(!open)}
      >
        {open ? '▾' : '▸'} OpenAI API key {IS_STATIC_DEPLOY ? '(optional)' : ''}
      </button>

      {open && (
        <div className="settings-panel">
          <p className="settings-desc">
            {IS_STATIC_DEPLOY
              ? 'Stored only in your browser. Powers smarter Goonv answers on the web.'
              : 'Optional — overrides server key for your session only.'}
          </p>
          <input
            type="password"
            className="input"
            placeholder="sk-..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoComplete="off"
          />
          <button type="button" className="btn btn--secondary" onClick={handleSave}>
            {saved ? 'Saved!' : 'Save key'}
          </button>
        </div>
      )}
    </div>
  );
}
