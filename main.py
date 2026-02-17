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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class AuditRequest(BaseModel):
    url: str

# Groq Client setup - Ensure GROQ_API_KEY is in Render Environment Variables
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def get_deterministic_audit(url: str):
    target_url = url if url.startswith("http") else f"https://{url}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    final_html = ""
    try:
        # Increased timeout slightly for slower landing pages
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
    
    # Calculate semi-real scores based on basic presence of elements
    has_viewport = bool(soup.find("meta", attrs={"name": "viewport"}))
    has_form = bool(soup.find("form"))
    
    scores = {
        "conversion_intent": 85 if has_form else 40,
        "trust_resonance": 70,
        "mobile_readiness": 95 if has_viewport else 30,
        "semantic_authority": 75 if h1_tag else 20
    }

    return {
        "scores": scores, 
        "raw_signals": {
            "h1": h1_text[:100],
            "title": title_text[:100]
        }
    }

@app.post("/api/v1/analyze")
async def analyze_site(request: AuditRequest):
    # Determine the audit data first
    data = get_deterministic_audit(request.url)
    
    # Safety Fallback: If site blocks us, don't return 404/500. 
    # Return neutral data so the UI doesn't "jump" back.
    if not data:
        data = {
            "scores": {"conversion_intent": 50, "trust_resonance": 50, "mobile_readiness": 50, "semantic_authority": 50},
            "raw_signals": {"h1": "Restricted Access", "title": "Protected Site"}
        }

    async def stream_analysis():
        try:
            # PHASE 1: Send Metrics immediately (The UI needs this to stay on the Report Page)
            yield json.dumps({"type": "metrics", "scores": data["scores"]}) + "\n"
            await asyncio.sleep(0.2) 

            # PHASE 2: AI Detailed Narrative
            prompt = (
                f"Analyze this landing page: {request.url}. "
                f"Headline: {data['raw_signals']['h1']}. "
                "Provide a professional CRO audit in JSON format with 'swot', 'roadmap', and 'final_verdict' keys."
            )
            
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.3
            )
            
            ai_res = json.loads(completion.choices[0].message.content)
            # Combine type with the AI data
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
    # Use environment port for Render compatibility
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
