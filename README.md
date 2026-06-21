# Goonv

<p align="center">
  <img src="docs/banner.svg" alt="Goonv — AI assistant for FaceTime calls" width="100%" />
</p>

<p align="center">
  <strong>The 5th member of the goon squad.</strong><br />
  An AI voice assistant that joins your FaceTime calls and answers when you say <strong>"Hey Gooner"</strong>.
</p>

<p align="center">
  <a href="https://aarushkandukoori.github.io/GOONV/"><img src="https://img.shields.io/badge/Live_Demo-Goonv-FF5C35?style=for-the-badge&logo=safari&logoColor=white" alt="Live Demo" /></a>
  <a href="https://github.com/aarushkandukoori/GOONV/actions/workflows/deploy.yml"><img src="https://img.shields.io/github/actions/workflow/status/aarushkandukoori/GOONV/deploy.yml?branch=main&style=for-the-badge&label=Deploy" alt="Deploy Status" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-111118?style=for-the-badge" alt="MIT License" /></a>
</p>

<p align="center">
  <a href="https://aarushkandukoori.github.io/GOONV/">Try Goonv now</a>
  ·
  <a href="#quick-start">Run locally</a>
  ·
  <a href="#how-it-works">How it works</a>
</p>

---

## What is Goonv?

**Goonv** is a voice-native AI assistant built for live FaceTime calls. Paste a FaceTime link, summon Goonv, and it introduces itself to the room:

> *"AHHHH, AHHH, im goonv, the 5th member of the goon squad, ready to be of assistant"*

Anyone on the call can say **"Hey Gooner"** followed by a question — Goonv listens and responds out loud.

<table>
  <tr>
    <td align="center" width="33%">
      <h3>01 · Paste link</h3>
      <p>Drop any FaceTime invite URL.<br/>Goonv handles the rest.</p>
    </td>
    <td align="center" width="33%">
      <h3>02 · Auto intro</h3>
      <p>Goonv announces itself the moment it joins your call.</p>
    </td>
    <td align="center" width="33%">
      <h3>03 · Wake word</h3>
      <p>Say <strong>"Hey Gooner"</strong> anytime.<br/><em>Requires an OpenAI API key.</em></p>
    </td>
  </tr>
</table>

---

## How it works

Apple doesn't publish a public FaceTime bot API. Goonv works around that by automating the same surfaces humans use — or running as a companion on your device.

| Mode | Platform | What happens |
|------|----------|--------------|
| **Web (live demo)** | Any browser | Opens FaceTime link + listens via your mic, speaks via your speakers |
| **macOS native** | Mac + local server | AppleScript opens FaceTime and clicks Join |
| **Browser bot** | Mac/PC + local server | Playwright joins `facetime.apple.com` as participant **"Goonv"** |
| **Companion** | Fallback | Voice assistant runs alongside your call |

> **Note:** Browser FaceTime guests may need to be **admitted** by the call host — same as any web participant.

---

## Quick start

### Use it now (no install)

**[https://aarushkandukoori.github.io/GOONV/](https://aarushkandukoori.github.io/GOONV/)**

1. Open in **Chrome** on desktop
2. Paste a FaceTime link and click **Summon Goonv**
3. Allow microphone access
4. Use **speaker mode** on your call so everyone hears Goonv
5. Add your **OpenAI API key** in settings for real answers

### Run locally (full auto-join)

```bash
git clone https://github.com/aarushkandukoori/GOONV.git
cd GOONV
npm install
npx playwright install chromium   # browser auto-join on non-Mac
cp .env.example .env              # optional: OPENAI_API_KEY
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Environment

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI key for intelligent answers |
| `PORT` | Backend port (default: `3001`) |
| `FACETIME_JOIN_MODE` | `auto` · `macos` · `browser` · `companion` |

---

## macOS permissions

For native auto-join on Mac, grant **Automation** access:

**System Settings → Privacy & Security → Automation**

---

## Tech stack

| Layer | Tools |
|-------|-------|
| Frontend | React · Vite · Web Speech API |
| Backend | Express · OpenAI |
| FaceTime bridge | AppleScript (macOS) · Playwright (Chrome) |
| Hosting | GitHub Pages · GitHub Actions |

---

## Project structure

```
GOONV/
├── src/                  # React app + voice assistant
├── server/               # Express API + FaceTime bridges
├── public/               # Static assets
├── docs/                 # README banner & assets
└── .github/workflows/    # GitHub Pages deploy
```

---

## Contributing

Issues and PRs welcome. Keep the goon squad energy high and the diffs focused.

---

<p align="center">
  <img src="public/goonv-icon.svg" alt="Goonv logo" width="48" />
  <br /><br />
  <strong>Goonv</strong> · goon squad · member #5
  <br />
  <a href="https://aarushkandukoori.github.io/GOONV/">aarushkandukoori.github.io/GOONV</a>
</p>
