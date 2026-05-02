import re

from django.utils.html import strip_tags


_WHITESPACE_RE = re.compile(r"\s+")


def sanitize_plain_text(value: str) -> str:
    cleaned = strip_tags((value or "").strip())
    return _WHITESPACE_RE.sub(" ", cleaned).strip()
