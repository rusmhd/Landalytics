import json
import httpx
import asyncio
import os
import re
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

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


def score_conversion_intent(soup, has_form, has_cta_button, cta_texts):
    score = 0
    if has_form:
        score += 35
    if has_cta_button:
        score += 25
    strong_cta_keywords = ['get started', 'sign up', 'try free', 'buy now', 'book', 'start', 'join', 'subscribe', 'download', 'get']
    for cta in cta_texts:
        for kw in strong_cta_keywords:
            if kw in cta.lower():
                score += 10
                break
    nav_links = len(soup.find_all('a'))
    if 3 <= nav_links <= 8:
        score += 10  # focused navigation
    elif nav_links > 20:
        score -= 5   # too cluttered
    if soup.find(attrs={"class": re.compile(r'hero|banner|jumbotron', re.I)}):
        score += 10
    return min(100, max(5, score))


def score_trust_resonance(soup):
    score = 30  # baseline
    trust_patterns = [
        r'testimonial', r'review', r'rating', r'trust', r'certif', r'award',
        r'partner', r'client', r'guarantee', r'secure', r'ssl', r'verified',
        r'money.back', r'refund', r'privacy'
    ]
    page_text = soup.get_text().lower()
    html_str = str(soup).lower()
    for pattern in trust_patterns:
        if re.search(pattern, html_str):
            score += 5
    # Social proof elements
    if re.search(r'\b\d{3,}[,\d]*\s*(customers?|users?|clients?|companies)', page_text):
        score += 10
    if soup.find(attrs={"class": re.compile(r'logo|partner|client', re.I)}):
        score += 10
    # Security badges
    if re.search(r'ssl|https|secure|encrypt', page_text):
        score += 5
    return min(100, max(5, score))


def score_mobile_readiness(soup):
    score = 0
    viewport_meta = soup.find("meta", attrs={"name": "viewport"})
    if viewport_meta:
        score += 50
        content = viewport_meta.get("content", "")
        if "width=device-width" in content:
            score += 20
        if "initial-scale=1" in content:
            score += 10
    # Responsive CSS hints
    html_str = str(soup).lower()
    if re.search(r'@media|responsive|mobile', html_str):
        score += 10
    if soup.find("meta", attrs={"name": "theme-color"}):
        score += 5
    # Check for AMP
    if soup.find("html", attrs={"amp": True}) or soup.find("html", attrs={"⚡": True}):
        score += 5
    return min(100, max(5, score))


def score_semantic_authority(soup):
    score = 0
    h1_tags = soup.find_all("h1")
    h2_tags = soup.find_all("h2")
    h3_tags = soup.find_all("h3")

    if len(h1_tags) == 1:
        score += 30  # exactly one H1 is ideal
    elif len(h1_tags) > 1:
        score += 10  # multiple H1s — not ideal

    if h2_tags:
        score += 20
    if h3_tags:
        score += 10

    # Meta description
    meta_desc = soup.find("meta", attrs={"name": "description"})
    if meta_desc and meta_desc.get("content"):
        score += 15
        desc_len = len(meta_desc.get("content", ""))
        if 50 <= desc_len <= 160:
            score += 5  # well-optimized length

    # Title tag
    title = soup.find("title")
    if title and title.get_text(strip=True):
        score += 10
        title_len = len(title.get_text(strip=True))
        if 30 <= title_len <= 65:
            score += 5

    # Schema markup
    if soup.find("script", attrs={"type": "application/ld+json"}):
        score += 5

    return min(100, max(5, score))


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

    # Extract signals
    h1_tag = soup.find("h1")
    h1_text = h1_tag.get_text(strip=True) if h1_tag else "No H1 Found"

    title_tag = soup.find("title")
    title_text = title_tag.get_text(strip=True) if title_tag else "No Title"

    meta_desc = soup.find("meta", attrs={"name": "description"})
    meta_desc_text = meta_desc.get("content", "")[:200] if meta_desc else "No meta description"

    has_form = bool(soup.find("form"))

    # CTA detection
    buttons = soup.find_all(["button", "a"], attrs={"class": re.compile(r'btn|button|cta', re.I)})
    all_buttons = soup.find_all("button") + buttons
    cta_texts = [b.get_text(strip=True) for b in all_buttons if b.get_text(strip=True)][:5]
    has_cta_button = len(all_buttons) > 0

    # Count key elements
    images = len(soup.find_all("img"))
    links = len(soup.find_all("a"))
    paragraphs = len(soup.find_all("p"))

    scores = {
        "conversion_intent": score_conversion_intent(soup, has_form, has_cta_button, cta_texts),
        "trust_resonance": score_trust_resonance(soup),
        "mobile_readiness": score_mobile_readiness(soup),
        "semantic_authority": score_semantic_authority(soup),
    }

    raw_signals = {
        "h1": h1_text[:120],
        "title": title_text[:120],
        "meta_description": meta_desc_text,
        "has_form": has_form,
        "cta_texts": cta_texts,
        "image_count": images,
        "link_count": links,
        "paragraph_count": paragraphs,
    }

    return {"scores": scores, "raw_signals": raw_signals}


@app.post("/api/v1/analyze")
async def analyze_site(request: AuditRequest):
    data = get_deterministic_audit(request.url)

    if not data:
        data = {
            "scores": {"conversion_intent": 50, "trust_resonance": 50, "mobile_readiness": 50, "semantic_authority": 50},
            "raw_signals": {"h1": "Restricted Access", "title": "", "meta_description": "", "has_form": False, "cta_texts": [], "image_count": 0, "link_count": 0, "paragraph_count": 0}
        }

    async def stream_analysis():
        try:
            yield json.dumps({"type": "metrics", "scores": data["scores"]}) + "\n"
            await asyncio.sleep(0.1)

            sig = data["raw_signals"]
            prompt = (
                f"You are a senior CRO (Conversion Rate Optimization) expert. Analyze this landing page:\n"
                f"URL: {request.url}\n"
                f"Page Title: {sig.get('title', 'N/A')}\n"
                f"H1 Headline: {sig.get('h1', 'N/A')}\n"
                f"Meta Description: {sig.get('meta_description', 'N/A')}\n"
                f"Has Form: {sig.get('has_form', False)}\n"
                f"CTA Button Texts: {', '.join(sig.get('cta_texts', [])) or 'None detected'}\n"
                f"Images: {sig.get('image_count', 0)}, Links: {sig.get('link_count', 0)}, Paragraphs: {sig.get('paragraph_count', 0)}\n\n"
                f"Scores already computed — Conversion Intent: {data['scores']['conversion_intent']}, "
                f"Trust Resonance: {data['scores']['trust_resonance']}, "
                f"Mobile Readiness: {data['scores']['mobile_readiness']}, "
                f"Semantic Authority: {data['scores']['semantic_authority']}.\n\n"
                "Provide a detailed strategic audit as JSON with EXACTLY these keys:\n"
                "'swot': {\n"
                "  'strengths': [{'point': '...', 'evidence': '...'}] (2-3 items),\n"
                "  'weaknesses': [{'point': '...', 'fix_suggestion': '...'}] (2-3 items),\n"
                "  'opportunities': [{'point': '...', 'potential_impact': '...'}] (2-3 items),\n"
                "  'threats': [{'point': '...', 'mitigation_strategy': '...'}] (2-3 items)\n"
                "},\n"
                "'roadmap': [{'task': '...', 'tech_reason': '...', 'psych_impact': '...', 'success_metric': '...'}] (3 items),\n"
                "'final_verdict': {'overall_readiness': 'one short phrase e.g. STRONG PERFORMER', 'single_most_impactful_change': 'one concrete actionable sentence'}\n"
                "Be specific to this site. No generic advice."
            )

            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0,
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
            "Connection": "keep-alive"
        }
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
