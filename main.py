import json
import httpx
import asyncio
from fastapi import FastAPI, HTTPException
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

# Groq Client setup
client =Groq(api_key=os.environ.get("GROQ_API_KEY"))

def get_deterministic_audit(url: str):
    target_url = url if url.startswith("http") else f"https://{url}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    final_html = ""
    for attempt in range(1, 4):
        try:
            with httpx.Client(timeout=(7.0 + attempt*5), follow_redirects=True, headers=headers) as s:
                r = s.get(target_url)
                if r.status_code == 200 and len(r.text) > 500:
                    final_html = r.text
                    break 
        except Exception:
            continue
            
    if not final_html:
        return None

    soup = BeautifulSoup(final_html, 'html.parser')
    
    # --- DEEP DATA EXTRACTION ---
    text_content = soup.get_text()
    h1_text = soup.find("h1").get_text(strip=True) if soup.find("h1") else "Missing H1"
    links = soup.find_all("a")
    buttons = soup.find_all(["button", "input"], type="submit")
    
    # Count specific signals
    has_h1 = bool(soup.find("h1"))
    has_h2 = bool(soup.find("h2"))
    has_viewport = bool(soup.find("meta", attrs={"name": "viewport"}))
    has_forms = bool(soup.find("form") or soup.find("input", type="email"))
    
    # Calculate Scores
    word_count = len(text_content.split())
    cta_count = len(buttons) + len([l for l in links if "btn" in (l.get("class", []) or [])])

    scores = {
        "conversion_intent": min(int((30 if has_h1 else 0) + (min(cta_count * 15, 45)) + (25 if has_forms else 0)), 100),
        "trust_resonance": min(int((40 if target_url.startswith("https") else 0) + (35 if any(x in text_content.lower() for x in ["trust", "review", "star", "guarantee"]) else 0) + 25), 100),
        "mobile_readiness": min(int((50 if has_viewport else 0) + (50 if word_count < 2000 else 25)), 100),
        "semantic_authority": min(int((20 if len(soup.title.string or "") > 10 else 0) + (40 if has_h1 and has_h2 else 0) + (40 if word_count > 400 else 20)), 100)
    }

    # Package extra data for the AI to make it more detailed
    return {
        "scores": scores, 
        "raw_signals": {
            "h1": h1_text[:100],
            "word_count": word_count,
            "cta_count": cta_count,
            "title": (soup.title.string or "No Title")[:100]
        }
    }

@app.post("/api/v1/analyze")
async def analyze_site(request: AuditRequest):
    data = get_deterministic_audit(request.url)
    if not data:
        raise HTTPException(status_code=500, detail="Capture failed.")

    async def stream_analysis():
        # PHASE 1: Immediate Metrics
        yield json.dumps({"type": "metrics", "scores": data["scores"]}) + "\n"

        # PHASE 2: High-Detail AI Analysis
        # We pass the H1 and Title so the AI can critique the actual copy
        prompt = (
            f"Act as an Elite Conversion Strategist. Audit the site: {request.url}. "
            f"Site Title: '{data['raw_signals']['title']}'. Hero H1: '{data['raw_signals']['h1']}'. "
            f"Metrics: {json.dumps(data['scores'])}. "
            "Return a JSON object with absolute detail (No fluff): "
            "{"
            "  'swot': {"
            "    'strengths': [{'point': '...', 'evidence': 'Detailed proof from HTML/Copy'}],"
            "    'weaknesses': [{'point': '...', 'fix_suggestion': 'Specific technical steps'}],"
            "    'opportunities': [{'point': '...', 'potential_impact': 'Specific ROI/Conversion lift'}],"
            "    'threats': [{'point': '...', 'mitigation_strategy': 'Competitive tactical pivot'}]"
            "  },"
            "  'roadmap': ["
            "    {'task': '...', 'tech_reason': '...', 'psych_impact': 'Identify specific cognitive bias', 'success_metric': 'KPI'}"
            "  ],"
            "  'final_verdict': {"
            "    'overall_readiness': 'ONE_WORD_STATUS',"
            "    'single_most_impactful_change': 'Specific high-leverage move'"
            "  }"
            "}"
        )

        try:
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": "You are a professional CRO Auditor. Return ONLY JSON."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
            )
            
            narrative = json.loads(completion.choices[0].message.content)
            yield json.dumps({"type": "ai_narrative", **narrative}) + "\n"
            
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
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)


