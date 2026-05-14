import os
from dotenv import load_dotenv
load_dotenv()

from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq

app = Flask(__name__)

frontend_origin = os.environ.get("FRONTEND_ORIGIN", "*")
CORS(app, resources={r"/api/*": {"origins": frontend_origin}})

client = Groq(api_key=os.environ["GROQ_API_KEY"])

MODEL = "llama-3.3-70b-versatile"
MAX_TOKENS = 500


@app.get("/")
def health():
    return {"status": "ok", "service": "roast-my-idea-backend", "model": MODEL}


@app.post("/api/roast")
def roast():
    try:
        data = request.get_json(silent=True) or {}
        messages = data.get("messages")
        if not messages or not isinstance(messages, list):
            return jsonify({"error": "messages array required"}), 400

        total_chars = sum(len(m.get("content", "")) for m in messages)
        if total_chars > 4000:
            return jsonify({"error": "input too long"}), 413

        user_content = messages[-1].get("content", "")

        
        completion = client.chat.completions.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            temperature=1.0,
            messages=[
                {"role": "user", "content": user_content}
            ],
        )

        text = (completion.choices[0].message.content or "").strip()

        finish_reason = completion.choices[0].finish_reason
        app.logger.info(f"finish_reason={finish_reason}, text_len={len(text)}")

        # Retry se troncato
        if finish_reason == "length" or not text:
            app.logger.warning("Retrying due to truncation or empty response")
            completion = client.chat.completions.create(
                model=MODEL,
                max_tokens=MAX_TOKENS,
                temperature=1.0,
                messages=[{"role": "user", "content": user_content}],
            )
            text = (completion.choices[0].message.content or "").strip()

        if not text:
            text = "(Il roaster è rimasto senza parole. Ma il prossimo arriva subito.)"

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
