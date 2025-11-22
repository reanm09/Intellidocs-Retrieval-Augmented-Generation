from werkzeug.security import generate_password_hash, check_password_hash
from database import get_conn

def create_user(username, email, password):
    pw_hash = generate_password_hash(password)
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s) RETURNING id",
        (username, email, pw_hash)
    )
    last = cur.fetchone()['id']
    conn.commit()
    conn.close()
    return last

def find_user_by_username(username):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE username = %s", (username,))
    row = cur.fetchone()
    conn.close()
    return row

def find_user_by_id(user_id):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    conn.close()
    return row

def verify_user(username, password):
    user = find_user_by_username(username)
    if not user:
        return None
    if check_password_hash(user["password_hash"], password):
        return user
    return None

def create_collection_entry(user_id, filename, stored_path):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO collections (user_id, filename, stored_path, processing_status) VALUES (%s, %s, %s, 'pending') RETURNING id",
        (user_id, filename, stored_path)
    )
    cid = cur.fetchone()['id']
    conn.commit()
    conn.close()
    return cid

def list_collections_for_user(user_id):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM collections WHERE user_id = %s ORDER BY created_at DESC", (user_id,))
    rows = cur.fetchall()
    conn.close()
    return rows

def find_collection_by_id(collection_id):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM collections WHERE id = %s", (collection_id,))
    row = cur.fetchone()
    conn.close()
    return row

def create_chat(user_id, name=None, collection_id=None, mode="discrete"):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO chats (user_id, name, collection_id, mode) VALUES (%s, %s, %s, %s) RETURNING id",
        (user_id, name, collection_id, mode)
    )
    cid = cur.fetchone()['id']
    conn.commit()
    conn.close()
    return cid

def list_chats_for_user(user_id):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM chats WHERE user_id = %s ORDER BY created_at DESC", (user_id,))
    rows = cur.fetchall()
    conn.close()
    return rows

def add_memory(user_id, chat_id, role, content):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO memories (user_id, chat_id, role, content) VALUES (%s, %s, %s, %s)",
        (user_id, chat_id, role, content)
    )
    conn.commit()
    conn.close()

def get_recent_memories(user_id, chat_id, limit=8):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT role, content, created_at FROM memories WHERE user_id = %s AND chat_id = %s ORDER BY id DESC LIMIT %s",
        (user_id, chat_id, limit)
    )
    rows = cur.fetchall()
    conn.close()
    return list(reversed(rows))