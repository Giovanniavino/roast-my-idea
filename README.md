# 🔥 Roast My Idea (versione Gemini — gratis)

Un'app che roasta la tua idea di startup con 5 personaggi diversi + un consiglio finale serio.

**Stack:** Flask (backend proxy) + React/Vite (frontend) + **Google Gemini API** (gratis).

---

## Prerequisiti

- **Python 3.10+** ([python.org](https://www.python.org/downloads/) — durante l'installazione su Windows spunta "Add python.exe to PATH")
- **Node.js 18+** ([nodejs.org](https://nodejs.org) — versione LTS)
- **API key Gemini gratis**: vai su [aistudio.google.com/apikey](https://aistudio.google.com/apikey), login con Google, "Create API key". Gratis, nessuna carta di credito richiesta.

---

## Sviluppo locale su Windows

### 1. Backend Flask

Apri **PowerShell** nella cartella `backend`:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**Se PowerShell dà errore "execution of scripts is disabled"** — lancia una volta:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```
Poi riprova l'attivazione del venv.

Imposta le variabili d'ambiente (in questa sessione PowerShell):

```powershell
$env:GEMINI_API_KEY="LA-TUA-KEY-GEMINI"
$env:FRONTEND_ORIGIN="http://localhost:5173"
```

Avvia:
```powershell
python app.py
```

Il backend gira su `http://localhost:5001`. Testa:
```powershell
curl http://localhost:5001/
# {"model":"gemini-2.5-flash","service":"roast-my-idea-backend","status":"ok"}
```

**Non chiudere questa finestra.**

### 2. Frontend React

In una **seconda** finestra PowerShell:

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

Apri `http://localhost:5173` nel browser e roasta.

---

## Comandi equivalenti su macOS / Linux

<details>
<summary>Clicca per espandere</summary>

Backend:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

export GEMINI_API_KEY="LA-TUA-KEY"
export FRONTEND_ORIGIN="http://localhost:5173"
python app.py
```

Frontend:
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```
</details>

---

## Deploy su Render (free tier)

Due servizi separati sullo stesso repo GitHub.

### Step 0 — GitHub

Dalla cartella `roast-my-idea-gemini`:

```powershell
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TUO_USERNAME/roast-my-idea.git
git push -u origin main
```

### Step 1 — Backend (Web Service)

Su Render → **New → Web Service** → collega il repo GitHub.

| Campo | Valore |
|---|---|
| Name | `roast-my-idea-api` |
| Root Directory | `backend` |
| Runtime | Python 3 |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `gunicorn app:app` |
| Instance Type | Free |

**Environment variables:**
- `GEMINI_API_KEY` → la tua key di Google AI Studio
- `FRONTEND_ORIGIN` → lascia vuoto per ora, lo riempi dopo

Clicca **Create**. Al termine Render ti dà un URL tipo `https://roast-my-idea-api.onrender.com`. Annotatelo.

### Step 2 — Frontend (Static Site)

Su Render → **New → Static Site** → stesso repo.

| Campo | Valore |
|---|---|
| Name | `roast-my-idea` |
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

**Environment variables:**
- `VITE_API_URL` → URL del backend dallo Step 1 (senza slash finale)

Clicca **Create**. Al termine ti dà l'URL del frontend.

### Step 3 — Chiudi il CORS

Torna sul servizio **backend** → **Environment** → edita `FRONTEND_ORIGIN`:

```
https://roast-my-idea.onrender.com
```

(l'URL esatto del frontend, senza slash finale). Render fa redeploy automatico.

Fatto.

---

## Free tier di Gemini — cosa sapere

- **15 richieste al minuto** per `gemini-2.5-flash`. Un roast completo = 6 richieste, quindi fai max 2 roast al minuto. Se clicchi "Roastami" troppo velocemente ti dà errore 429.
- **1500 richieste al giorno** — praticamente illimitato per uso personale.
- **Senza carta di credito**, resta gratis per sempre su questo tier.
- Google potrebbe usare i tuoi input per migliorare i modelli (è il prezzo del gratis). Non metterci dati sensibili.

---

## Free tier di Render — cosa sapere

- Il backend si **spegne dopo 15 min di inattività**. La prima chiamata dopo il cold start impiega ~30-60 secondi. Il primo "sta pensando" sarà lungo, poi fila liscio.
- 750 ore gratis/mese, più che sufficienti per un progetto hobby.
- Se vuoi evitare il cold start → cron-job.org che pinga `/` ogni 10 min.

---

## Troubleshooting

**"GEMINI_API_KEY" KeyError all'avvio del backend**
→ Non hai impostato la variabile d'ambiente. Su Windows in PowerShell usa `$env:GEMINI_API_KEY="..."`, non `set` o `export`.

**"Failed to fetch" nel browser**
→ Il backend non risponde. Controlla che la finestra PowerShell del backend sia ancora aperta e non mostri errori. Controlla che `VITE_API_URL` nel frontend punti all'URL giusto.

**"API error: 429" dopo aver cliccato Roastami più volte**
→ Hai superato i 15 RPM del free tier Gemini. Aspetta 60 secondi e riprova.

**"API error: 500" con messaggio sui permessi**
→ La key Gemini non è stata abilitata. Vai su [aistudio.google.com/apikey](https://aistudio.google.com/apikey), genera una nuova key, sostituiscila.

**Pagina bianca in produzione dopo aver settato `VITE_API_URL`**
→ Le variabili `VITE_*` sono iniettate a **build-time**. Se le hai aggiunte dopo il primo deploy, triggera un redeploy manuale su Render (Manual Deploy → Clear build cache & deploy).

**Il venv non si attiva su Windows**
→ `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` una volta, poi riprova.
