"""AI-assisted and fallback summarization for vacancy descriptions."""

from __future__ import annotations

import os
import re
from functools import lru_cache
from html import unescape

import requests

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_SUMMARY_MODEL = os.getenv("GEMINI_SUMMARY_MODEL", "gemini-1.5-flash").strip()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
OPENAI_SUMMARY_MODEL = os.getenv("OPENAI_SUMMARY_MODEL", "gpt-4o-mini").strip()


def _clean_text(html_text: str) -> str:
    if not html_text:
        return ""
    text = re.sub(r"<[^>]+>", " ", html_text)
    text = unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _split_sentences(text: str) -> list[str]:
    return [x.strip() for x in re.split(r"(?<=[.!?])\s+", text) if x.strip()]


def _heuristic_summary(text: str, max_items: int = 6) -> list[str]:
    if not text:
        return []

    keywords = (
        "responsibil",
        "require",
        "qualif",
        "must",
        "need",
        "experience",
        "skill",
        "offer",
        "benefit",
        "salary",
        "remote",
        "hybrid",
        "onsite",
        "обязан",
        "требован",
        "услов",
        "опыт",
        "навык",
        "зарплат",
    )

    scored: list[tuple[int, str]] = []
    for sentence in _split_sentences(text):
        s = sentence.strip(" -•")
        if len(s) < 30:
            continue
        if len(s) > 220:
            s = f"{s[:217].rstrip()}..."
        low = s.lower()
        score = 0
        for key in keywords:
            if key in low:
                score += 2
        if re.search(r"\d", low):
            score += 1
        scored.append((score, s))

    if not scored:
        short = text[:220].strip()
        return [short] if short else []

    scored.sort(key=lambda item: item[0], reverse=True)
    seen: set[str] = set()
    out: list[str] = []
    for _, sentence in scored:
        key = re.sub(r"\W+", " ", sentence.lower()).strip()
        if not key or key in seen:
            continue
        seen.add(key)
        out.append(sentence)
        if len(out) >= max_items:
            break
    return out


def _parse_bullets(raw_text: str, max_items: int = 6) -> list[str]:
    lines = [ln.strip() for ln in raw_text.splitlines() if ln.strip()]
    out: list[str] = []
    for line in lines:
        cleaned = re.sub(r"^[-*•\d\).\s]+", "", line).strip()
        if not cleaned:
            continue
        if len(cleaned) > 220:
            cleaned = f"{cleaned[:217].rstrip()}..."
        out.append(cleaned)
        if len(out) >= max_items:
            break
    return out


def _gemini_summary(text: str, max_items: int = 6) -> list[str]:
    if not GEMINI_API_KEY:
        return []
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_SUMMARY_MODEL}:generateContent?key={GEMINI_API_KEY}"
    )
    prompt = (
        f"Extract the {max_items} most important points from this vacancy text. "
        "Prioritize responsibilities, requirements, and working conditions. "
        "Return only short bullet lines, one point per line, no intro.\n\n"
        f"TEXT:\n{text[:8000]}"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2},
    }
    try:
        resp = requests.post(url, json=payload, timeout=15)
        if not resp.ok:
            return []
        data = resp.json()
        candidates = data.get("candidates", [])
        if not candidates:
            return []
        parts = candidates[0].get("content", {}).get("parts", [])
        raw = "\n".join(p.get("text", "") for p in parts if p.get("text")).strip()
        return _parse_bullets(raw, max_items=max_items)
    except Exception:
        return []


def _openai_summary(text: str, max_items: int = 6) -> list[str]:
    if not OPENAI_API_KEY:
        return []
    payload = {
        "model": OPENAI_SUMMARY_MODEL,
        "temperature": 0.2,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You summarize job descriptions into concise key points. "
                    "Return only bullet lines, no intro."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Extract the {max_items} most important points from this vacancy text. "
                    "Prioritize responsibilities, requirements, and conditions. "
                    "Each point must be one short line.\n\n"
                    f"TEXT:\n{text[:8000]}"
                ),
            },
        ],
    }
    try:
        resp = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=15,
        )
        if not resp.ok:
            return []
        data = resp.json()
        content = (
            data.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
            .strip()
        )
        return _parse_bullets(content, max_items=max_items)
    except Exception:
        return []


@lru_cache(maxsize=2048)
def summarize_vacancy_description(raw_description: str, max_items: int = 6) -> tuple[str, ...]:
    text = _clean_text(raw_description or "")
    if not text:
        return tuple()
    gemini = _gemini_summary(text, max_items=max_items)
    if gemini:
        return tuple(gemini)
    ai = _openai_summary(text, max_items=max_items)
    if ai:
        return tuple(ai)
    return tuple(_heuristic_summary(text, max_items=max_items))
