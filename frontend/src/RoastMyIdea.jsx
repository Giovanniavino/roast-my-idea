import React, { useState, useEffect } from "react";

// ---------- CONFIG ----------

const AMBER = "#C89A3C";       // primary warm amber
const INK = "#2B1D0E";          // deep sepia ink
const PAPER = "#F5EBD6";        // aged cream paper
const PAPER_DARK = "#E8D9B9";   // slightly deeper paper for contrast
const ACCENT_RED = "#9B2C22";   // deep theatre red
const TYPING_SPEED = 28;        // ms per char

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

// Language hint prepended to every prompt so Gemini replies in the user's language
const LANG_INSTRUCTION =
  "IMPORTANT: Reply in the exact same language as the startup idea given below. Do not translate. Match the user's language perfectly.\n\n";

const ROASTERS = [
  {
    id: "prof",
    roman: "I",
    name: "The Professor",
    subtitle: "Tenured, pedantic, unimpressed",
    prompt:
      "You are a tenured Computer Science professor at Politecnico di Milano. You've graded thousands of student projects and you've seen every mistake. Roast this startup idea as if you were failing a thesis defense: point out architectural flaws, violated design patterns, scalability problems, naive technology choices. Use academic vocabulary from software engineering. End with a cutting remark about the student clearly not having attended your lectures. Keep it to 4 sentences maximum.",
  },
  {
    id: "audience",
    roman: "II",
    name: "The Audience",
    subtitle: "A regular person at the bar",
    prompt:
      "You are an ordinary, practical person. You don't trust startups and you think most apps are nonsense. Roast this startup idea in a blunt, bar-talk tone, with no tech jargon, like you're complaining to a friend over a beer. Keep it to 4 sentences maximum.",
  },
  {
    id: "rival",
    roman: "III",
    name: "The Rival CEO",
    subtitle: "Already doing it better",
    prompt:
      "You are the CEO of a startup that already does exactly this but better. Roast this idea with veiled arrogance and a smiling sarcasm, name-dropping your superior features and your tier-1 investors. Sound like someone who owns the room. Keep it to 4 sentences maximum.",
  },
  {
    id: "journalist",
    roman: "IV",
    name: "The Journalist",
    subtitle: "Tech blogger chasing clicks",
    prompt:
      "You are a sensationalist tech journalist in the style of Wired. Roast this startup idea with a dramatic, prophetic tone, and find the most clickbait-worthy angle to savage it. Make it sound like a headline waiting to happen. Keep it to 4 sentences maximum.",
  },
  {
    id: "mother",
    roman: "V",
    name: "Your Mother",
    subtitle: "Still hoping you become a doctor",
    prompt:
      "You are the stereotypical warm but disappointed Italian mother. You understand nothing about startups. Reply with warmth but thinly veiled disappointment, compare the founder unfavorably to successful cousins, and ask when they'll get a real job. Keep it to 4 sentences maximum.",
  },
];

const REDEMPTION_PROMPT =
  "Despite all the criticism, now give 3 concrete, genuine pieces of advice to make this startup idea actually work. Be honest but constructive, like a mentor who wants them to succeed. Keep it to 6 sentences maximum.";

// ---------- API ----------

async function callClaude(prompt, idea) {
  const response = await fetch(`${API_URL}/api/roast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content: `${LANG_INSTRUCTION}${prompt}\n\nHere is the startup idea to comment on:\n"${idea}"`,
        },
      ],
    }),
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  const data = await response.json();
  const block =
    (data.content || []).find((b) => b.type === "text") ||
    (data.content || [])[0];
  return ((block && block.text) || "").trim();
}

// ---------- TYPEWRITER ----------

function Typewriter({ text, speed = TYPING_SPEED }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  const done = displayed.length >= (text ? text.length : 0);

  return (
    <span>
      {displayed}
      {!done && <span className="tw-cursor">▎</span>}
    </span>
  );
}

// ---------- CARDS ----------

function RoasterCard({ roaster, index, text, isThinking }) {
  return (
    <article className="roast-card">
      <div className="card-roman">{roaster.roman}</div>
      <div className="card-inner">
        <div className="card-head">
          <div className="card-labels">
            <span className="label-act">Act {roaster.roman}</span>
            <span className="label-sep">·</span>
            <span className="label-scene">Scene {index + 1}</span>
          </div>
          <h3 className="card-name">{roaster.name}</h3>
          <p className="card-subtitle">{roaster.subtitle}</p>
          <div className="card-rule" />
        </div>
        <div className="card-body">
          {isThinking ? (
            <span className="thinking">enters the stage</span>
          ) : (
            <Typewriter text={text} />
          )}
        </div>
      </div>
    </article>
  );
}

function RedemptionCard({ text, isThinking }) {
  return (
    <article className="redemption-card">
      <div className="red-ornament">❦</div>
      <div className="red-labels">Encore</div>
      <h3 className="red-title">The Redemption</h3>
      <p className="red-subtitle">in which the jester finally speaks plainly</p>
      <div className="red-rule" />
      <div className="red-body">
        {isThinking ? (
          <span className="thinking">composing final remarks</span>
        ) : (
          <Typewriter text={text} speed={22} />
        )}
      </div>
      <div className="red-ornament bottom">❦</div>
    </article>
  );
}

// ---------- MAIN ----------

export default function RoastMyIdea() {
  const [phase, setPhase] = useState("landing");
  const [idea, setIdea] = useState("");
  const [roasts, setRoasts] = useState([null, null, null, null, null]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [redemption, setRedemption] = useState(null);
  const [showRedemption, setShowRedemption] = useState(false);
  const [error, setError] = useState(null);
  const [progressLabel, setProgressLabel] = useState("");

  const handleSubmit = async () => {
    if (!idea.trim() || phase === "roasting") return;

    setPhase("roasting");
    setError(null);
    setRoasts([null, null, null, null, null]);
    setRedemption(null);
    setShowRedemption(false);
    setCurrentIndex(0);

    try {
      for (let i = 0; i < ROASTERS.length; i++) {
        setProgressLabel(
          `Act ${ROASTERS[i].roman} · ${ROASTERS[i].name} takes the stage`
        );
        const text = await callClaude(ROASTERS[i].prompt, idea);

        setRoasts((prev) => {
          const next = [...prev];
          next[i] = text;
          return next;
        });

        if (i < ROASTERS.length - 1) {
          setCurrentIndex(i + 1);
        } else {
          setShowRedemption(true);
        }

        await new Promise((r) =>
          setTimeout(r, text.length * TYPING_SPEED + 700)
        );
      }

      setProgressLabel("Composing the encore");
      const red = await callClaude(REDEMPTION_PROMPT, idea);
      setRedemption(red);
      await new Promise((r) => setTimeout(r, red.length * TYPING_SPEED + 700));

      setPhase("done");
      setProgressLabel("");
    } catch (e) {
      console.error(e);
      setError(
        "The curtain fell early. The show will resume in a moment — please try again."
      );
      setPhase("landing");
      setProgressLabel("");
    }
  };

  const handleReset = () => {
    setPhase("landing");
    setIdea("");
    setRoasts([null, null, null, null, null]);
    setCurrentIndex(-1);
    setRedemption(null);
    setShowRedemption(false);
    setError(null);
    setProgressLabel("");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleKey = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Libre+Caslon+Display&family=JetBrains+Mono:ital,wght@0,400;0,500;1,400&display=swap');

        * { box-sizing: border-box; }

        :root {
          --amber: ${AMBER};
          --ink: ${INK};
          --paper: ${PAPER};
          --paper-dark: ${PAPER_DARK};
          --red: ${ACCENT_RED};
        }

        html, body, #root {
          background: var(--paper);
        }

        .stage {
          min-height: 100vh;
          background: var(--paper);
          color: var(--ink);
          position: relative;
          overflow-x: hidden;
          padding: 50px 20px 100px;
          font-family: 'Libre Caslon Text', Georgia, serif;
        }

        /* aged paper texture */
        .stage::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          opacity: 0.28;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch' seed='5'/><feColorMatrix values='0 0 0 0 0.17 0 0 0 0 0.11 0 0 0 0 0.05 0 0 0 0.5 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
          mix-blend-mode: multiply;
        }

        /* vignette / spotlight from above */
        .stage::after {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(ellipse 60% 40% at 50% 0%, rgba(200, 154, 60, 0.22) 0%, transparent 70%),
            radial-gradient(ellipse 120% 80% at 50% 100%, rgba(43, 29, 14, 0.15) 0%, transparent 60%);
        }

        .stage-inner {
          max-width: 720px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }

        /* ------- LANDING ------- */

        .playbill-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .presents {
          font-family: 'Libre Caslon Text', serif;
          font-style: italic;
          font-size: 14px;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: var(--amber);
          margin: 0 0 20px;
          position: relative;
          display: inline-block;
        }
        .presents::before,
        .presents::after {
          content: '—';
          margin: 0 12px;
          opacity: 0.6;
        }

        .main-title {
          font-family: 'Libre Caslon Display', 'Libre Caslon Text', serif;
          font-weight: 400;
          font-size: clamp(3.4rem, 10vw, 6.5rem);
          line-height: 0.95;
          letter-spacing: -0.015em;
          margin: 0;
          color: var(--ink);
          text-shadow: 1px 1px 0 rgba(155, 44, 34, 0.08);
        }
        .main-title .roast { display: block; }
        .main-title .amp {
          display: block;
          font-style: italic;
          font-size: 0.5em;
          color: var(--red);
          margin: 10px 0 8px;
          letter-spacing: 0.04em;
          font-weight: 400;
        }
        .main-title .idea {
          display: block;
          font-style: italic;
          color: var(--amber);
        }

        .title-flourish {
          display: block;
          margin: 28px auto 0;
          width: 70%;
          max-width: 260px;
          height: 1px;
          background: var(--ink);
          position: relative;
          opacity: 0.75;
        }
        .title-flourish::before,
        .title-flourish::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 6px; height: 6px;
          background: var(--ink);
          border-radius: 50%;
          transform: translateY(-50%);
        }
        .title-flourish::before { left: -3px; }
        .title-flourish::after  { right: -3px; }

        .tagline {
          font-family: 'Libre Caslon Text', serif;
          font-style: italic;
          font-size: 1.05rem;
          color: var(--ink);
          margin: 28px 0 42px;
          text-align: center;
          opacity: 0.85;
        }

        .input-block {
          background: var(--paper-dark);
          border: 1px solid rgba(43, 29, 14, 0.35);
          padding: 26px;
          position: relative;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.5) inset,
            0 18px 30px -18px rgba(43, 29, 14, 0.25);
        }
        .input-block::before {
          content: '';
          position: absolute;
          inset: 5px;
          border: 1px solid rgba(43, 29, 14, 0.2);
          pointer-events: none;
        }

        .input-label {
          font-family: 'Libre Caslon Text', serif;
          font-style: italic;
          font-size: 13px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--red);
          text-align: center;
          display: block;
          margin-bottom: 16px;
          position: relative;
          z-index: 1;
        }

        .idea-input {
          width: 100%;
          min-height: 130px;
          background: rgba(245, 235, 214, 0.75);
          border: 1px solid rgba(43, 29, 14, 0.3);
          padding: 16px 18px;
          color: var(--ink);
          font-family: 'JetBrains Mono', monospace;
          font-size: 15px;
          line-height: 1.6;
          resize: vertical;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          position: relative;
          z-index: 1;
        }
        .idea-input:focus {
          border-color: var(--amber);
          background: var(--paper);
          box-shadow: 0 0 0 3px rgba(200, 154, 60, 0.22);
        }
        .idea-input:disabled { opacity: 0.5; cursor: not-allowed; }
        .idea-input::placeholder {
          color: rgba(43, 29, 14, 0.5);
          font-style: italic;
        }

        .input-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10.5px;
          color: rgba(43, 29, 14, 0.55);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          position: relative;
          z-index: 1;
        }
        .input-meta kbd {
          font-family: 'JetBrains Mono', monospace;
          background: var(--paper);
          border: 1px solid rgba(43, 29, 14, 0.3);
          padding: 2px 6px;
          color: var(--ink);
          font-size: 10px;
        }

        .roast-button {
          margin-top: 20px;
          width: 100%;
          background: var(--ink);
          color: var(--paper);
          font-family: 'Libre Caslon Text', serif;
          font-weight: 700;
          font-size: 1.3rem;
          letter-spacing: 0.32em;
          border: none;
          padding: 19px 24px;
          cursor: pointer;
          text-transform: uppercase;
          transition: transform 0.15s ease, background 0.2s ease, letter-spacing 0.25s ease;
          position: relative;
          z-index: 1;
          box-shadow: 0 6px 0 -2px var(--red), 0 14px 28px -12px rgba(43, 29, 14, 0.4);
        }
        .roast-button:hover:not(:disabled) {
          background: var(--red);
          letter-spacing: 0.38em;
        }
        .roast-button:active:not(:disabled) {
          transform: translateY(2px);
          box-shadow: 0 3px 0 -2px var(--red), 0 6px 14px -8px rgba(43, 29, 14, 0.4);
        }
        .roast-button:disabled {
          background: rgba(43, 29, 14, 0.3);
          color: rgba(245, 235, 214, 0.6);
          cursor: not-allowed;
          box-shadow: none;
        }

        .error-note {
          margin-top: 20px;
          padding: 14px 18px;
          background: rgba(155, 44, 34, 0.12);
          border: 1px solid var(--red);
          color: var(--red);
          font-family: 'Libre Caslon Text', serif;
          font-style: italic;
          font-size: 0.92rem;
          line-height: 1.5;
          text-align: center;
        }

        /* ------- SHOW ------- */

        .show-banner {
          text-align: center;
          margin-bottom: 38px;
          padding-bottom: 24px;
          border-bottom: 1px solid rgba(43, 29, 14, 0.3);
        }
        .show-banner .tonight {
          font-family: 'Libre Caslon Text', serif;
          font-style: italic;
          font-size: 12px;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: var(--red);
          margin-bottom: 14px;
        }
        .show-banner h2 {
          font-family: 'Libre Caslon Display', serif;
          font-weight: 400;
          font-size: clamp(1.8rem, 5vw, 2.6rem);
          margin: 0;
          color: var(--ink);
          line-height: 1.1;
        }
        .show-banner .subject {
          font-style: italic;
          color: var(--amber);
        }

        .idea-quote {
          margin: 0 auto 28px;
          max-width: 580px;
          text-align: center;
          font-family: 'Libre Caslon Text', serif;
          font-style: italic;
          font-size: 1.1rem;
          line-height: 1.55;
          color: var(--ink);
          position: relative;
          padding: 0 36px;
        }
        .idea-quote::before,
        .idea-quote::after {
          font-family: 'Libre Caslon Display', serif;
          font-style: normal;
          font-size: 2.8rem;
          line-height: 0;
          color: var(--amber);
          position: absolute;
          top: 0.7em;
        }
        .idea-quote::before { content: '“'; left: 0; }
        .idea-quote::after  { content: '”'; right: 0; }

        .progress-rail {
          max-width: 420px;
          margin: 0 auto 44px;
          text-align: center;
        }
        .progress-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10.5px;
          color: var(--ink);
          letter-spacing: 0.22em;
          text-transform: uppercase;
          margin-bottom: 12px;
          opacity: 0.8;
        }
        .progress-track {
          height: 1px;
          background: rgba(43, 29, 14, 0.2);
          position: relative;
          overflow: hidden;
        }
        .progress-bar {
          position: absolute;
          top: -1px; bottom: -1px;
          width: 30%;
          background: linear-gradient(90deg, transparent, var(--amber) 40%, var(--red) 60%, transparent);
          animation: sweep 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          height: 3px;
        }
        @keyframes sweep {
          0%   { left: -30%; }
          100% { left: 100%; }
        }

        .cards-stack {
          display: flex;
          flex-direction: column;
          gap: 34px;
        }

        .roast-card {
          display: grid;
          grid-template-columns: 92px 1fr;
          gap: 6px;
          padding: 30px 26px;
          background:
            linear-gradient(180deg, rgba(232, 217, 185, 0.4) 0%, rgba(232, 217, 185, 0.15) 100%);
          border-top: 1px solid rgba(43, 29, 14, 0.35);
          border-bottom: 1px solid rgba(43, 29, 14, 0.35);
          animation: curtain-rise 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both;
          position: relative;
        }
        .roast-card::before {
          content: '';
          position: absolute;
          left: 100px;
          top: 30px;
          bottom: 30px;
          width: 1px;
          background: rgba(43, 29, 14, 0.25);
        }
        @keyframes curtain-rise {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .card-roman {
          font-family: 'Libre Caslon Display', serif;
          font-size: 4.6rem;
          line-height: 1;
          color: var(--amber);
          text-align: center;
          padding-top: 6px;
          font-weight: 400;
          letter-spacing: -0.02em;
          text-shadow:
            1px 1px 0 rgba(155, 44, 34, 0.08),
            3px 3px 0 rgba(43, 29, 14, 0.06);
        }

        .card-inner {
          padding-left: 6px;
        }

        .card-head {
          margin-bottom: 16px;
        }
        .card-labels {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--red);
          margin-bottom: 8px;
        }
        .label-sep { margin: 0 6px; opacity: 0.6; }
        .card-name {
          font-family: 'Libre Caslon Display', serif;
          font-weight: 400;
          font-size: 1.85rem;
          margin: 0;
          color: var(--ink);
          letter-spacing: -0.005em;
          line-height: 1.1;
        }
        .card-subtitle {
          font-family: 'Libre Caslon Text', serif;
          font-style: italic;
          font-size: 0.95rem;
          color: rgba(43, 29, 14, 0.7);
          margin: 4px 0 0;
        }
        .card-rule {
          margin-top: 14px;
          height: 1px;
          background: rgba(43, 29, 14, 0.2);
          position: relative;
        }
        .card-rule::before {
          content: '✦';
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          background: var(--paper);
          padding: 0 10px;
          color: var(--amber);
          font-size: 10px;
        }

        .card-body {
          font-family: 'Libre Caslon Text', serif;
          font-size: 1.05rem;
          line-height: 1.75;
          color: var(--ink);
          min-height: 3.5rem;
          white-space: pre-wrap;
          word-wrap: break-word;
          margin-top: 18px;
        }

        .tw-cursor {
          display: inline-block;
          margin-left: 2px;
          color: var(--red);
          animation: blink 0.85s step-end infinite;
        }
        @keyframes blink {
          0%, 49%   { opacity: 1; }
          50%, 100% { opacity: 0; }
        }

        .thinking {
          color: rgba(43, 29, 14, 0.55);
          font-style: italic;
          letter-spacing: 0.02em;
        }
        .thinking::after {
          content: '';
          display: inline-block;
          width: 1.4em;
          overflow: hidden;
          vertical-align: bottom;
          animation: dots 1.4s steps(4, end) infinite;
        }
        @keyframes dots {
          0%   { content: ''; }
          25%  { content: '.'; }
          50%  { content: '..'; }
          75%  { content: '...'; }
          100% { content: ''; }
        }

        /* ------- REDEMPTION ------- */

        .redemption-card {
          margin-top: 50px;
          padding: 44px 36px 38px;
          background:
            linear-gradient(180deg, var(--paper-dark) 0%, var(--paper) 100%);
          border: 1px double var(--amber);
          outline: 1px solid var(--amber);
          outline-offset: 6px;
          position: relative;
          text-align: center;
          animation: curtain-rise 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) both;
          box-shadow: 0 24px 50px -25px rgba(155, 44, 34, 0.3);
        }

        .red-ornament {
          font-family: 'Libre Caslon Display', serif;
          color: var(--red);
          font-size: 1.6rem;
          opacity: 0.9;
        }
        .red-ornament.bottom { margin-top: 22px; }

        .red-labels {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10.5px;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: var(--red);
          margin: 16px 0 10px;
        }

        .red-title {
          font-family: 'Libre Caslon Display', serif;
          font-weight: 400;
          font-style: italic;
          font-size: clamp(2.2rem, 6vw, 3rem);
          margin: 0 0 6px;
          color: var(--ink);
          letter-spacing: -0.01em;
        }

        .red-subtitle {
          font-family: 'Libre Caslon Text', serif;
          font-style: italic;
          font-size: 0.95rem;
          color: rgba(43, 29, 14, 0.7);
          margin: 0 0 22px;
        }

        .red-rule {
          width: 60%;
          margin: 0 auto 26px;
          height: 1px;
          background: rgba(43, 29, 14, 0.3);
          position: relative;
        }
        .red-rule::before {
          content: '✦ ✦ ✦';
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          background: var(--paper);
          padding: 0 14px;
          color: var(--amber);
          font-size: 11px;
          letter-spacing: 0.3em;
        }

        .red-body {
          font-family: 'Libre Caslon Text', serif;
          font-size: 1.08rem;
          line-height: 1.85;
          color: var(--ink);
          min-height: 4rem;
          white-space: pre-wrap;
          word-wrap: break-word;
          text-align: left;
          max-width: 560px;
          margin: 0 auto;
        }

        /* ------- RESET + CREDITS ------- */

        .reset-button {
          margin: 50px auto 0;
          display: block;
          background: transparent;
          color: var(--ink);
          border: 1px solid var(--ink);
          font-family: 'Libre Caslon Text', serif;
          font-style: italic;
          font-size: 14px;
          letter-spacing: 0.18em;
          padding: 14px 34px;
          cursor: pointer;
          text-transform: uppercase;
          transition: all 0.2s;
        }
        .reset-button:hover {
          background: var(--ink);
          color: var(--paper);
        }

        .credits {
          margin-top: 70px;
          text-align: center;
          color: rgba(43, 29, 14, 0.55);
          font-family: 'Libre Caslon Text', serif;
          font-style: italic;
          font-size: 12px;
          letter-spacing: 0.15em;
        }
        .credits .star { color: var(--amber); margin: 0 10px; }

        @media (max-width: 540px) {
          .stage { padding: 34px 16px 80px; }
          .roast-card {
            grid-template-columns: 68px 1fr;
            padding: 26px 20px;
          }
          .roast-card::before { left: 76px; }
          .card-roman { font-size: 3.4rem; }
          .card-name { font-size: 1.5rem; }
          .redemption-card { padding: 34px 22px 28px; }
          .idea-quote { padding: 0 28px; font-size: 1rem; }
        }
      `}</style>

      <div className="stage">
        <div className="stage-inner">
          {phase === "landing" && (
            <div>
              <header className="playbill-header">
                <p className="presents">The Theatre Presents</p>
                <h1 className="main-title">
                  <span className="roast">ROAST</span>
                  <span className="amp">— my —</span>
                  <span className="idea">Idea</span>
                </h1>
                <span className="title-flourish" />
                <p className="tagline">
                  A five-act tragicomedy in which your startup meets its critics.
                </p>
              </header>

              <div className="input-block">
                <label className="input-label">Submit your idea</label>
                <textarea
                  className="idea-input"
                  placeholder="e.g. An AI-powered app that decides what you should have for lunch"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  onKeyDown={handleKey}
                  disabled={phase === "roasting"}
                  maxLength={500}
                  autoFocus
                />
                <div className="input-meta">
                  <span>{idea.length} / 500</span>
                  <span>
                    <kbd>⌘</kbd> + <kbd>Enter</kbd>
                  </span>
                </div>

                <button
                  className="roast-button"
                  onClick={handleSubmit}
                  disabled={!idea.trim() || phase === "roasting"}
                >
                  Raise the Curtain
                </button>

                {error && <div className="error-note">{error}</div>}
              </div>
            </div>
          )}

          {phase !== "landing" && (
            <div>
              <div className="show-banner">
                <div className="tonight">Tonight on stage</div>
                <h2>
                  The jury deliberates on <span className="subject">your idea</span>
                </h2>
              </div>

              <div className="idea-quote">{idea}</div>

              {phase === "roasting" && (
                <div className="progress-rail">
                  <div className="progress-label">
                    {progressLabel || "Curtain rising"}
                  </div>
                  <div className="progress-track">
                    <div className="progress-bar" />
                  </div>
                </div>
              )}

              <div className="cards-stack">
                {ROASTERS.map((r, i) => {
                  if (i > currentIndex) return null;
                  const text = roasts[i];
                  const isThinking = text === null;
                  return (
                    <RoasterCard
                      key={r.id}
                      roaster={r}
                      index={i}
                      text={text}
                      isThinking={isThinking}
                    />
                  );
                })}
              </div>

              {showRedemption && (
                <RedemptionCard
                  text={redemption}
                  isThinking={redemption === null}
                />
              )}

              {phase === "done" && (
                <button className="reset-button" onClick={handleReset}>
                  ← Submit another idea
                </button>
              )}
            </div>
          )}

          <div className="credits">
            Written by sarcasm <span className="star">✦</span> directed by Gemini
          </div>
        </div>
      </div>
    </>
  );
}
