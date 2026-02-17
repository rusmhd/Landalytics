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

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def get_deterministic_audit(url: str):
    target_url = url if url.startswith("http") else f"https://{url}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    final_html = ""
    try:
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
    
    has_viewport = bool(soup.find("meta", attrs={"name": "viewport"}))
    has_form = bool(soup.find("form"))
    
    # Core Scored Metrics
    scores = {
        "conversion_intent": 85 if has_form else 40,
        "trust_resonance": 72,
        "mobile_readiness": 95 if has_viewport else 35,
        "semantic_authority": 78 if h1_tag else 25
    }

    return {
        "scores": scores, 
        "raw_signals": {"h1": h1_text[:100]}
    }

@app.post("/api/v1/analyze")
async def analyze_site(request: AuditRequest):
    data = get_deterministic_audit(request.url)
    
    if not data:
        data = {
            "scores": {"conversion_intent": 50, "trust_resonance": 50, "mobile_readiness": 50, "semantic_authority": 50},
            "raw_signals": {"h1": "Restricted Access"}
        }

    async def stream_analysis():
        try:
            # PHASE 1: Send Metrics immediately
            yield json.dumps({"type": "metrics", "scores": data["scores"]}) + "\n"
            await asyncio.sleep(0.1) 

            # PHASE 2: AI Detailed Narrative
            prompt = (
                f"Act as a CRO Expert. Analyze this site: {request.url}. Headline: {data['raw_signals']['h1']}. "
                "Provide an audit in JSON with EXACTLY these keys: "
                "'swot': {'strengths': [{'point': '...', 'evidence': '...'}], 'weaknesses': [{'point': '...', 'fix_suggestion': '...'}], "
                "'opportunities': [{'point': '...', 'potential_impact': '...'}], 'threats': [{'point': '...', 'mitigation_strategy': '...'}]}, "
                "'roadmap': [{'task': '...', 'tech_reason': '...', 'psych_impact': '...', 'success_metric': '...'}], "
                "'final_verdict': {'overall_readiness': '...', 'single_most_impactful_change': '...'}"
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
            yield json.dumps({"type": "error", "msg": str(e)}) + "\n"

    return StreamingResponse(
        stream_analysis(), 
        media_type="application/x-ndjson",
        headers={
            "X-Accel-Buffering": "no",  # Prevents Render from buffering the stream
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
