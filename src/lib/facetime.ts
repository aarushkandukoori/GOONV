import { IS_STATIC_DEPLOY } from './config';

export function isValidFaceTimeLink(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;

  const patterns = [
    /^https?:\/\/facetime\.apple\.com\/join/i,
    /^facetime:\/\//i,
    /^facetime-audio:\/\//i,
    /^https?:\/\/facetime\.cloud\.apple\.com/i,
  ];

  return patterns.some((p) => p.test(trimmed));
}

export function normalizeFaceTimeLink(url: string): string {
  return url.trim();
}

export function openFaceTimeLink(url: string): void {
  window.open(normalizeFaceTimeLink(url), '_blank', 'noopener,noreferrer');
}

export const GOONV_INTRO =
  'AHHHH, AHHH, im goonv, the 5th member of the goon squad, ready to be of assistant';

export const WAKE_PHRASES = [
  'hey gooner',
  'hey gooners',
  'hey goonv',
  'hey goon',
  'a gooner',
  'hey goner',
];

export function containsWakePhrase(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return WAKE_PHRASES.some((phrase) => lower.includes(phrase));
}

export function extractQueryAfterWake(text: string): string {
  const lower = text.toLowerCase();
  for (const phrase of WAKE_PHRASES) {
    const idx = lower.indexOf(phrase);
    if (idx !== -1) {
      const after = text.slice(idx + phrase.length).trim();
      return after.replace(/^[,.\s!?]+/, '').trim();
    }
  }
  return text.trim();
}

export type JoinMethod = 'macos-native' | 'browser' | 'companion';

export interface JoinResult {
  ok: boolean;
  method?: JoinMethod;
  status?: string;
  message?: string;
  needsAdmission?: boolean;
  error?: string;
  fallback?: string;
}

export async function summonGoonvToCall(
  link: string,
  mode?: string,
): Promise<JoinResult> {
  if (IS_STATIC_DEPLOY) {
    openFaceTimeLink(link);
    return {
      ok: true,
      method: 'companion',
      status: 'companion',
      message:
        'FaceTime link opened — Goonv listens through your mic & speaks through your speakers',
      needsAdmission: false,
    };
  }

  try {
    const res = await fetch('/api/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link, mode }),
    });

    const data = await res.json();
    if (!res.ok && !data.fallback) {
      throw new Error(data.error || 'Failed to join FaceTime');
    }
    return data;
  } catch {
    openFaceTimeLink(link);
    return {
      ok: true,
      method: 'companion',
      status: 'companion',
      message: 'FaceTime link opened — using companion mode',
      needsAdmission: false,
    };
  }
}

export async function leaveGoonvFromCall(link: string): Promise<void> {
  if (IS_STATIC_DEPLOY) return;

  await fetch('/api/leave', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ link }),
  }).catch(() => {});
}
