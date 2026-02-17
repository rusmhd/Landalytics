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

# --- INFRASTRUCTURE ---
# This allows your static site to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class AuditRequest(BaseModel):
    url: str

# Groq Client setup - pull from the Web Service Env Var
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def get_deterministic_audit(url: str):
    target_url = url if url.startswith("http") else f"https://{url}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    final_html = ""
    try:
        # 15s timeout to handle slower landing pages
        with httpx.Client(timeout=15.0, follow_redirects=True, headers=headers) as s:
            r = s.get(target_url)
            if r.status_code == 200:
                final_html = r.text
    except Exception as e:
        print(f"Scrape Error: {e}")
            
    if not final_html:
        return None

    soup = BeautifulSoup(final_html, 'html.parser')
    h1_tag = soup.find("h1")
    h1_text = h1_tag.get_text(strip=True) if h1_tag else "No H1 Found"
    title_text = soup.title.string if soup.title else "No Title Found"
    
    # Analyze core metrics
    has_viewport = bool(soup.find("meta", attrs={"name": "viewport"}))
    has_form = bool(soup.find("form"))
    
    scores = {
        "conversion_intent": 85 if has_form else 40,
        "trust_resonance": 72,
        "mobile_readiness": 95 if has_viewport else 35,
        "semantic_authority": 78 if h1_tag else 25
    }

    return {
        "scores": scores, 
        "raw_signals": {
            "h1": h1_text[:100],
            "title": str(title_text)[:100]
        }
    }

@app.post("/api/v1/analyze")
async def analyze_site(request: AuditRequest):
    # Perform the audit first
    data = get_deterministic_audit(request.url)
    
    # Fallback to prevent the frontend from jumping back if scraping is blocked
    if not data:
        data = {
            "scores": {"conversion_intent": 50, "trust_resonance": 50, "mobile_readiness": 50, "semantic_authority": 50},
            "raw_signals": {"h1": "Restricted Access", "title": "Protected Site"}
        }

    async def stream_analysis():
        try:
            # PHASE 1: Send Metrics immediately (Fixes the "jump back" issue)
            yield json.dumps({"type": "metrics", "scores": data["scores"]}) + "\n"
            await asyncio.sleep(0.1) 

            # PHASE 2: AI Detailed Narrative via Groq
            prompt = (
                f"Act as a CRO Expert. Analyze this site: {request.url}. "
                f"Headline: {data['raw_signals']['h1']}. "
                "Provide a detailed audit in JSON with 'swot', 'roadmap', and 'final_verdict' keys."
            )
            
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            
            ai_res = json.loads(completion.choices[0].message.content)
            yield json.dumps({"type": "ai_narrative", **ai_res}) + "\n"
            
        except Exception as e:
            print(f"Streaming Error: {e}")
            yield json.dumps({"type": "error", "msg": "AI Synthesis Interrupted"}) + "\n"

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
    # Important: Render provides the PORT variable automatically
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
