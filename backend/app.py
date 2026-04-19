import os
from dotenv import load_dotenv
load_dotenv()
from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from google.genai import types

app = Flask(__name__)

# In produzione Render userà la variabile FRONTEND_ORIGIN per il CORS.
# In locale accetta qualunque origin.
frontend_origin = os.environ.get("FRONTEND_ORIGIN", "*")
CORS(app, resources={r"/api/*": {"origins": frontend_origin}})

# Il client Gemini prende la key automaticamente da GEMINI_API_KEY
client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

MODEL = "gemini-2.5-flash"
MAX_TOKENS = 400  # Gemini a volte include un po' di "thinking", meglio tenerci margine


@app.get("/")
def health():
    return {"status": "ok", "service": "roast-my-idea-backend", "model": MODEL}


@app.post("/api/roast")
def roast():
    """
    Proxy semplice verso l'API Gemini.
    Il frontend manda {messages: [{role, content}]} in formato stile Anthropic
    e noi lo convertiamo per Gemini, rispondendo nello stesso formato
    che il frontend già sa parsare.
    """
    try:
        data = request.get_json(silent=True) or {}
        messages = data.get("messages")
        if not messages or not isinstance(messages, list):
            return jsonify({"error": "messages array required"}), 400

        # Protezione base: limita la lunghezza dell'input
        total_chars = sum(len(m.get("content", "")) for m in messages)
        if total_chars > 4000:
            return jsonify({"error": "input too long"}), 413

        # Il frontend manda un singolo messaggio "user" con tutto il prompt dentro.
        # Lo passiamo direttamente a Gemini come contents.
        user_content = messages[-1].get("content", "")

        response = client.models.generate_content(
            model=MODEL,
            contents=user_content,
            config=types.GenerateContentConfig(
                max_output_tokens=MAX_TOKENS,
                temperature=1.0,  # più alta = più creativo/cattivo
            ),
        )

        text = (response.text or "").strip()

        # Rispondiamo nel formato che il frontend già sa parsare
        # (stessa struttura dell'API Anthropic: content = [{type, text}])
        return jsonify({"content": [{"type": "text", "text": text}]})

    except KeyError as e:
        app.logger.error(f"Missing env var: {e}")
        return jsonify({"error": "server not configured"}), 500
    except Exception as e:
        app.logger.exception("Unexpected error")
        return jsonify({"error": f"internal error: {str(e)}"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True)
