import os
import requests
import json

def web_search(query: str, top_k: int = 3):
    print(f"DEBUG: Serper Searching for: '{query}'")
    
    api_key = os.getenv("SERPER_API_KEY")
    if not api_key:
        print("DEBUG: SERPER_API_KEY not found in .env")
        return []

    url = "https://google.serper.dev/search"
    payload = json.dumps({
        "q": query,
        "num": top_k
    })
    headers = {
        'X-API-KEY': api_key,
        'Content-Type': 'application/json'
    }

    try:
        response = requests.request("POST", url, headers=headers, data=payload)
        data = response.json()
        
        out = []
        if "organic" in data:
            for r in data["organic"]:
                out.append({
                    "title": r.get("title", "No Title"),
                    "url": r.get("link", ""),
                    "snippet": r.get("snippet", ""),
                    "date": r.get("date", "Recent")
                })
                
        print(f"DEBUG: Found {len(out)} Serper results.")
        return out

    except Exception as e:
        print(f"DEBUG: Serper API Failed: {e}")
        return []