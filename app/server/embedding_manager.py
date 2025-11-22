import os
from sentence_transformers import SentenceTransformer
import chromadb

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CHROMA_DIR = os.path.join(BASE_DIR, "..", "chroma_db")

EMBED_MODEL = SentenceTransformer("all-MiniLM-L6-v2")

client = chromadb.PersistentClient(path=CHROMA_DIR)

def get_embedding(text):
    emb = EMBED_MODEL.encode(text)
    return emb.tolist()

def create_collection(name):
    try:
        return client.create_collection(name=name)
    except Exception:
        return client.get_collection(name=name)

def upsert_chunks(collection_name, chunks):
    """
    chunks: list of {"text", "meta"}
    """
    col = create_collection(collection_name)
    ids = []
    docs = []
    metadatas = []
    embeddings = []
    
    for i, c in enumerate(chunks):
        ids.append(f"{collection_name}-{i}")
        docs.append(c["text"])
        metadatas.append(c["meta"])
        embeddings.append(get_embedding(c["text"]))
        
    col.add(ids=ids, documents=docs, metadatas=metadatas, embeddings=embeddings)

def semantic_search(collection_name, query, top_k=5):
    col = create_collection(collection_name)
    q_emb = get_embedding(query)
    res = col.query(query_embeddings=[q_emb], n_results=top_k, include=["documents","metadatas","distances"])
    
    results = []
    if res["documents"]:
        for d, m, dist in zip(res["documents"][0], res["metadatas"][0], res["distances"][0]):
            results.append({"text": d, "meta": m, "score": dist})
            
    return results