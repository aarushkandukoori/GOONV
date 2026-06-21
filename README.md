# Goonv

**Goonv** is the 5th member of the goon squad — an AI assistant that joins your FaceTime calls and answers questions when someone says **"Hey Gooner"**.

## How it works (Koov-style auto-join)

Apple doesn't publish a FaceTime bot API, but products like [Koov](https://www.koovai.com/) join by automating the same surfaces humans use. Goonv does the same:

| Platform | Join method |
|----------|-------------|
| **macOS** | Opens FaceTime and clicks Join via AppleScript (native participant) |
| **Windows / Linux** | Launches Chrome via Playwright, joins `facetime.apple.com` as **"Goonv"** |
| **Fallback** | Companion mode — listens through your browser mic |

After joining, Goonv introduces itself:

> *"AHHHH, AHHH, im goonv, the 5th member of the goon squad, ready to be of assistant"*

Then say **"Hey Gooner"** + your question.

**Note:** Web joins may require the call host to **admit "Goonv"** — same as any browser FaceTime guest.

## Quick start

```bash
npm install
npx playwright install chromium   # for browser auto-join on non-Mac
cp .env.example .env              # optional: OPENAI_API_KEY
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Environment

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI key for intelligent answers (optional) |
| `PORT` | Backend port (default: 3001) |
| `FACETIME_JOIN_MODE` | `auto` (default), `macos`, `browser`, or `companion` |

## macOS permissions

For native auto-join, grant **Automation** access so Goonv can control FaceTime:
System Settings → Privacy & Security → Automation

## Tech

- **Frontend:** React + Vite + Web Speech API
- **Backend:** Express + OpenAI
- **FaceTime bridge:** AppleScript (macOS) + Playwright (browser)
