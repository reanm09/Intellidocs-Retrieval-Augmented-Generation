from embedding_manager import semantic_search
# Import the new function
from llm import generate_answer_stream, generate_search_query 
from web_search import web_search

def run_agent(query, collection_name, mode="discrete", top_k=5):

    retrieved = semantic_search(collection_name, query, top_k=top_k)

    web_sources = []
    if mode.lower() == "hybrid":
        try:

            optimized_query = generate_search_query(query)
            print(f"DEBUG: Rewrote '{query}' -> '{optimized_query}'")
            
            web_sources = web_search(optimized_query, top_k=3)
        except Exception as e:
            print(f"DEBUG: Web search pipeline failed: {e}")
            web_sources = []

    pdf_sources = []
    for item in retrieved:
        text = (item.get("text") or "").strip().replace("\n", " ")
        meta = item.get("meta") or {}
        pdf_sources.append({
            "type": "pdf",
            "page": meta.get("page"),
            "snippet": text[:200]
        })

    stream_gen = generate_answer_stream(
        query=query,
        pdf_chunks=retrieved,
        web_sources=web_sources,
        mode=mode.lower()
    )

    return {
        "stream": stream_gen,
        "sources": {
            "pdf": pdf_sources,
            "web": web_sources
        }
    }
