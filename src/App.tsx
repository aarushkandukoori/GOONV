import { useState } from 'react';
import { GoonvLogo } from './components/GoonvLogo';
import { useGoonvAssistant } from './hooks/useGoonvAssistant';
import {
  GOONV_INTRO,
  isValidFaceTimeLink,
  leaveGoonvFromCall,
  normalizeFaceTimeLink,
  summonGoonvToCall,
  type JoinMethod,
} from './lib/facetime';
import type { AssistantStatus } from './hooks/useGoonvAssistant';

const STATUS_LABELS: Record<AssistantStatus, string> = {
  idle: 'Standing by',
  joining: 'Joining FaceTime…',
  introducing: 'Goonv is introducing itself…',
  listening: 'Listening for "Hey Gooner"',
  processing: 'Thinking…',
  speaking: 'Goonv is speaking',
  error: 'Something went wrong',
};

const JOIN_METHOD_LABELS: Record<JoinMethod, string> = {
  'macos-native': 'Joined via FaceTime on Mac',
  browser: 'Joined via FaceTime web as "Goonv"',
  companion: 'Companion mode (your mic & speakers)',
};

export default function App() {
  const [link, setLink] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [joinedLink, setJoinedLink] = useState<string | null>(null);
  const [joinMessage, setJoinMessage] = useState<string | null>(null);
  const [joinMethod, setJoinMethod] = useState<JoinMethod | null>(null);
  const [needsAdmission, setNeedsAdmission] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const assistant = useGoonvAssistant();

  const handleSummon = async () => {
    const normalized = normalizeFaceTimeLink(link);

    if (!isValidFaceTimeLink(normalized)) {
      setLinkError('Paste a valid FaceTime link (facetime.apple.com/join or facetime://)');
      return;
    }

    setLinkError(null);
    setIsJoining(true);
    setJoinMessage(null);

    try {
      const result = await summonGoonvToCall(normalized);

      setJoinedLink(normalized);
      setJoinMethod((result.method as JoinMethod) || 'companion');
      setJoinMessage(result.message || 'Goonv is joining…');
      setNeedsAdmission(!!result.needsAdmission);

      setTimeout(async () => {
        await assistant.activate(GOONV_INTRO);
      }, result.method === 'browser' ? 2500 : 1500);
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : 'Failed to summon Goonv');
    } finally {
      setIsJoining(false);
    }
  };

  const handleStop = async () => {
    if (joinedLink) {
      await leaveGoonvFromCall(joinedLink).catch(() => {});
    }
    assistant.deactivate();
    setJoinedLink(null);
    setJoinMessage(null);
    setJoinMethod(null);
    setNeedsAdmission(false);
  };

  const isLive = assistant.isActive || joinedLink !== null;

  return (
    <div className="app">
      <div className="bg-grid" aria-hidden="true" />
      <div className="bg-glow bg-glow--left" aria-hidden="true" />
      <div className="bg-glow bg-glow--right" aria-hidden="true" />

      <header className="header">
        <GoonvLogo size={52} />
        <div>
          <h1 className="title">Goonv</h1>
          <p className="subtitle">5th member of the goon squad · FaceTime AI</p>
        </div>
      </header>

      <main className="main">
        {!isLive ? (
          <section className="card card--hero">
            <div className="hero-logo">
              <GoonvLogo size={140} />
              <div className="hero-ring" />
            </div>

            <h2 className="card-title">Summon Goonv to your call</h2>
            <p className="card-desc">
              Paste a FaceTime link below. Goonv auto-joins the call as a real
              participant (like{' '}
              <a href="https://www.koovai.com/" target="_blank" rel="noopener noreferrer">
                Koov
              </a>
              ) and answers whenever someone says{' '}
              <strong>&ldquo;Hey Gooner&rdquo;</strong>.
            </p>

            <div className="input-group">
              <label htmlFor="facetime-link" className="sr-only">
                FaceTime link
              </label>
              <input
                id="facetime-link"
                type="url"
                className={`input ${linkError ? 'input--error' : ''}`}
                placeholder="https://facetime.apple.com/join#..."
                value={link}
                onChange={(e) => {
                  setLink(e.target.value);
                  setLinkError(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSummon()}
              />
              {linkError && <p className="field-error">{linkError}</p>}
            </div>

            <button
              className="btn btn--primary"
              onClick={handleSummon}
              disabled={!link.trim() || isJoining}
            >
              <span className="btn-icon">▶</span>
              {isJoining ? 'Goonv is joining…' : 'Summon Goonv'}
            </button>

            <p className="hint">
              On Mac, Goonv joins via FaceTime automatically. Elsewhere, it joins through
              Chrome as participant &ldquo;Goonv&rdquo; — admit them when prompted.
            </p>
          </section>
        ) : (
          <section className="card card--live">
            <div className="live-header">
              <GoonvLogo size={72} />
              <div className="live-pulse" data-status={assistant.status} />
            </div>

            <div className="status-badge" data-status={assistant.status}>
              <span className="status-dot" />
              {STATUS_LABELS[assistant.status]}
            </div>

            {joinMethod && (
              <p className="join-method">{JOIN_METHOD_LABELS[joinMethod]}</p>
            )}

            {joinMessage && <p className="join-message">{joinMessage}</p>}

            {needsAdmission && (
              <div className="admission-banner">
                <strong>Admit Goonv</strong> — tap Allow on your iPhone/Mac when
                &ldquo;Goonv&rdquo; requests to join
              </div>
            )}

            {joinedLink && (
              <p className="joined-link">
                Connected to{' '}
                <a href={joinedLink} target="_blank" rel="noopener noreferrer">
                  FaceTime call
                </a>
              </p>
            )}

            {assistant.transcript && (
              <div className="transcript-box">
                <span className="transcript-label">Heard</span>
                <p>{assistant.transcript}</p>
              </div>
            )}

            {assistant.lastResponse && (
              <div className="response-box">
                <span className="response-label">Goonv said</span>
                <p>{assistant.lastResponse}</p>
              </div>
            )}

            {assistant.error && <p className="field-error">{assistant.error}</p>}

            <div className="wake-hint">
              <p>
                Say <strong>&ldquo;Hey Gooner&rdquo;</strong> followed by your question
              </p>
            </div>

            <button className="btn btn--danger" onClick={handleStop}>
              End Goonv session
            </button>
          </section>
        )}

        <section className="features">
          <div className="feature">
            <span className="feature-num">01</span>
            <h3>Paste link</h3>
            <p>Drop any FaceTime invite URL — Goonv handles the rest.</p>
          </div>
          <div className="feature">
            <span className="feature-num">02</span>
            <h3>Auto intro</h3>
            <p>
              Goonv announces itself: &ldquo;AHHHH, AHHH, im goonv, the 5th member of
              the goon squad…&rdquo;
            </p>
          </div>
          <div className="feature">
            <span className="feature-num">03</span>
            <h3>Wake word</h3>
            <p>Say &ldquo;Hey Gooner&rdquo; anytime and Goonv answers your question.</p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>Goonv · goon squad · member #5</p>
      </footer>
    </div>
  );
}
