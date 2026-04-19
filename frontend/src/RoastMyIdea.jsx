import React, { useState, useEffect } from "react";

// ---------- CONFIG ----------

const GOLD = "#FFB800";
const TYPING_SPEED = 30; // ms per char

// Vite inietta le variabili VITE_* a build-time.
// In locale: metti VITE_API_URL=http://localhost:5001 nel file .env.local del frontend
// In produzione: Render lo setterà all'URL del backend.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const ROASTERS = [
  {
    id: "user",
    emoji: "😤",
    name: "L'Utente Scettico",
    title: "Persona normale, al bar",
    accent: "#FF6B35",
    intensity: 3,
    prompt:
      "Sei una persona comune e pragmatica. Non ti fidi delle startup. Roasta questa idea con tono burbero da bar, senza gergo tech. Max 4 frasi.",
  },
  {
    id: "competitor",
    emoji: "😈",
    name: "Il Concorrente",
    title: "CEO della startup rivale",
    accent: "#FF3B6B",
    intensity: 4,
    prompt:
      "Sei il CEO di una startup che fa già esattamente questa cosa ma meglio. Roasta con arroganza velata e sarcasmo sorridente, citando le tue feature superiori e i tuoi investitori. Max 4 frasi.",
  },
  {
    id: "journalist",
    emoji: "📰",
    name: "Il Giornalista",
    title: "Tech blogger in cerca di click",
    accent: "#FFD166",
    intensity: 4,
    prompt:
      "Sei un giornalista tech che ama i titoli sensazionalistici stile Wired Italia. Roasta questa idea con tono drammatico e profetico, trovando l'angolo più clickbait possibile. Max 4 frasi.",
  },
  {
    id: "mom",
    emoji: "👵",
    name: "Tua Mamma",
    title: "Non capisce perché non fai il medico",
    accent: "#C77DFF",
    intensity: 2,
    prompt:
      "Sei la mamma italiana tipica. Non capisci niente di startup. Rispondi con calore ma delusione velata, facendo paragoni con cugini di successo e chiedendo quando ti trovi un lavoro vero. Max 4 frasi.",
  },

  {
    id: "prof",
    emoji: "🤓",
    name: "Il Prof del Poli",
    title: "Ordinario di Ingegneria del Software",
    accent: "#00AACC",
    intensity: 4,
    prompt:
      "Sei un professore ordinario del Politecnico di Milano, pedante e leggermente sadico, che ha corretto decine di migliaia di progetti di studenti. Roasta questa idea di startup come se fosse un progetto d'esame da bocciare: trova violazioni di design pattern, problemi di scalabilità, accoppiamento eccessivo, scelte tecnologiche discutibili. Usa terminologia da corso di Ingegneria del Software. Chiudi con una frecciatina sul fatto che lo studente evidentemente non ha seguito le lezioni. Max 4 frasi.",
  },
];

const REDEMPTION_PROMPT =
  "Nonostante tutte le critiche, dai 3 consigli concreti e genuini per rendere questa idea di startup davvero valida. Sii onesto ma costruttivo. Rispondi nella lingua con cui ha scritto l utente, max 6 frasi.";

// ---------- API ----------

async function callClaude(prompt, idea) {
  const response = await fetch(`${API_URL}/api/roast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content: `${prompt}\n\nEcco l'idea di startup da commentare:\n"${idea}"`,
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

function Typewriter({ text, speed = TYPING_SPEED, accent = GOLD }) {
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
      {!done && (
        <span className="tw-cursor" style={{ color: accent }}>
          ▌
        </span>
      )}
    </span>
  );
}

// ---------- CARDS ----------

function RoasterCard({ roaster, text, isThinking }) {
  return (
    <div
      className="roast-card"
      style={{
        borderLeft: `4px solid ${roaster.accent}`,
        boxShadow: `0 18px 50px -25px ${roaster.accent}aa, 0 2px 0 rgba(255,255,255,0.02) inset`,
      }}
    >
      <div className="card-row">
        <div
          className="roaster-emoji"
          style={{ filter: `drop-shadow(0 0 18px ${roaster.accent}66)` }}
        >
          {roaster.emoji}
        </div>
        <div className="card-body">
          <div className="roaster-head">
            <h3 className="roaster-name">{roaster.name}</h3>
            <span
              className="roaster-chip"
              style={{
                color: roaster.accent,
                borderColor: `${roaster.accent}55`,
              }}
            >
              Roaster #{ROASTERS.indexOf(roaster) + 1}
            </span>
          </div>
          <p className="roaster-title" style={{ color: roaster.accent }}>
            {roaster.title}
          </p>
          <p className="roaster-intensity">
            Roast intensity{" "}
            <span style={{ color: roaster.accent, letterSpacing: "2px" }}>
              {"🔥".repeat(roaster.intensity)}
              <span style={{ opacity: 0.25 }}>
                {"🔥".repeat(5 - roaster.intensity)}
              </span>
            </span>
          </p>
          <div className="roast-text">
            {isThinking ? (
              <span className="thinking">sta pensando</span>
            ) : (
              <Typewriter text={text} accent={roaster.accent} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RedemptionCard({ text, isThinking }) {
  return (
    <div className="redemption-card">
      <div className="redemption-stars">★ ✦ ★ ✦ ★</div>
      <h3 className="redemption-title">✨ La Redenzione ✨</h3>
      <p className="redemption-subtitle">
        Ok, ora basta scherzare. Ecco consigli veri.
      </p>
      <div className="redemption-text">
        {isThinking ? (
          <span className="thinking">sta pensando</span>
        ) : (
          <Typewriter text={text} accent={GOLD} speed={25} />
        )}
      </div>
    </div>
  );
}

// ---------- MAIN ----------

export default function RoastMyIdea() {
  const [phase, setPhase] = useState("landing"); // landing | roasting | done
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
          `Roaster ${i + 1} / 5 — ${ROASTERS[i].name} sta caricando la cartuccia`
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

      setProgressLabel("Scrivendo la redenzione...");
      const red = await callClaude(REDEMPTION_PROMPT, idea);
      setRedemption(red);
      await new Promise((r) => setTimeout(r, red.length * TYPING_SPEED + 700));

      setPhase("done");
      setProgressLabel("");
    } catch (e) {
      console.error(e);
      setError(
        "Il forno del roast si è spento un attimo. Riprova tra qualche istante."
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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,900&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');

        * { box-sizing: border-box; }

        .stage {
          min-height: 100vh;
          background:
            radial-gradient(ellipse 80% 50% at 50% 0%, #211a0a 0%, #0d0d0d 55%),
            #0d0d0d;
          color: #f5f5f5;
          position: relative;
          overflow-x: hidden;
          padding: 56px 20px 100px;
          font-family: 'Space Mono', monospace;
        }

        .stage::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          opacity: 0.07;
          mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
        }

        .stage::after {
          content: '';
          position: fixed;
          top: -20%;
          left: 50%;
          transform: translateX(-50%);
          width: 140%;
          height: 70vh;
          pointer-events: none;
          z-index: 0;
          background: radial-gradient(ellipse at center, ${GOLD}18 0%, transparent 60%);
        }

        .stage-inner {
          max-width: 740px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 3px;
          color: ${GOLD};
          border: 1px solid ${GOLD}55;
          padding: 7px 14px;
          border-radius: 999px;
          text-transform: uppercase;
          margin-bottom: 28px;
          background: #0d0d0d99;
        }
        .badge .dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: ${GOLD};
          box-shadow: 0 0 10px ${GOLD};
          animation: pulse-dot 1.2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.45; transform: scale(0.7); }
        }

        .main-title {
          font-family: 'Playfair Display', serif;
          font-weight: 900;
          font-size: clamp(3rem, 9.5vw, 6.2rem);
          line-height: 0.92;
          letter-spacing: -0.03em;
          margin: 0;
          color: #fff;
          text-shadow: 0 6px 60px ${GOLD}33;
        }
        .main-title .amp {
          font-style: italic;
          color: ${GOLD};
        }

        .flame {
          display: inline-block;
          animation: flicker 0.55s ease-in-out infinite alternate;
          transform-origin: bottom center;
          filter: drop-shadow(0 0 24px ${GOLD}) drop-shadow(0 0 6px #ff6a00);
        }
        @keyframes flicker {
          0%   { transform: scale(1) rotate(-5deg) translateY(0); }
          25%  { transform: scale(1.1) rotate(4deg) translateY(-3px); }
          50%  { transform: scale(1.02) rotate(-3deg) translateY(-1px); }
          75%  { transform: scale(1.14) rotate(6deg) translateY(-4px); }
          100% { transform: scale(1.02) rotate(-4deg) translateY(0); }
        }

        .subtitle {
          font-family: 'Space Mono', monospace;
          color: #b5b5b5;
          font-size: 1rem;
          margin: 22px 0 40px;
          letter-spacing: 0.01em;
        }
        .subtitle .prompt {
          color: ${GOLD};
          margin-right: 10px;
        }

        .idea-input {
          width: 100%;
          min-height: 150px;
          background: #141414;
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          padding: 20px 22px;
          color: #f5f5f5;
          font-family: 'Space Mono', monospace;
          font-size: 16px;
          line-height: 1.55;
          resize: vertical;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          outline: none;
        }
        .idea-input:focus {
          border-color: ${GOLD};
          box-shadow: 0 0 0 4px ${GOLD}22;
          background: #161210;
        }
        .idea-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .idea-input::placeholder {
          color: #5a5a5a;
          font-style: italic;
        }

        .input-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: #5a5a5a;
          letter-spacing: 0.08em;
        }
        .input-meta kbd {
          font-family: 'Space Mono', monospace;
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-bottom-width: 2px;
          padding: 2px 6px;
          border-radius: 4px;
          color: #c5c5c5;
          font-size: 10px;
        }

        .roast-button {
          margin-top: 18px;
          width: 100%;
          background: ${GOLD};
          color: #0d0d0d;
          font-family: 'Playfair Display', serif;
          font-weight: 900;
          font-size: 1.6rem;
          letter-spacing: 0.05em;
          border: none;
          border-radius: 12px;
          padding: 20px 24px;
          cursor: pointer;
          text-transform: uppercase;
          transition: transform 0.15s ease, box-shadow 0.25s ease;
          box-shadow: 0 0 40px -5px ${GOLD}88, inset 0 -5px 0 #b8860040;
          position: relative;
        }
        .roast-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 14px 50px -5px ${GOLD}cc, inset 0 -5px 0 #b8860040;
        }
        .roast-button:active:not(:disabled) { transform: translateY(0); }
        .roast-button:disabled {
          background: #2a2a2a;
          color: #6a6a6a;
          cursor: not-allowed;
          box-shadow: none;
        }

        .reset-button {
          margin: 44px auto 0;
          display: block;
          background: transparent;
          color: ${GOLD};
          border: 1px solid ${GOLD}77;
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          letter-spacing: 0.15em;
          padding: 14px 30px;
          border-radius: 999px;
          cursor: pointer;
          text-transform: uppercase;
          transition: all 0.2s;
        }
        .reset-button:hover {
          background: ${GOLD};
          color: #0d0d0d;
          transform: translateY(-1px);
        }

        .loader-wrap { margin: 20px 0 32px; }
        .loader-label {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: ${GOLD};
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin-bottom: 10px;
          text-align: center;
          opacity: 0.9;
        }
        .loader-track {
          height: 3px;
          background: #1a1a1a;
          border-radius: 999px;
          overflow: hidden;
          position: relative;
        }
        .loader-bar {
          position: absolute;
          top: 0; bottom: 0;
          width: 35%;
          background: linear-gradient(90deg, transparent, ${GOLD}, transparent);
          animation: sweep 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes sweep {
          0%   { left: -35%; }
          100% { left: 100%; }
        }

        .idea-echo {
          font-family: 'Space Mono', monospace;
          font-size: 0.95rem;
          color: #c5c5c5;
          margin: 14px 0 10px;
          padding: 16px 20px;
          background: #141414;
          border-left: 3px solid ${GOLD};
          border-radius: 4px;
          font-style: italic;
          line-height: 1.55;
        }
        .idea-echo .quote {
          color: ${GOLD};
          font-weight: 700;
          margin-right: 6px;
        }

        .cards-stack {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-top: 10px;
        }

        .roast-card {
          background: linear-gradient(180deg, #151515 0%, #101010 100%);
          border-radius: 14px;
          padding: 24px 26px;
          animation: slide-up 0.55s cubic-bezier(0.2, 0.7, 0.2, 1) both;
          position: relative;
          backdrop-filter: blur(4px);
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(26px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .card-row {
          display: flex;
          gap: 18px;
          align-items: flex-start;
        }
        .roaster-emoji {
          font-size: 3.2rem;
          line-height: 1;
          flex-shrink: 0;
          padding-top: 2px;
        }
        .card-body { flex: 1; min-width: 0; }
        .roaster-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .roaster-name {
          font-family: 'Playfair Display', serif;
          font-weight: 700;
          font-size: 1.5rem;
          margin: 0;
          color: #fff;
          letter-spacing: -0.01em;
        }
        .roaster-chip {
          font-family: 'Space Mono', monospace;
          font-size: 9.5px;
          padding: 3px 8px;
          border: 1px solid;
          border-radius: 999px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }
        .roaster-title {
          font-family: 'Space Mono', monospace;
          font-size: 0.82rem;
          margin: 3px 0 0;
          letter-spacing: 0.02em;
        }
        .roaster-intensity {
          font-family: 'Space Mono', monospace;
          font-size: 0.72rem;
          color: #6a6a6a;
          margin: 8px 0 16px;
          letter-spacing: 0.05em;
        }
        .roast-text {
          font-family: 'Space Mono', monospace;
          font-size: 0.97rem;
          line-height: 1.7;
          color: #ececec;
          min-height: 3.5rem;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .tw-cursor {
          display: inline-block;
          margin-left: 2px;
          animation: blink 0.85s step-end infinite;
          font-weight: 700;
        }
        @keyframes blink {
          0%, 49%   { opacity: 1; }
          50%, 100% { opacity: 0; }
        }

        .thinking {
          color: #7a7a7a;
          font-style: italic;
          animation: pulse-thinking 1.3s ease-in-out infinite;
        }
        .thinking::after {
          content: '';
          display: inline-block;
          width: 1.4em;
          overflow: hidden;
          vertical-align: bottom;
          animation: dots 1.3s steps(4, end) infinite;
        }
        @keyframes dots {
          0%   { content: ''; }
          25%  { content: '.'; }
          50%  { content: '..'; }
          75%  { content: '...'; }
          100% { content: ''; }
        }
        @keyframes pulse-thinking {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 1; }
        }

        .redemption-card {
          margin-top: 34px;
          background:
            radial-gradient(ellipse at top, ${GOLD}15 0%, transparent 60%),
            linear-gradient(180deg, #1a1407 0%, #120e07 100%);
          border: 2px solid ${GOLD};
          border-radius: 16px;
          padding: 36px 30px 32px;
          box-shadow:
            0 24px 90px -22px ${GOLD}88,
            inset 0 0 50px ${GOLD}0c;
          animation:
            slide-up 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both,
            glow 3.4s ease-in-out infinite;
          position: relative;
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 24px 90px -22px ${GOLD}88, inset 0 0 50px ${GOLD}0c; }
          50%      { box-shadow: 0 28px 110px -18px ${GOLD}cc, inset 0 0 60px ${GOLD}18; }
        }

        .redemption-stars {
          text-align: center;
          color: ${GOLD};
          letter-spacing: 0.6em;
          font-size: 11px;
          margin-bottom: 14px;
          opacity: 0.7;
        }
        .redemption-title {
          font-family: 'Playfair Display', serif;
          font-weight: 900;
          font-style: italic;
          font-size: clamp(1.75rem, 5vw, 2.4rem);
          margin: 0 0 6px;
          color: ${GOLD};
          text-align: center;
          text-shadow: 0 0 40px ${GOLD}66;
        }
        .redemption-subtitle {
          font-family: 'Space Mono', monospace;
          font-size: 0.78rem;
          color: #b5b5b5;
          text-align: center;
          margin: 0 0 26px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .redemption-text {
          font-family: 'Space Mono', monospace;
          font-size: 1rem;
          line-height: 1.8;
          color: #f5f5f5;
          min-height: 4rem;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .error-note {
          margin-top: 18px;
          padding: 14px 18px;
          background: #2a0f14;
          border: 1px solid #ff3b6b55;
          color: #ff9bb0;
          border-radius: 10px;
          font-family: 'Space Mono', monospace;
          font-size: 0.88rem;
          line-height: 1.5;
        }

        .credits {
          margin-top: 64px;
          text-align: center;
          color: #3a3a3a;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
        }
        .credits .sep { color: ${GOLD}66; margin: 0 10px; }

        @media (max-width: 520px) {
          .stage { padding: 36px 16px 80px; }
          .roaster-emoji { font-size: 2.6rem; }
          .roast-card { padding: 20px; }
          .redemption-card { padding: 28px 22px; }
          .roaster-chip { display: none; }
        }
      `}</style>

      <div className="stage">
        <div className="stage-inner">
          {phase === "landing" && (
            <div>
              <span className="badge">
                <span className="dot" />
                Late-night tech roast
              </span>
              <h1 className="main-title">
                ROAST <span className="amp">MY</span> IDEA{" "}
                <span className="flame">🔥</span>
              </h1>
              <p className="subtitle">
                <span className="prompt">&gt;</span>Scopri quanto fa schifo la
                tua idea di startup.
              </p>

              <textarea
                className="idea-input"
                placeholder="Es: 'Un'app che usa l'AI per scegliere cosa mangiare a pranzo'"
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
                Roastami 🔥
              </button>

              {error && <div className="error-note">{error}</div>}
            </div>
          )}

          {phase !== "landing" && (
            <div>
              <span className="badge">
                <span className="dot" />
                In onda — Roast Show
              </span>
              <h1
                className="main-title"
                style={{ fontSize: "clamp(2rem, 6vw, 3.4rem)" }}
              >
                Il verdetto della giuria{" "}
                <span className="flame" style={{ fontSize: "0.75em" }}>
                  🔥
                </span>
              </h1>

              <div className="idea-echo">
                <span className="quote">"</span>
                {idea}
                <span className="quote">"</span>
              </div>

              {phase === "roasting" && (
                <div className="loader-wrap">
                  <div className="loader-label">
                    {progressLabel || "Preparazione del palco..."}
                  </div>
                  <div className="loader-track">
                    <div className="loader-bar" />
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
                  ← Roasta un'altra idea
                </button>
              )}
            </div>
          )}

          <div className="credits">
            Powered by sarcasm <span className="sep">✦</span> &amp; Claude
          </div>
        </div>
      </div>
    </>
  );
}
