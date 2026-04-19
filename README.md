<div align="center">

# Roast My Idea

### *A dark theatre where your startup meets its critics.*

Five personas — The Professor, The Audience, The Rival CEO, The Journalist, and Your Mother — take turns roasting your startup idea. Then the curtain falls, and a final **Redemption Arc** offers three genuine pieces of advice.

[![Live Demo](https://img.shields.io/badge/demo-live-E8B34C?style=for-the-badge&logo=render&logoColor=black)](https://roast-my-idea.onrender.com)
[![Tech](https://img.shields.io/badge/stack-React%20%7C%20Flask%20%7C%20Gemini-6B1A1A?style=for-the-badge)](#-tech-stack)
[![License](https://img.shields.io/badge/license-MIT-1A120C?style=for-the-badge)](#-license)

[**→ Raise the curtain**](https://roast-my-idea.onrender.com)

</div>

---

## The concept

A full-stack web app that transforms any startup idea into a five-act theatrical roast. Each act is written live by an LLM playing a distinct critic; the show ends with a gold-framed Redemption card where the same AI drops the mask and gives real mentorship.

Built as a solo weekend project to explore sequential LLM orchestration, theatrical UI design, and zero-cost production deployment.

The app automatically detects the language of the submitted idea and replies in kind — write your pitch in English, Italian, French, or Spanish, and the roasts come back in the same tongue.

<div align="center">

> *A pitch deck and a late-night roast show, rehearsed in a Broadway theatre at midnight.*

</div>

---

## Features

- **Five sequential AI critics**, each with a distinct voice, subtitle, and roast intensity, called one after the other (not in parallel) for a dramatic stage-by-stage reveal
- **Velvet-curtain intro** — the landing page opens with animated red velvet curtains and a theatre pelmet sliding in from above
- **Character-by-character typewriter** at 28ms per glyph, with an amber blinking cursor
- **Act / Scene numbering** in Roman numerals, replacing the usual "card 1 of 5" dashboard aesthetic with something that reads like a real playbill
- **Automatic language matching** — the idea is the source of truth, the response follows
- **Redemption Arc** — a double-bordered gold finale card where the tone pivots entirely and the AI becomes a constructive mentor
- **Progressive reveal** — while one act is typing, the next card pulses *"enters the stage"* in italics
- **Localization-agnostic prompts** — UI and prompts are centralized in a single component

---

## Tech Stack

<table>
<tr>
<td valign="top"><strong>Frontend</strong></td>
<td>

- **React 18** with hooks (`useState`, `useEffect`)
- **Vite 5** — dev server and production build
- **Pure CSS** — no UI libraries, custom animations, CSS variables
- **Libre Caslon Display / Text** — editorial serif typography for titles and body
- **JetBrains Mono** — monospaced labels and meta

</td>
</tr>
<tr>
<td valign="top"><strong>Backend</strong></td>
<td>

- **Flask 3** — minimal REST API proxy
- **Flask-CORS** — scoped origin whitelist in production
- **google-genai SDK** — Gemini 2.5 Flash as the LLM
- **python-dotenv** — local environment management
- **Gunicorn** — production WSGI server

</td>
</tr>
<tr>
<td valign="top"><strong>Infra</strong></td>
<td>

- **Render** — Static Site (frontend) + Web Service (backend)
- **Google Cloud** — billing-attached project for Gemini API
- **GitHub** — CI/CD via auto-deploy on push to `main`

</td>
</tr>
</table>

---

## Architecture

```
┌─────────────────┐      HTTPS      ┌──────────────────┐     HTTPS    ┌───────────────┐
│                 │  ─────────────> │                  │ ───────────> │               │
│  React / Vite   │                 │  Flask Proxy     │              │  Gemini API   │
│  (Static Site)  │                 │  (Web Service)   │              │  (2.5 Flash)  │
│                 │  <───────────── │                  │ <─────────── │               │
└─────────────────┘     JSON        └──────────────────┘    JSON      └───────────────┘
     Render                              Render                           Google
```

**Why a backend proxy?** The Gemini API key is a secret and must never be shipped to the browser. The Flask service holds the key, validates incoming requests, enforces CORS, and forwards prompts upstream. The frontend never sees the key, and swapping LLM providers is a backend-only change — the frontend speaks a provider-agnostic JSON format.

**Why sequential API calls?** Each roast is awaited before the next starts. Parallel fetches would complete in the same total time but arrive all at once, killing the theatrical pacing. Sequencing is the show.

---

## Demo

<div align="center">

<!-- Replace once screenshots are captured:
![Landing with curtains rising](docs/screenshot-curtains.png)
![Sequential roasts](docs/screenshot-acts.gif)
![Redemption arc](docs/screenshot-redemption.png)
-->

*Screenshots coming soon — try the [live demo](https://roast-my-idea.onrender.com) in the meantime.*

</div>

---

## Running locally

### Prerequisites

- Python 3.10+
- Node.js 18+ (LTS)
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey), attached to a Google Cloud project with billing enabled (the free tier caps daily requests too aggressively for real use — the Tier 1 quota is effectively free at this project's scale)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate           # Windows: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:

```env
GEMINI_API_KEY=your-key-here
FRONTEND_ORIGIN=http://localhost:5173
```

Start the server:

```bash
python app.py
```

API is live at `http://localhost:5001`.

### Frontend

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and raise the curtain.

---

## Key engineering decisions

### Frontend-driven sequencing

Orchestration of the five acts lives entirely in the frontend. The React component makes one API call per persona in a `for` loop, awaiting each before starting the next. Two reasons:

1. **Stateless backend** — the Flask proxy stays thin and knows nothing about roaster identities or show structure. Each request is self-contained.
2. **Independent rendering** — each card renders as its roast arrives, with pacing controlled entirely by typewriter timing on the client.

### Prompt engineering

Each persona is a compact, highly specific system instruction — *"tenured professor at Politecnico di Milano failing a thesis defense"*, *"CEO of a rival startup name-dropping tier-1 investors"*, *"Italian mother comparing the founder to successful cousins"*. Precise character briefings beat long generic framings; Gemini reads 50 words of role well, 500 words of context badly.

### Language-detection-by-prompt

Rather than classifying the input language client-side and selecting a localized prompt, every prompt is preceded by a simple instruction: *"Reply in the exact same language as the startup idea given below."* The model handles the detection and translation boundary itself, giving native-quality output in every language Gemini supports (which is effectively all major ones).

### Safety-filter override + retry on truncation

Gemini's default safety filters are calibrated for enterprise assistants and aggressively block mildly sarcastic output. The backend disables them explicitly (`BLOCK_NONE` across all categories) because the roasts, while pointed, are satirical rather than harmful. A retry layer catches empty responses and `MAX_TOKENS` truncations, calling the model a second time before falling back to a graceful in-character message. This single-file resilience pattern keeps the five-act sequence from breaking on a single flaky call.

### Zero-config local-to-prod parity

`python-dotenv` loads from `.env` in local development. In production, Render injects environment variables at runtime — `load_dotenv()` silently no-ops when no `.env` file exists. Same code path, different sources, no conditional branches.

---

## About the build

Built as a solo project by **Giovanni Avino** — Computer Engineering student at Politecnico di Milano, interested in full-stack development, LLM applications, and product-minded engineering.

This app is an experiment in:
- Personality-driven LLM prompting
- Theatrical UI that rejects the generic "AI dashboard" look
- Production-grade deployment on low-cost infrastructure

### Other recent work

- **Denclic** — Flask platform that parses PDF exports from dental-practice management software and generates structured care plans. WhatsApp notifications, UUID-based plan storage, PDF generation via WeasyPrint. Deployed on Render.
- More at [github.com/Giovanniavino](https://github.com/Giovanniavino).

---

## License

MIT — do whatever you want, just don't blame me if your idea actually gets roasted.

---

<div align="center">

*Written by sarcasm — directed by Gemini.*

</div>
