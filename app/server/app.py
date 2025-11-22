import os
from dotenv import load_dotenv
load_dotenv()

from flask import Flask, request, jsonify, session, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_conn, init_db

from models import (
    create_user, verify_user, find_user_by_id,
    create_collection_entry, list_collections_for_user, find_collection_by_id,
    create_chat, list_chats_for_user, get_recent_memories, add_memory
)
from tasks import process_pdf_task
from rag import run_agent

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET", "prod-secret-key")

CORS(app,
     supports_credentials=True,
     origins=["http://localhost:3000"],
     methods=["GET", "POST", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"]
)

UPLOAD_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
os.makedirs(UPLOAD_ROOT, exist_ok=True)

try:
    init_db()
except Exception as e:
    print(f"DB Init Error: {e}")

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "db": "postgres", "worker": "celery"})


@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not password:
        return jsonify({"ok": False, "error": "Missing fields"}), 400

    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id FROM users WHERE username = %s", (username,))
        if cur.fetchone():
            return jsonify({"ok": False, "error": "Username taken"}), 409

        pw_hash = generate_password_hash(password)
        cur.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s) RETURNING id",
            (username, email, pw_hash)
        )
        uid = cur.fetchone()['id']
        conn.commit()
        
        session["user_id"] = uid
        resp = jsonify({"ok": True, "user": {"id": uid, "username": username}})
        resp.set_cookie("user_id", str(uid), httponly=False, samesite="Lax")
        return resp
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500
    finally:
        conn.close()

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = cur.fetchone()
    conn.close()

    if user and check_password_hash(user['password_hash'], password):
        session["user_id"] = user['id']
        resp = jsonify({"ok": True, "user": {"id": user['id'], "username": user['username']}})
        resp.set_cookie("user_id", str(user['id']), httponly=False, samesite="Lax")
        return resp
    
    return jsonify({"ok": False, "error": "Invalid credentials"}), 401

@app.route("/api/me", methods=["GET"])
def me():
    uid = session.get("user_id")
    if not uid: return jsonify({"ok": False})
    
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, username, email FROM users WHERE id = %s", (uid,))
    user = cur.fetchone()
    conn.close()
    return jsonify({"ok": True, "user": dict(user)}) if user else jsonify({"ok": False})

@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    resp = jsonify({"ok": True})
    resp.delete_cookie("user_id")
    return resp


@app.route("/api/upload", methods=["POST"])
def upload_pdf():
    user_id = session.get("user_id")
    if not user_id: return jsonify({"ok": False, "error": "Unauthorized"}), 401
    
    if 'file' not in request.files: return jsonify({"ok": False}), 400
    f = request.files['file']
    if f.filename == '': return jsonify({"ok": False}), 400

    filename = secure_filename(f.filename)
    user_dir = os.path.join(UPLOAD_ROOT, str(user_id))
    os.makedirs(user_dir, exist_ok=True)
    stored_path = os.path.join(user_dir, filename)
    f.save(stored_path)

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO collections (user_id, filename, stored_path, processing_status) VALUES (%s, %s, %s, 'pending') RETURNING id",
        (user_id, filename, stored_path)
    )
    cid = cur.fetchone()['id']
    conn.commit()
    conn.close()

    process_pdf_task.delay(stored_path, filename, user_id, cid)

    return jsonify({"ok": True, "collection_id": cid, "status": "processing"})

@app.route("/api/collections", methods=["GET"])
def get_collections():
    user_id = session.get("user_id")
    if not user_id: return jsonify({"ok": False}), 401
    
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, filename, processing_status, created_at FROM collections WHERE user_id = %s ORDER BY created_at DESC", (user_id,))
    rows = cur.fetchall()
    conn.close()
    
    data = [dict(r) for r in rows]
    return jsonify({"ok": True, "collections": data})

@app.route("/api/collections/<int:collection_id>/download", methods=["GET"])
def download_collection(collection_id):
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"ok": False, "error": "unauthenticated"}), 401
    
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM collections WHERE id = %s", (collection_id,))
    col = cur.fetchone()
    conn.close()

    if not col or col["user_id"] != user_id:
        return jsonify({"ok": False, "error": "not found"}), 404
    
    if not os.path.exists(col["stored_path"]):
        return jsonify({"ok": False, "error": "file missing"}), 404

    return send_file(col["stored_path"], as_attachment=False)

@app.route("/api/collections/<int:collection_id>", methods=["DELETE"])
def delete_collection_route(collection_id):
    user_id = session.get("user_id")
    if not user_id: return jsonify({"ok": False, "error": "unauthenticated"}), 401

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT stored_path FROM collections WHERE id = %s AND user_id = %s", (collection_id, user_id))
    row = cur.fetchone()
    
    if not row:
        conn.close()
        return jsonify({"ok": False, "error": "Not found"}), 404
        
    try:
        if os.path.exists(row['stored_path']):
            os.remove(row['stored_path'])
            
        cur.execute("DELETE FROM collections WHERE id = %s", (collection_id,))
        conn.commit()
        return jsonify({"ok": True})
    except Exception as e:
        print(f"Delete Error: {e}")
        return jsonify({"ok": False, "error": "Failed to delete"}), 500
    finally:
        conn.close()


@app.route("/api/chats", methods=["POST"])
def create_chat_route():
    user_id = session.get("user_id")
    if not user_id: return jsonify({"ok": False, "error": "unauthenticated"}), 401
    data = request.get_json() or {}
    
    chat_id = create_chat(
        user_id, 
        name=data.get("name", "New Chat"), 
        collection_id=data.get("collection_id"), 
        mode=data.get("mode", "discrete")
    )
    return jsonify({"ok": True, "chat_id": chat_id})

@app.route("/api/chats", methods=["GET"])
def list_chats_route():
    user_id = session.get("user_id")
    if not user_id: return jsonify({"ok": False, "error": "unauthenticated"}), 401
    
    chats = list_chats_for_user(user_id)
    out = [dict(c) for c in chats]
    return jsonify({"ok": True, "chats": out})

@app.route("/api/chats/<int:chat_id>", methods=["GET"])
def get_chat_history(chat_id):
    user_id = session.get("user_id")
    if not user_id: return jsonify({"ok": False, "error": "unauthenticated"}), 401
    
    memories = get_recent_memories(user_id, chat_id, limit=50)
    history = [{"role": m["role"], "content": m["content"]} for m in memories]
    return jsonify({"ok": True, "history": history})

@app.route("/api/chats/<int:chat_id>", methods=["DELETE"])
def delete_chat_route(chat_id):
    user_id = session.get("user_id")
    if not user_id: return jsonify({"ok": False, "error": "unauthenticated"}), 401
    
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id FROM chats WHERE id = %s AND user_id = %s", (chat_id, user_id))
        if not cur.fetchone():
            return jsonify({"ok": False, "error": "Chat not found"}), 404

        cur.execute("DELETE FROM chats WHERE id = %s", (chat_id,))
        conn.commit()
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500
    finally:
        conn.close()

@app.route("/api/chat", methods=["POST"])
def chat_route():
    user_id = session.get("user_id")
    if not user_id: return jsonify({"ok": False, "error": "Unauthorized"}), 401

    data = request.get_json() or {}
    query = data.get("query")
    chat_id = data.get("chat_id")
    raw_name = data.get("collection_name")
    mode = data.get("mode", "discrete") 
    
    if not raw_name:
        return jsonify({"ok": False, "error": "No document selected"}), 400

    conn = get_conn()
    cur = conn.cursor()
    try:
        if chat_id:
            cur.execute("SELECT id FROM chats WHERE id = %s AND user_id = %s", (chat_id, user_id))
            if not cur.fetchone():
                chat_id = None 

        if not chat_id:
            cur.execute("SELECT id FROM collections WHERE user_id = %s AND filename = %s", (user_id, raw_name))
            col_row = cur.fetchone()
            
            if col_row:
                collection_id = col_row['id']
                cur.execute("SELECT id FROM chats WHERE collection_id = %s ORDER BY created_at DESC LIMIT 1", (collection_id,))
                existing_chat = cur.fetchone()
                
                if existing_chat:
                    chat_id = existing_chat['id']
                else:
                    cur.execute(
                        "INSERT INTO chats (user_id, name, collection_id, mode) VALUES (%s, %s, %s, %s) RETURNING id", 
                        (user_id, raw_name, collection_id, mode)
                    )
                    chat_id = cur.fetchone()['id']
                    conn.commit()
    except Exception as e:
        print(f"Chat ID Error: {e}")
    finally:
        conn.close()

    collection_name = f"user_{user_id}__{raw_name}"
    if raw_name.startswith(f"user_{user_id}__"):
        collection_name = raw_name

    if chat_id:
        try:
            add_memory(user_id, chat_id, "user", query)
        except Exception:
            pass

    def generate():
        try:
            result = run_agent(query, collection_name, mode=mode)
            stream_gen = result["stream"]
            sources = result["sources"]

            import json
            yield json.dumps({"type": "sources", "data": sources, "chat_id": chat_id}) + "\n"

            full_answer = ""
            for chunk in stream_gen:
                full_answer += chunk
                yield json.dumps({"type": "token", "data": chunk}) + "\n"

            if chat_id:
                with app.app_context():
                    try:
                        add_memory(user_id, chat_id, "assistant", full_answer)
                    except Exception as e:
                        print(f"Failed to save AI memory: {e}")

        except Exception as e:
            print(f"Stream Error: {e}")
            import json
            yield json.dumps({"type": "error", "data": str(e)}) + "\n"

    from flask import Response
    return Response(generate(), mimetype='application/x-ndjson')
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)