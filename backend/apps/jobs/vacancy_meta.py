from __future__ import annotations

import re
from typing import Tuple

from bs4 import BeautifulSoup

WORK_ONSITE = "onsite"
WORK_REMOTE = "remote"
WORK_HYBRID = "hybrid"

JOB_FULL_TIME = "full_time"
JOB_PART_TIME = "part_time"
JOB_REMOTE = "remote"
JOB_INTERNSHIP = "internship"
JOB_CONTRACT = "contract"


def _norm(s: str) -> str:
    return " ".join(s.lower().split())


def detect_work_type(text: str) -> str:
    if not text:
        return ""
    t = _norm(text)
    if any(x in t for x in ("hybrid", "гибрид")):
        return WORK_HYBRID
    if any(
        x in t
        for x in (
            "remote",
            "удалён",
            "удален",
            "дистанц",
            "work from home",
            "wfh",
            "удаленная работа",
        )
    ):
        return WORK_REMOTE
    if any(
        x in t
        for x in (
            "on-site",
            "on site",
            "in office",
            "in-office",
            "office-based",
            "офис",
            "в офисе",
            "на месте работы",
        )
    ):
        return WORK_ONSITE
    return ""


def detect_job_type(text: str) -> str:
    if not text:
        return ""
    t = _norm(text)
    if any(x in t for x in ("full-time", "full time", "полная занятость")):
        return JOB_FULL_TIME
    if any(x in t for x in ("part-time", "part time", "частичная занятость", "неполная занятость")):
        return JOB_PART_TIME
    if any(x in t for x in ("internship", "intern ", "стажировк", "стажёр", "стажер")):
        return JOB_INTERNSHIP
    if any(
        x in t
        for x in (
            "contract",
            "контракт",
            "проектная работа",
            "проектная занятость",
            "contractor",
            "freelance",
            "фриланс",
        )
    ):
        return JOB_CONTRACT
    if re.search(r"\bremote\b", t) and "remote" == t.strip():
        return JOB_REMOTE
    if re.search(r"\bremote\s+(role|position|job|opportunity)\b", t):
        return JOB_REMOTE
    return ""


def extract_experience_snippet(text: str) -> str:
    if not text:
        return ""
    sample = text[:12000]
    patterns = [
        r"(?:требуемый\s+)?опыт\s+работы\s*[:\s]+([^\n•]+?)(?:\n|•|$)",
        r"(?:experience|work\s+experience)\s*(?:required)?\s*[:\s]+([^\n•]+?)(?:\n|•|$)",
        r"\b(от\s+\d+\s*(?:до\s+)?\d*\s*(?:год|лет|месяц|months?|years?)[^\n•]{0,100})",
        r"\b(\d+\s*[\-+]\s*\d+\s*(?:years?|yrs?)[^\n•]{0,60})",
        r"\b((?:no\s+experience|без\s+опыта)(?:\s+work)?)\b",
    ]
    for pat in patterns:
        m = re.search(pat, sample, re.I | re.MULTILINE)
        if m:
            frag = " ".join(m.group(1).split())
            if frag:
                return frag[:255]
    return ""


def parse_hh_vacancy_meta(detail_soup: BeautifulSoup) -> Tuple[str, str, str]:
    experience = ""
    work_type = ""
    job_type = ""

    for sel in ('[data-qa="vacancy-experience"]', '[data-qa="vacancy-experience-top"]'):
        el = detail_soup.select_one(sel)
        if el:
            experience = " ".join(el.get_text(strip=True).split())[:255]
            break

    emp = detail_soup.select_one('[data-qa="vacancy-view-employment-mode"]')
    if emp:
        job_type = detect_job_type(emp.get_text(" ", strip=True))

    for qa in (
        "vacancy-view-work-mode",
        "vacancy-view-work-schedule",
    ):
        el = detail_soup.select_one(f'[data-qa="{qa}"]')
        if el:
            work_type = detect_work_type(el.get_text(" ", strip=True))
            if work_type:
                break

    blob_parts = []
    sidebar = detail_soup.select_one('[data-qa="vacancy-view-sidebar"]')
    if sidebar:
        blob_parts.append(sidebar.get_text(" ", strip=True))
    desc = detail_soup.select_one('[data-qa="vacancy-description"]')
    if desc:
        blob_parts.append(desc.get_text(" ", strip=True)[:4000])

    blob = " ".join(blob_parts)
    if not experience:
        experience = extract_experience_snippet(blob)
    if not work_type:
        work_type = detect_work_type(blob)
    if not job_type:
        job_type = detect_job_type(blob)

    return experience, work_type, job_type


def parse_linkedin_vacancy_meta(detail_soup: BeautifulSoup) -> Tuple[str, str, str]:
    experience = ""
    work_type = ""
    job_type = ""

    for row in detail_soup.select("li.description__job-criteria-item"):
        spans = row.select("span")
        if len(spans) < 2:
            continue
        label = _norm(spans[0].get_text(strip=True))
        value = spans[1].get_text(strip=True)

        if any(
            x in label
            for x in (
                "seniority",
                "experience level",
                "experience",
                "уровень",
            )
        ):
            if not experience:
                experience = " ".join(value.split())[:255]

        if any(x in label for x in ("job type", "employment", "employment type", "тип занятости")):
            jt = detect_job_type(value)
            if jt:
                job_type = jt
            wt = detect_work_type(value)
            if wt:
                work_type = wt or work_type

        if any(x in label for x in ("remote", "workplace", "on-site", "hybrid", "locat")):
            wt = detect_work_type(value)
            if wt:
                work_type = wt

    blob = detail_soup.get_text(" ", strip=True)[:12000]
    if not experience:
        experience = extract_experience_snippet(blob)
    if not work_type:
        work_type = detect_work_type(blob)
    if not job_type:
        job_type = detect_job_type(blob)

    return experience, work_type, job_type
