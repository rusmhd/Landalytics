import json
import httpx
import asyncio
import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from bs4 import BeautifulSoup
from groq import Groq

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class AuditRequest(BaseModel):
    url: str

# Groq Client setup - Using environment variable
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def get_deterministic_audit(url: str):
    target_url = url if url.startswith("http") else f"https://{url}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    final_html = ""
    try:
        with httpx.Client(timeout=10.0, follow_redirects=True, headers=headers) as s:
            r = s.get(target_url)
            if r.status_code == 200:
                final_html = r.text
    except Exception as e:
        print(f"Scrape error: {e}")
            
    if not final_html:
        return None

    soup = BeautifulSoup(final_html, 'html.parser')
    text_content = soup.get_text()
    h1_text = soup.find("h1").get_text(strip=True) if soup.find("h1") else "Missing H1"
    
    scores = {
        "conversion_intent": 75, # Simplified for testing
        "trust_resonance": 80,
        "mobile_readiness": 90,
        "semantic_authority": 70
    }

    return {
        "scores": scores, 
        "raw_signals": {
            "h1": h1_text[:100],
            "title": (soup.title.string or "No Title")[:100]
        }
    }

@app.post("/api/v1/analyze")
async def analyze_site(request: AuditRequest):
    data = get_deterministic_audit(request.url)
    
    # Fallback data if scraping fails so the UI doesn't crash
    if not data:
        data = {
            "scores": {"conversion_intent": 50, "trust_resonance": 50, "mobile_readiness": 50, "semantic_authority": 50},
            "raw_signals": {"h1": "Unknown", "title": "Unknown"}
        }

    async def stream_analysis():
        try:
            # 1. Send Metrics
            yield json.dumps({"type": "metrics", "scores": data["scores"]}) + "\n"
            await asyncio.sleep(0.5)

            # 2. AI Narrative
            prompt = f"Audit the site: {request.url}. H1: {data['raw_signals']['h1']}. Return JSON with 'swot', 'roadmap', 'final_verdict'."
            
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            
            ai_res = json.loads(completion.choices[0].message.content)
            yield json.dumps({"type": "ai_narrative", **ai_res}) + "\n"
        except Exception as e:
            yield json.dumps({"type": "error", "msg": str(e)}) + "\n"

    return StreamingResponse(
        stream_analysis(), 
        media_type="application/x-ndjson",
        headers={
            "X-Accel-Buffering": "no",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Encoding": "identity"
        }
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
