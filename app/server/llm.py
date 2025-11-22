import os 
import textwrap
import google.generativeai as genai

KEY = os.getenv("GEMINI_API_KEY")
print(f"DEBUG: Gemini API Key found? {'Yes' if KEY else 'No'}")

if KEY:
    try:
        genai.configure(api_key=KEY)
    except Exception as e:
        print(f"DEBUG: Gemini configuration failed: {e}")

_OLLAMA_AVAILABLE = False
try:
    import ollama
    _OLLAMA_AVAILABLE = True
except Exception:
    _OLLAMA_AVAILABLE = False

def _truncate_tokens(s: str, max_chars: int = 12000) -> str:
    if not s: return ""
    return s[:max_chars]

def generate_search_query(user_query: str) -> str:

    prompt = f"""
    You are a Search Engine Optimization (SEO) expert.
    Convert the following User Question into a concise, effective Google Search Query.
    
    Rules:
    1. Remove conversational filler ("Can you tell me", "I was wondering").
    2. Remove references to local context ("this document", "the resume", specific personal names like "Adithya").
    3. Focus on the EXTERNAL facts, technologies, or definitions needed to answer the question.
    4. Return ONLY the search query string. No quotes.

    User Question: "{user_query}"
    Search Query:
    """
    
    if KEY:
        try:
            model_name = _get_working_model()
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"DEBUG: Query rewrite failed: {e}")
    
    return user_query

def _format_prompt(query: str, pdf_chunks: list, web_sources: list | None, mode: str) -> str:
    MAX_CHUNKS = 10             
    MAX_CHARS_PER_CHUNK = 1500   
    MAX_USER_BLOCK = 20000      

    chunk_blocks = []
    for i, ch in enumerate(pdf_chunks[:MAX_CHUNKS], 1):
        meta = ch.get("meta") or {}
        page = meta.get("page", "?")
        text = (ch.get("text") or "").strip()
        if text:
            chunk_blocks.append(f"[Page {page}]:\n{text}")

    chunks_joined = "\n\n".join(chunk_blocks) if chunk_blocks else "[No relevant PDF text found]"

    web_block = ""
    if mode.lower() == "hybrid" and web_sources:
        w_lines = []
        for j, w in enumerate(web_sources, 1):
            title = (w.get("title") or "Web Source").strip()
            url = (w.get("url") or "").strip()
            snip = (w.get("snippet") or "").strip().replace("\n", " ")
            w_lines.append(f"[Web {j}] {title} ({url}): {snip}")
        web_block = "\n\nWeb Sources:\n" + "\n".join(w_lines)

    system = textwrap.dedent("""
    You are an expert technical analyst. Answer the user's question using the provided context.
    
    Formatting Rules:
    - Use **Markdown** formatting (bolding, bullets).
    - Explain code logic if present, don't just repeat it.
    - Cite information using [Page X] or [Web X] format.
    - If the answer is not in the context, say "I cannot find that information."
    """).strip()

    user = textwrap.dedent(f"""
    USER QUERY: {query}

    DOCUMENT CONTEXT:
    {chunks_joined}

    {web_block}
    """).strip()

    return f"{system}\n\n{_truncate_tokens(user, MAX_USER_BLOCK)}"

def _get_working_model():
    if not KEY: return None
    try:
        available_models = []
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                available_models.append(m.name)
        
        for priority in ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']:
            for m in available_models:
                if priority in m: return m
        
        if available_models: return available_models[0]
            
    except Exception as e:
        print(f"DEBUG: Failed to list models: {e}")
    return "gemini-pro" 

def generate_answer_stream(query: str, pdf_chunks: list, web_sources: list | None, mode: str = "discrete"):
    prompt = _format_prompt(query, pdf_chunks, web_sources, mode)

    if KEY:
        try:
            model_name = _get_working_model()
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt, stream=True)
            for chunk in response:
                if chunk.text:
                    yield chunk.text
            return 
        except Exception as e:
            print(f"DEBUG: Gemini stream failed: {e}")

    if _OLLAMA_AVAILABLE:
        try:
            stream = ollama.chat(
                model="llama3",
                messages=[{'role': 'user', 'content': prompt}],
                stream=True
            )
            for chunk in stream:
                yield chunk['message']['content']
            return
        except Exception:
            pass

    yield "DEBUG: All AI models failed. Please check server logs."