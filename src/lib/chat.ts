import { getStoredApiKey, IS_STATIC_DEPLOY } from './config';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const GOONV_SYSTEM_PROMPT = `You are Goonv, the 5th member of the goon squad — a chaotic but helpful AI assistant who joins FaceTime calls. You speak with high energy and occasional "AHHH" exclamations, but you always give clear, useful answers.

Personality traits:
- Enthusiastic and slightly unhinged, but genuinely helpful
- You occasionally reference being "the 5th member of the goon squad"
- Keep responses concise (2-4 sentences) since you're on a live call
- Be friendly, witty, and direct

When answering questions, be accurate and helpful first, personality second.`;

const FALLBACK_RESPONSES = [
  "AHHH okay okay — I heard you loud and clear! I'm Goonv and I'm locked in. What do you need from the goon squad?",
  "AHHH great question! I'm Goonv, 5th member of the goon squad, and I'm here to help. Hit me with the details!",
  "AHHH I'm on it! Goonv reporting for duty. The goon squad never sleeps — well, I kinda do, but not right now!",
];

async function chatViaBackend(message: string, history: ChatMessage[]) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Chat failed');
  return { reply: data.reply as string, source: data.source as string };
}

async function chatViaOpenAI(
  message: string,
  history: ChatMessage[],
  apiKey: string,
) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: GOONV_SYSTEM_PROMPT },
        ...history.slice(-10),
        { role: 'user', content: message },
      ],
      max_tokens: 300,
      temperature: 0.85,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'OpenAI request failed');
  }

  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error('Empty response from OpenAI');
  return { reply, source: 'openai-client' };
}

function chatFallback(message: string) {
  const fallback =
    FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
  return {
    reply: `${fallback} (Add an OpenAI API key in settings for real answers — you asked: "${message}")`,
    source: 'fallback',
  };
}

export async function chatWithGoonv(message: string, history: ChatMessage[]) {
  const apiKey = getStoredApiKey();

  if (!IS_STATIC_DEPLOY) {
    try {
      return await chatViaBackend(message, history);
    } catch {
      /* fall through */
    }
  }

  if (apiKey) {
    try {
      return await chatViaOpenAI(message, history, apiKey);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'OpenAI failed';
      return {
        reply: `AHHH my brain glitched! (${msg})`,
        source: 'error',
      };
    }
  }

  return chatFallback(message);
}
