import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  detectJoinCapabilities,
  joinFaceTime,
  leaveSession,
} from './bridges/facetime.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const activeSessions = new Map();

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

app.use(cors());
app.use(express.json());

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

app.post('/api/chat', async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!openai) {
    const fallback =
      FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
    return res.json({
      reply: `${fallback} (Note: add OPENAI_API_KEY to .env for real AI responses — you asked: "${message}")`,
      source: 'fallback',
    });
  }

  try {
    const messages = [
      { role: 'system', content: GOONV_SYSTEM_PROMPT },
      ...history.slice(-10),
      { role: 'user', content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 300,
      temperature: 0.85,
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    res.json({ reply, source: 'openai' });
  } catch (err) {
    console.error('OpenAI error:', err.message);
    res.status(500).json({
      error: 'Failed to get AI response',
      reply: "AHHH something went wrong in the goon squad HQ! Try asking me again!",
    });
  }
});

app.get('/api/health', async (_req, res) => {
  const joinCapabilities = await detectJoinCapabilities();
  res.json({
    status: 'ok',
    aiEnabled: !!openai,
    name: 'Goonv',
    squad: 'goon squad',
    member: 5,
    joinCapabilities,
    joinMode: process.env.FACETIME_JOIN_MODE || 'auto',
  });
});

app.post('/api/join', async (req, res) => {
  const { link, mode } = req.body;

  if (!link?.trim()) {
    return res.status(400).json({ error: 'FaceTime link is required' });
  }

  try {
    const result = await joinFaceTime(link.trim(), activeSessions, mode);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('Join error:', err.message);
    res.status(500).json({
      ok: false,
      error: err.message,
      fallback: 'companion',
    });
  }
});

app.post('/api/leave', async (req, res) => {
  const { link } = req.body;
  if (!link) {
    return res.status(400).json({ error: 'Link required' });
  }
  const result = await leaveSession(link.trim(), activeSessions);
  res.json(result);
});

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Goonv server running on http://localhost:${PORT}`);
  console.log(`AI: ${openai ? 'enabled' : 'fallback mode (set OPENAI_API_KEY)'}`);
});
