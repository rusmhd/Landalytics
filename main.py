"""
Landalytics Ultimate — FastAPI Backend
Security: Rate limiting, input validation, OWASP best practices
"""

import json
import httpx
import asyncio
import os
import re
import time
import ipaddress
from collections import defaultdict
from typing import Optional
from urllib.parse import urlparse

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, field_validator, model_validator
from bs4 import BeautifulSoup
from groq import Groq

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Landalytics API",
    docs_url=None,   # OWASP: disable Swagger UI in production
    redoc_url=None,  # OWASP: disable ReDoc in production
)

# ---------------------------------------------------------------------------
# CORS — always allow the known frontend, plus any extras from env var
# ---------------------------------------------------------------------------
_env_origins = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o.strip()]
ALLOWED_ORIGINS = list(set(["https://landalytics-1.onrender.com"] + _env_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
    allow_credentials=False,
)

# ---------------------------------------------------------------------------
# Security headers middleware (OWASP: A05)
# ---------------------------------------------------------------------------
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    # Let CORS preflight OPTIONS pass through untouched
    if request.method == "OPTIONS":
        response = await call_next(request)
        return response
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Cache-Control"] = "no-store"
    # Never expose server internals
    if "server" in response.headers:
        del response.headers["server"]
    return response

# ---------------------------------------------------------------------------
# Rate limiter (OWASP: A04 Insecure Design — throttle abuse)
# Simple in-memory sliding window. Replace with Redis for multi-instance.
# ---------------------------------------------------------------------------
class RateLimiter:
    """
    IP-based sliding-window rate limiter.
    Defaults: 10 requests per 60 seconds per IP.
    """
    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window = window_seconds
        self._store: dict[str, list[float]] = defaultdict(list)

    def is_allowed(self, key: str) -> tuple[bool, int]:
        now = time.time()
        window_start = now - self.window
        timestamps = self._store[key]

        # Evict expired timestamps
        self._store[key] = [t for t in timestamps if t > window_start]

        if len(self._store[key]) >= self.max_requests:
            # Seconds until oldest request expires
            retry_after = int(self._store[key][0] + self.window - now) + 1
            return False, retry_after

        self._store[key].append(now)
        return True, 0

# 10 scans / 60 s per IP — adjust via env vars for flexibility
rate_limiter = RateLimiter(
    max_requests=int(os.environ.get("RATE_LIMIT_MAX", 10)),
    window_seconds=int(os.environ.get("RATE_LIMIT_WINDOW", 60)),
)

def get_client_ip(request: Request) -> str:
    """Extract real client IP, respecting Render's reverse proxy headers."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # X-Forwarded-For can be a comma-separated list; take the first (client)
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

# ---------------------------------------------------------------------------
# Input validation helpers (OWASP: A03 Injection)
# ---------------------------------------------------------------------------

# Allowed goal values — whitelist approach, reject anything else
VALID_GOALS = {
    "ab_testing", "cart_abandonment", "cro", "customer_data_platform",
    "customer_engagement", "cx_optimization", "customer_retention", "feature_rollout",
    "grow_traffic", "landing_page_optimization", "mobile_ab_testing", "multivariate_testing",
    "push_notifications", "server_side_testing", "session_recording", "usability_testing",
    "visitor_behavior", "form_analytics", "heatmaps", "website_optimization",
    "personalization", "website_redesign", "website_surveys",
}

# Blocked private/local network ranges — prevent SSRF (OWASP: A10)
BLOCKED_HOSTS = {"localhost", "127.0.0.1", "0.0.0.0", "::1"}
BLOCKED_SCHEMES = {"file", "ftp", "javascript", "data", "vbscript"}

def is_safe_url(raw_url: str) -> bool:
    """
    SSRF prevention: reject private IPs, loopback, and non-HTTP schemes.
    OWASP: A10 — Server-Side Request Forgery.
    """
    try:
        parsed = urlparse(raw_url if "://" in raw_url else f"https://{raw_url}")

        # Block dangerous schemes
        if parsed.scheme.lower() in BLOCKED_SCHEMES:
            return False

        # Must be http or https
        if parsed.scheme.lower() not in ("http", "https"):
            return False

        host = parsed.hostname or ""

        # Block known local hostnames
        if host.lower() in BLOCKED_HOSTS:
            return False

        # Block private/loopback IP ranges
        try:
            ip = ipaddress.ip_address(host)
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
                return False
        except ValueError:
            pass  # Not an IP — hostname, proceed

        return True
    except Exception:
        return False

# ---------------------------------------------------------------------------
# Request schema with strict validation (OWASP: A03, A08)
# ---------------------------------------------------------------------------
class AuditRequest(BaseModel):
    """
    Strict schema — Pydantic rejects any extra fields automatically.
    All fields are type-checked, length-limited, and whitelisted.
    """
    model_config = {"extra": "forbid"}  # reject unexpected fields

    url: str
    goal: str = "lead_generation"

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("URL must not be empty.")
        if len(v) > 2048:
            raise ValueError("URL exceeds maximum length of 2048 characters.")
        # Basic structure check before SSRF validation
        if not re.match(r'^https?://', v, re.IGNORECASE):
            v = f"https://{v}"
        if not is_safe_url(v):
            raise ValueError("URL is not allowed. Private/local addresses and non-HTTP schemes are blocked.")
        return v

    @field_validator("goal")
    @classmethod
    def validate_goal(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in VALID_GOALS:
            raise ValueError(f"Invalid goal. Must be one of: {', '.join(sorted(VALID_GOALS))}")
        return v

# ---------------------------------------------------------------------------
# API keys — loaded from environment only, never hardcoded (OWASP: A02)
# ---------------------------------------------------------------------------
def _require_env(key: str) -> Optional[str]:
    """Load a required env var. Returns None if missing (logged, not crashed)."""
    val = os.environ.get(key)
    if not val:
        print(f"[WARN] Environment variable '{key}' is not set.")
    return val

GROQ_API_KEY     = _require_env("GROQ_API_KEY")
PAGESPEED_API_KEY = _require_env("PAGESPEED_API_KEY")

# Initialise Groq client — will raise at call-time if key is missing
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# ---------------------------------------------------------------------------
# Goal metadata — 23 goals covering the full CRO/marketing spectrum
# ---------------------------------------------------------------------------
GOAL_LABELS = {
    "ab_testing":               "A/B Testing",
    "cart_abandonment":         "Cart Abandonment",
    "cro":                      "Conversion Rate Optimization",
    "customer_data_platform":   "Customer Data Platform",
    "customer_engagement":      "Customer Engagement",
    "cx_optimization":          "Customer Experience Optimization",
    "customer_retention":       "Customer Retention",
    "feature_rollout":          "Feature Rollout",
    "grow_traffic":             "Grow Website Traffic",
    "landing_page_optimization":"Landing Page Optimization",
    "mobile_ab_testing":        "Mobile App A/B Testing",
    "multivariate_testing":     "Multivariate Testing",
    "push_notifications":       "Push Notifications",
    "server_side_testing":      "Server-Side Testing",
    "session_recording":        "Session Recording",
    "usability_testing":        "Usability Testing",
    "visitor_behavior":         "Visitor Behavior Analysis",
    "form_analytics":           "Web Form Analytics",
    "heatmaps":                 "Website Heatmaps",
    "website_optimization":     "Website Optimization",
    "personalization":          "Website Personalization",
    "website_redesign":         "Website Redesign",
    "website_surveys":          "Website Surveys",
}

GOAL_CONTEXT = {
    "ab_testing":
        "Focus on clarity of test hypothesis, CTA button prominence, headline variation potential, "
        "and whether page elements are isolated enough to be meaningfully tested. Identify elements "
        "most likely to impact conversion when varied (headlines, CTAs, images, social proof).",

    "cart_abandonment":
        "Focus on checkout friction, trust signals at point of purchase, exit-intent triggers, "
        "urgency/scarcity signals, cart visibility, saved cart features, and retargeting hooks. "
        "Identify the exact moments where users are likely to drop off before completing purchase.",

    "cro":
        "Focus on the full conversion funnel — above-fold clarity, value proposition strength, "
        "CTA placement and copy, form friction, trust architecture, social proof density, and "
        "page load performance. Identify the single highest-impact change to improve conversion rate.",

    "customer_data_platform":
        "Focus on data capture mechanisms (forms, sign-ups, cookie consent), privacy compliance signals, "
        "integration touchpoints, and how well the page communicates data value exchange to users. "
        "Identify gaps in first-party data collection and consent UX.",

    "customer_engagement":
        "Focus on interactive elements, content depth, scroll depth triggers, community signals, "
        "comment/feedback mechanisms, newsletter CTAs, and personalisation hooks. "
        "Identify what keeps users engaged beyond the first visit.",

    "cx_optimization":
        "Focus on overall user journey clarity, navigation intuitiveness, support accessibility, "
        "error state handling, loading performance, accessibility compliance, and emotional tone. "
        "Identify friction points that degrade the end-to-end customer experience.",

    "customer_retention":
        "Focus on loyalty signals, member/subscriber benefits visibility, re-engagement CTAs, "
        "account value communication, community belonging cues, and churn-prevention copy. "
        "Identify what would make an existing customer return vs. leave.",

    "feature_rollout":
        "Focus on feature announcement clarity, benefit-led messaging, adoption CTAs, "
        "changelog/update visibility, tutorial or onboarding links, and user education hooks. "
        "Identify how effectively the page communicates the new feature value to existing users.",

    "grow_traffic":
        "Focus on SEO fundamentals — title tag, meta description, heading hierarchy, keyword density, "
        "internal linking, schema markup, content depth, and social sharing signals. "
        "Identify the highest-priority on-page SEO improvements to drive organic traffic growth.",

    "landing_page_optimization":
        "Focus on above-fold impact, headline-CTA alignment, visual hierarchy, form placement, "
        "social proof proximity to CTA, page speed, and message-match with likely traffic sources. "
        "Identify the single change most likely to lift landing page conversion rate.",

    "mobile_ab_testing":
        "Focus on mobile-specific UX — thumb-zone CTA placement, font legibility, tap target sizes, "
        "swipe/scroll behaviour, mobile form friction, and app store deep-link visibility. "
        "Identify elements that should be tested specifically for mobile users.",

    "multivariate_testing":
        "Focus on identifying multiple independent page elements that each have meaningful conversion "
        "impact — headlines, images, CTAs, social proof blocks, pricing displays. "
        "Assess which combinations of changes are worth testing simultaneously.",

    "push_notifications":
        "Focus on opt-in prompt placement and timing, permission request copy, value proposition for "
        "subscribing, notification preference UI, and GDPR/consent compliance. "
        "Identify how to maximise push notification opt-in rates without damaging UX.",

    "server_side_testing":
        "Focus on backend-rendered elements suitable for server-side experiments — pricing logic, "
        "personalisation rules, recommendation algorithms, page variants, and feature flags. "
        "Identify which data-driven decisions would benefit most from controlled server-side testing.",

    "session_recording":
        "Focus on identifying high-friction UX areas — confusing navigation, rage-click zones, "
        "dead clicks, scroll depth drop-offs, and form abandonment points. "
        "Identify the page areas most likely to reveal user confusion in session recordings.",

    "usability_testing":
        "Focus on task completion clarity, navigation discoverability, CTA labelling, error prevention, "
        "cognitive load, and accessibility. Identify the top 3 usability issues a first-time visitor "
        "would encounter trying to complete the page goal.",

    "visitor_behavior":
        "Focus on content hierarchy, scroll-depth signals, click-through patterns, internal link "
        "structure, and engagement hooks. Identify which page sections are likely to get the most "
        "attention and which are likely to be ignored based on layout and content.",

    "form_analytics":
        "Focus on form design, field count, field labelling, validation feedback, progress indicators, "
        "error messaging, and form abandonment triggers. Identify every point of friction in the "
        "form completion journey and rank by likely drop-off impact.",

    "heatmaps":
        "Focus on visual hierarchy, above-fold content density, CTA visibility, image placement, "
        "and whitespace usage. Identify which elements are likely to attract the most clicks and "
        "attention, and which important elements are likely to be missed by users.",

    "website_optimization":
        "Focus on technical performance (speed, mobile, Core Web Vitals signals), content quality, "
        "SEO fundamentals, conversion elements, and overall UX. Provide a holistic audit covering "
        "the most impactful improvements across performance, content, and conversion.",

    "personalization":
        "Focus on dynamic content opportunities, audience segmentation signals, geo/device targeting "
        "hooks, returning visitor recognition, and behavioural trigger points. "
        "Identify where personalised experiences would have the highest conversion impact.",

    "website_redesign":
        "Focus on brand clarity, visual consistency, navigation architecture, content hierarchy, "
        "mobile experience, page speed baseline, and current conversion performance. "
        "Identify what must be preserved, what must be fixed, and what should be reimagined.",

    "website_surveys":
        "Focus on survey trigger placement, exit-intent opportunities, post-conversion survey hooks, "
        "NPS/CSAT signal collection points, and non-intrusive feedback mechanisms. "
        "Identify the optimal moments and placements to collect user feedback without hurting conversion.",
}

# ---------------------------------------------------------------------------
# PageSpeed Insights
# ---------------------------------------------------------------------------
def get_pagespeed_score(url: str) -> Optional[int]:
    """
    Fetch Google PageSpeed mobile performance score (0–100).
    Returns None silently if the API key is missing or the call fails.
    Key is read from environment only — never exposed to the client.
    """
    if not PAGESPEED_API_KEY:
        return None
    try:
        # Sanitise URL for the query parameter
        target = url if url.startswith("http") else f"https://{url}"
        ps_url = (
            "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
            f"?url={target}&strategy=mobile&key={PAGESPEED_API_KEY}"
        )
        with httpx.Client(timeout=20.0) as c:
            r = c.get(ps_url)
            if r.status_code == 200:
                data = r.json()
                score = (
                    data
                    .get("lighthouseResult", {})
                    .get("categories", {})
                    .get("performance", {})
                    .get("score")
                )
                if score is not None:
                    return int(score * 100)
    except Exception as e:
        print(f"[PageSpeed error] {e}")
    return None

# ---------------------------------------------------------------------------
# Scraper — uses Jina AI Reader to bypass Render free-tier network restrictions.
# Jina fetches and renders the page on their servers, returning clean markdown.
# SSRF is already prevented at the validation layer before this is called.
# ---------------------------------------------------------------------------
def scrape_page(url: str) -> str:
    """
    Fetch page content via Jina AI Reader (r.jina.ai).
    Returns clean markdown text — handles JS-rendered pages automatically.
    Falls back to empty string on failure so the audit degrades gracefully.
    """
    jina_url = f"https://r.jina.ai/{url}"
    headers = {
        "Accept": "text/plain",
        "User-Agent": "Landalytics/1.0",
        # Request extended metadata (title, description) in the response
        "X-Return-Format": "markdown",
    }
    try:
        with httpx.Client(timeout=25.0, follow_redirects=True, max_redirects=3) as client:
            r = client.get(jina_url, headers=headers)
            if r.status_code == 200:
                # Cap at 1MB — markdown is much denser than raw HTML
                return r.text[:1_000_000]
            print(f"[Jina error] status {r.status_code}")
    except Exception as e:
        print(f"[Jina error] {e}")
    return ""

# ---------------------------------------------------------------------------
# Signal extraction — parses Jina markdown instead of raw HTML.
# Jina returns structured markdown so we use regex patterns rather than
# BeautifulSoup HTML parsing.
# ---------------------------------------------------------------------------
def extract_signals(markdown: str) -> dict:
    """
    Extract CRO-relevant signals from Jina markdown output.
    Jina formats the page as clean markdown with headings, links, and body text.
    """
    if not markdown:
        return {
            "h1": "No Content", "h2s": [], "h3s": [], "title": "",
            "meta_description": "", "body_copy": "", "cta_texts": [],
            "img_count": 0, "alt_texts": [], "has_form": False,
            "input_types": [], "nav_links": [], "total_links": 0,
            "has_schema": False, "has_viewport": True,  # assume mobile-ready if Jina fetched it
            "viewport_content": "width=device-width, initial-scale=1",
            "page_text": "",
        }

    lines = markdown.split("\n")
    text_lower = markdown.lower()

    # ── Title & meta — Jina puts these at the very top as "Title: ..." / "Description: ..."
    # Try multiple patterns since Jina's format varies slightly
    title_text = ""
    for pat in [r"^Title:\s*(.+)$", r"^# (.+)$"]:
        m = re.search(pat, markdown, re.MULTILINE | re.IGNORECASE)
        if m:
            candidate = m.group(1).strip()[:120]
            # Skip if it looks like a nav item or very short
            if len(candidate) > 5:
                title_text = candidate
                break

    meta_desc_txt = ""
    for pat in [r"^Description:\s*(.+)$", r"^Meta[- ]?Description:\s*(.+)$", r"^URL Source:.+\nMarkdown Content:\s*\n+(.{80,200})"]:
        m = re.search(pat, markdown, re.MULTILINE | re.IGNORECASE)
        if m:
            meta_desc_txt = m.group(1).strip()[:200]
            break

    # ── Headings ─────────────────────────────────────────────────────────────
    # Jina uses standard markdown: # H1, ## H2, ### H3
    h1_lines  = [l.lstrip("# ").strip()[:120] for l in lines if l.startswith("# ")  and not l.startswith("## ")]
    h2_lines  = [l.lstrip("# ").strip()[:80]  for l in lines if l.startswith("## ") and not l.startswith("### ")]
    h3_lines  = [l.lstrip("# ").strip()[:80]  for l in lines if l.startswith("### ")]
    h1_text   = h1_lines[0] if h1_lines else (title_text if title_text else "No H1 Found")

    # If title still empty, fall back to h1
    if not title_text and h1_text != "No H1 Found":
        title_text = h1_text

    # ── Body copy — meaningful non-heading lines ──────────────────────────────
    body_lines = [
        l.strip() for l in lines
        if l.strip()
        and not l.startswith("#")
        and not l.startswith("[")
        and not l.startswith("!")
        and len(l.strip()) > 40
    ][:5]
    body_copy = " | ".join(body_lines)[:600]

    # ── Links / CTAs — markdown links: [text](url) ───────────────────────────
    link_texts  = re.findall(r'\[([^\]]{2,40})\]\(https?://[^\)]+\)', markdown)
    cta_texts   = list(set(link_texts))[:8]
    total_links = len(re.findall(r'\]\(https?://', markdown))

    # ── Images — markdown images: ![alt](url) ────────────────────────────────
    img_alts  = re.findall(r'!\[([^\]]{1,80})\]', markdown)
    img_count = len(img_alts)
    alt_texts = [a.strip() for a in img_alts if a.strip()][:5]

    # ── Form detection — look for form-related keywords in the text ──────────
    form_kws  = ["subscribe", "sign up", "email", "submit", "get started", "name", "phone", "contact"]
    has_form  = sum(1 for kw in form_kws if kw in text_lower) >= 2
    # Infer input types from context
    input_types = []
    if "email" in text_lower:   input_types.append("email")
    if "phone" in text_lower:   input_types.append("tel")
    if "name" in text_lower:    input_types.append("text")
    if "password" in text_lower: input_types.append("password")

    # ── Nav links — first cluster of short links at top of doc ───────────────
    nav_pattern = re.findall(r'\[([^\]]{2,30})\]\(', markdown[:1500])
    nav_links   = list(set(nav_pattern))[:8]

    # ── Trust / schema signals — inferred from text ───────────────────────────
    has_schema   = bool(re.search(r'application/ld\+json|schema\.org', markdown, re.IGNORECASE))
    # Jina-rendered pages are always viewport-aware (it uses a headless browser)
    has_viewport    = True
    viewport_content = "width=device-width, initial-scale=1"

    return {
        "h1": h1_text,
        "h2s": h2_lines[:5],
        "h3s": h3_lines[:5],
        "title": title_text,
        "meta_description": meta_desc_txt,
        "body_copy": body_copy,
        "cta_texts": cta_texts,
        "img_count": img_count,
        "alt_texts": alt_texts,
        "has_form": has_form,
        "input_types": input_types,
        "nav_links": nav_links,
        "total_links": total_links,
        "has_schema": has_schema,
        "has_viewport": has_viewport,
        "viewport_content": viewport_content,
        "page_text": text_lower[:2000],
    }

# ---------------------------------------------------------------------------
# Scoring functions
# ---------------------------------------------------------------------------
def score_https_ssl(url: str) -> int:
    # HTTPS presence - secure = 90, insecure = 10
    return 90 if url.startswith("https://") else 10

def score_title_tag(sig: dict) -> int:
    # Title tag quality - length, presence, structure
    title = sig.get("title", "")
    if not title:
        return 25  # missing but not catastrophic - Jina may not have captured it
    score = 40
    length = len(title)
    if 30 <= length <= 60:
        score += 35
    elif 20 <= length < 30 or 60 < length <= 70:
        score += 20
    else:
        score += 10
    if any(sep in title for sep in ["|", "-", ":"]):
        score += 15
    if title.lower().strip() in ["home", "welcome", "untitled", "index"]:
        score -= 20
    return min(100, max(5, score))

def score_heading_hierarchy(sig: dict) -> int:
    # H1-H3 structure depth
    score = 20  # base - JS sites may not expose headings to Jina
    if sig.get("h1") and sig["h1"] != "No H1 Found":
        score += 35
    if sig.get("h2s"):
        score += 25
        if len(sig["h2s"]) >= 3:
            score += 10
    if sig.get("h3s"):
        score += 10
    return min(100, max(5, score))

def score_content_depth(sig: dict) -> int:
    # Word count and structural richness
    page_text = sig.get("page_text", "")
    word_count = len(page_text.split())
    score = 0
    if word_count >= 800:   score += 50
    elif word_count >= 400: score += 35
    elif word_count >= 200: score += 20
    elif word_count >= 100: score += 10
    else:                   score += 2
    heading_count = len(sig.get("h2s", [])) + len(sig.get("h3s", []))
    score += min(30, heading_count * 6)
    if sig.get("body_copy"):
        score += 20
    return min(100, max(5, score))

def score_schema_markup(sig: dict) -> int:
    # Structured data presence
    if sig.get("has_schema"):
        return 90
    pt = sig.get("page_text", "")
    if re.search(r"schema\.org|ld\+json|itemtype", pt):
        return 70
    # Known well-established sites likely have schema even if Jina doesn't capture it
    # Floor raised since JS-rendered schema is invisible to markdown parsers
    return 30

def score_readability(sig: dict) -> int:
    # Sentence length and scannability
    body = sig.get("body_copy", "")
    if not body:
        return 20
    score = 30
    sentences = re.split(r"[.!?]+", body)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
    if sentences:
        avg_words = sum(len(s.split()) for s in sentences) / len(sentences)
        if avg_words <= 15:   score += 40
        elif avg_words <= 20: score += 30
        elif avg_words <= 25: score += 15
        else:                 score += 5
    para_count = len([l for l in body.split("|") if l.strip()])
    score += min(20, para_count * 5)
    if len(body) > 400 and "|" not in body:
        score -= 10
    return min(100, max(5, score))

def score_meta_description(sig: dict) -> int:
    # Meta description - presence, length, and copy quality
    meta = sig.get("meta_description", "")
    if not meta:
        return 20  # missing but Jina may not have captured it from JS-rendered pages
    score = 30
    length = len(meta)
    if 120 <= length <= 160:
        score += 40  # ideal length for SERPs
    elif 80 <= length < 120:
        score += 25
    elif 0 < length < 80:
        score += 10
    # Reward action words that improve CTR
    action_words = ["learn", "discover", "get", "find", "try", "start", "boost", "improve", "save", "free"]
    matches = sum(1 for w in action_words if w in meta.lower())
    score += min(30, matches * 8)
    return min(100, max(5, score))

def score_image_alt_text(sig: dict) -> int:
    # Alt text coverage ratio - how many images have descriptive alt text
    img_count = sig.get("img_count", 0)
    alt_texts = sig.get("alt_texts", [])
    if img_count == 0:
        return 50  # no images detected - neutral score
    coverage = len(alt_texts) / img_count
    if coverage >= 0.9:   return 90
    elif coverage >= 0.7: return 70
    elif coverage >= 0.5: return 55
    elif coverage >= 0.3: return 40
    elif coverage >= 0.1: return 30
    else:                 return 20  # floor raised - Jina may strip img metadata

def score_internal_links(sig: dict) -> int:
    # Internal link structure - quantity and nav depth
    total_links = sig.get("total_links", 0)
    nav_links = sig.get("nav_links", [])
    score = 0
    # Healthy internal link count
    if total_links >= 10:   score += 35
    elif total_links >= 5:  score += 25
    elif total_links >= 2:  score += 15
    else:                   score += 5
    # Nav links indicate proper site structure
    if len(nav_links) >= 5:   score += 35
    elif len(nav_links) >= 3: score += 25
    elif len(nav_links) >= 1: score += 15
    # Penalise too many links - could dilute page authority
    if total_links > 100:
        score -= 15
    return min(100, max(5, score))

def score_keyword_placement(sig: dict) -> int:
    # Keyword prominence in key positions: H1, title, first paragraph
    score = 20  # base
    h1 = sig.get("h1", "").lower()
    title = sig.get("title", "").lower()
    body = sig.get("body_copy", "").lower()
    # Extract candidate keywords from H1 (most authoritative)
    h1_words = set(w for w in h1.split() if len(w) > 4)
    if not h1_words:
        return score
    # Check how many H1 keywords appear in title
    title_matches = sum(1 for w in h1_words if w in title)
    score += min(30, title_matches * 10)
    # Check H1 keywords in body copy opening
    body_start = body[:200]
    body_matches = sum(1 for w in h1_words if w in body_start)
    score += min(30, body_matches * 8)
    # Reward alignment between title and H1
    if h1_words and any(w in title for w in h1_words):
        score += 20
    return min(100, max(5, score))

def score_multimedia(sig: dict) -> int:
    # Multimedia usage - images, videos, visual content signals
    img_count = sig.get("img_count", 0)
    page_text = sig.get("page_text", "")
    score = 0
    # Image count tiers
    if img_count >= 5:    score += 40
    elif img_count >= 3:  score += 30
    elif img_count >= 1:  score += 20
    else:                 score += 0
    # Video signals in page text
    if re.search(r"video|youtube|vimeo|wistia|loom|webinar|watch", page_text):
        score += 30
    # Infographic or chart signals
    if re.search(r"infographic|chart|graph|diagram|illustration", page_text):
        score += 20
    # Interactive elements
    if re.search(r"calculator|quiz|tool|interactive|demo", page_text):
        score += 10
    return min(100, max(5, score))

def score_search_intent(sig: dict, goal: str) -> int:
    # Search intent match - content alignment with the stated page goal
    page_text = sig.get("page_text", "")
    h1 = sig.get("h1", "").lower()
    body = sig.get("body_copy", "").lower()
    combined = page_text + " " + h1 + " " + body

    # Goal-specific intent keywords
    intent_keywords = {
        "lead_generation": ["free", "download", "guide", "ebook", "checklist", "template", "webinar", "form", "subscribe", "contact"],
        "saas_trial":      ["free trial", "sign up", "get started", "no credit card", "14 day", "30 day", "demo", "software", "platform", "dashboard"],
        "ecommerce":       ["buy", "shop", "price", "cart", "checkout", "shipping", "order", "product", "discount", "sale"],
        "newsletter":      ["subscribe", "newsletter", "weekly", "updates", "join", "community", "inbox", "tips", "insights"],
        "book_demo":       ["demo", "schedule", "calendar", "meeting", "call", "book", "talk to", "sales", "expert", "consultation"],
        "app_download":    ["download", "app store", "google play", "install", "ios", "android", "mobile app", "get the app"],
    }
    keywords = intent_keywords.get(goal, [])
    if not keywords:
        return 50
    matches = sum(1 for kw in keywords if kw in combined)
    score = min(100, max(5, 10 + (matches * 9)))
    return score

def score_conversion_intent(sig: dict, goal: str) -> int:
    # Base of 20 — Jina-rendered pages likely have some CTA even if not captured
    score = 20
    cta_texts, total_links = sig["cta_texts"], sig["total_links"]

    if sig["has_form"]:
        score += 25
        visible_inputs = [i for i in sig["input_types"] if i not in ("hidden", "submit")]
        if len(visible_inputs) <= 3:
            score += 10

    strong_kws = ["get started","sign up","try free","buy now","book","start","join",
                  "subscribe","download","get","request","claim","access"]
    matched = sum(1 for cta in cta_texts for kw in strong_kws if kw in cta.lower())
    score += min(25, matched * 8)

    # Also scan page_text for CTA keywords — catches JS-rendered buttons
    matched_text = sum(1 for kw in strong_kws if kw in sig["page_text"])
    score += min(15, matched_text * 3)

    goal_signals = {
        "cart_abandonment":  ["cart","checkout","add to cart","buy","order","payment","abandon"],
        "cro":               ["get started","sign up","try","buy","convert","cta","optimize"],
        "grow_traffic":      ["read","blog","article","guide","learn","seo","search","traffic"],
        "landing_page_optimization": ["get started","sign up","try free","download","claim","access"],
        "mobile_ab_testing": ["app","download","install","mobile","ios","android"],
        "customer_retention":["login","account","member","loyalty","reward","renew","subscription"],
        "form_analytics":    ["form","submit","name","email","phone","contact","request"],
        "heatmaps":          ["click","scroll","view","watch","explore","discover"],
        "personalization":   ["for you","recommended","tailored","custom","based on","personal"],
        "push_notifications":["subscribe","notify","allow","enable","opt in","permission"],
        "website_surveys":   ["feedback","survey","rate","review","opinion","tell us","nps"],
    }
    if goal in goal_signals and any(w in sig["page_text"] for w in goal_signals[goal]):
        score += 15

    score += 5 if total_links >= 3 else 0
    return min(100, max(5, score))

def score_trust_resonance(sig: dict) -> int:
    # Base of 30 — most legitimate sites have some trust signals
    score = 30
    pt = sig["page_text"]
    trust_patterns = ["testimonial","review","rating","trust","certif","award","partner","client",
                      "guarantee","secure","ssl","verified","money back","refund","privacy","gdpr",
                      "compliance","iso","soc","hipaa","pci"]
    score += sum(4 for p in trust_patterns if re.search(p, pt))
    if re.search(r"\d{3,}[,\d]*\s*(customers?|users?|clients?|companies|brands?)", pt):
        score += 12
    if sig["has_schema"]:          score += 8
    if len(sig["alt_texts"]) > 2:  score += 5
    if re.search(r"ssl|https|secure|encrypt", pt): score += 5
    return min(100, max(5, score))

def score_mobile_readiness(sig: dict, page_speed: Optional[int]) -> int:
    # Real PageSpeed data takes priority
    if page_speed is not None:
        return page_speed
    # Jina always sets has_viewport=True so base is already high
    score = 50
    if sig["has_viewport"]:
        score += 20
        if "width=device-width" in sig["viewport_content"]: score += 15
        if "initial-scale=1"    in sig["viewport_content"]: score += 10
    if re.search(r"@media|responsive|mobile", sig["page_text"]): score += 5
    return min(100, max(5, score))

def score_semantic_authority(sig: dict) -> int:
    # Base of 25 — JS sites have semantic structure even if Jina cant fully parse it
    score = 25
    if sig["h1"] and sig["h1"] != "No H1 Found": score += 25
    if sig["h2s"]: score += 18
    if sig["h3s"]: score += 8
    if sig["meta_description"]:
        score += 12
        if 50 <= len(sig["meta_description"]) <= 160: score += 6
    if sig["title"]:
        score += 8
        if 30 <= len(sig["title"]) <= 65: score += 6
    if sig["has_schema"]: score += 10
    # Extra: if page_text has substantial content, it signals good semantic structure
    word_count = len(sig.get("page_text","").split())
    if word_count > 300: score += 5
    return min(100, max(5, score))

# ---------------------------------------------------------------------------
# Main endpoint
# ---------------------------------------------------------------------------
@app.post("/api/v1/analyze")
async def analyze_site(request: Request, body: AuditRequest):
    """
    Analyze a landing page and stream back metrics + AI narrative.
    Protected by: rate limiting, input validation, SSRF prevention.
    """
    # ── Rate limiting (OWASP: A04) ─────────────────────────────────────────
    client_ip = get_client_ip(request)
    allowed, retry_after = rate_limiter.is_allowed(client_ip)
    if not allowed:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"error": "Too many requests. Please slow down."},
            headers={"Retry-After": str(retry_after)},
        )

    # ── Guard: Groq client must be configured ──────────────────────────────
    if not groq_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is not configured. Contact the administrator.",
        )

    goal       = body.goal
    goal_label = GOAL_LABELS.get(goal, "Lead Generation")
    goal_ctx   = GOAL_CONTEXT.get(goal, "")
    url        = body.url  # already validated & sanitised

    # ── Scrape + PageSpeed concurrently ────────────────────────────────────
    loop = asyncio.get_event_loop()
    html, page_speed = await asyncio.gather(
        loop.run_in_executor(None, scrape_page, url),
        loop.run_in_executor(None, get_pagespeed_score, url),
    )

    # Fallback signals if scrape fails
    EMPTY_SIG = {
        "h1": "Restricted Access", "h2s": [], "h3s": [], "title": "",
        "meta_description": "", "body_copy": "", "cta_texts": [],
        "img_count": 0, "alt_texts": [], "has_form": False,
        "input_types": [], "nav_links": [], "total_links": 0,
        "has_schema": False, "has_viewport": False,
        "viewport_content": "", "page_text": "",
    }
    sig = extract_signals(html) if html else EMPTY_SIG

    scores: dict = {
        # Core gauges
        "conversion_intent":  score_conversion_intent(sig, goal),
        "trust_resonance":    score_trust_resonance(sig),
        "mobile_readiness":   score_mobile_readiness(sig, page_speed),
        "semantic_authority": score_semantic_authority(sig),
        # Deep node scan - 12 nodes
        "https_ssl":          score_https_ssl(url),
        "title_tag":          score_title_tag(sig),
        "heading_hierarchy":  score_heading_hierarchy(sig),
        "content_depth":      score_content_depth(sig),
        "schema_markup":      score_schema_markup(sig),
        "readability":        score_readability(sig),
        "meta_description":   score_meta_description(sig),
        "image_alt_text":     score_image_alt_text(sig),
        "internal_links":     score_internal_links(sig),
        "keyword_placement":  score_keyword_placement(sig),
        "multimedia":         score_multimedia(sig),
        "search_intent":      score_search_intent(sig, goal),
    }
    if page_speed is not None:
        scores["page_speed"] = page_speed

    async def stream():
        try:
            # Phase 1: emit metrics immediately for instant UI update
            yield json.dumps({"type": "metrics", "scores": scores}) + "\n"
            await asyncio.sleep(0.1)

            # Phase 2: AI narrative — sanitise user-derived strings going into prompt
            # (belt-and-suspenders: Groq already treats content as data, not code,
            #  but we strip control characters to be safe)
            def clean(s: str) -> str:
                return re.sub(r'[\x00-\x1f\x7f]', '', str(s))[:500]

            prompt = (
                f"You are a senior CRO expert. Analyze this landing page for the goal: {goal_label}.\n"
                f"{goal_ctx}\n\n"
                f"URL: {clean(url)}\n"
                f"Page Title: {clean(sig['title']) or 'N/A'}\n"
                f"H1: {clean(sig['h1'])}\n"
                f"H2s: {clean(', '.join(sig['h2s'])) or 'None'}\n"
                f"Meta Description: {clean(sig['meta_description']) or 'None'}\n"
                f"Body Copy: {clean(sig['body_copy'][:400]) or 'N/A'}\n"
                f"CTAs: {clean(', '.join(sig['cta_texts'])) or 'None'}\n"
                f"Nav Links: {clean(', '.join(sig['nav_links'])) or 'None'}\n"
                f"Images: {sig['img_count']} (alt texts: {clean(', '.join(sig['alt_texts'][:3])) or 'missing'})\n"
                f"Has Form: {sig['has_form']} | Schema Markup: {sig['has_schema']}\n"
                f"Scores — Conversion: {scores['conversion_intent']}, Trust: {scores['trust_resonance']}, "
                f"Mobile: {scores['mobile_readiness']}, Semantic: {scores['semantic_authority']}"
                + (f", PageSpeed: {page_speed}" if page_speed else "") + "\n\n"
                "Return JSON with EXACTLY these keys:\n"
                '"swot": {"strengths":[{"point":"...","evidence":"..."}],'
                '"weaknesses":[{"point":"...","fix_suggestion":"..."}],'
                '"opportunities":[{"point":"...","potential_impact":"..."}],'
                '"threats":[{"point":"...","mitigation_strategy":"..."}]},'
                '"roadmap":[{"task":"...","tech_reason":"...","psych_impact":"...","success_metric":"..."}],'
                '"final_verdict":{"overall_readiness":"short phrase","single_most_impactful_change":"one sentence"}\n\n'
                f"Be specific to this site and its {goal_label} goal. No generic advice."
            )

            completion = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0,
            )
            ai_res = json.loads(completion.choices[0].message.content)
            yield json.dumps({"type": "ai_narrative", **ai_res}) + "\n"

        except Exception as e:
            # Never leak internal error details to the client (OWASP: A09)
            print(f"[Stream error] {e}")
            yield json.dumps({"type": "error", "msg": "Analysis failed. Please try again."}) + "\n"

    return StreamingResponse(
        stream(),
        media_type="application/x-ndjson",
        headers={
            "X-Accel-Buffering": "no",
            "Cache-Control": "no-store",
            "Connection": "keep-alive",
        },
    )

# ---------------------------------------------------------------------------
# Validation error handler — clean 422 responses (OWASP: A09)
# ---------------------------------------------------------------------------
from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    """Return a clean, user-friendly error without exposing internal schema."""
    errors = [
        {"field": ".".join(str(l) for l in e["loc"][1:]), "message": e["msg"]}
        for e in exc.errors()
    ]
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"error": "Invalid request.", "details": errors},
    )

# ---------------------------------------------------------------------------
# Health check — no sensitive data exposed
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    return {"status": "ok"}

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
