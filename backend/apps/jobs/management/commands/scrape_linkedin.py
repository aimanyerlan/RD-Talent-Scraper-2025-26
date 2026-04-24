import re
import time
from decimal import Decimal
from urllib.parse import parse_qs, urlparse

import requests
from bs4 import BeautifulSoup
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.jobs.models import Skill, Vacancy, VacancySkill
from apps.jobs.skill_extraction import extract_skills
from apps.jobs.vacancy_meta import (
    detect_job_type,
    detect_work_type,
    extract_experience_snippet,
    parse_linkedin_vacancy_meta,
)

LINKEDIN_SEARCH_URL = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
LINKEDIN_JOB_URL = "https://www.linkedin.com/jobs/view/{job_id}/"

LINKEDIN_WORKPLACE_FW = {"onsite": "1", "remote": "2", "hybrid": "3"}

RND_KEYWORDS = [
    "research",
    "r&d",
    "rnd",
    "scientist",
    "science",
    "laboratory",
    "lab",
    "researcher",
    "biotech",
    "bioinformatics",
    "machine learning",
    "ml",
    "ai",
    "artificial intelligence",
    "data science",
    "data scientist",
    "data analyst",
    "data engineer",
    "analyst",
    "engineer",
    "nlp",
    "computer vision",
    "qa",
    "automation",
    "chemistry",
    "biology",
    "physics",
    "statistician",
    "innovation",
    "clinical research",
]

DEFAULT_SEARCH_QUERY = "research OR r&d OR scientist OR data science OR machine learning OR AI"


def is_rnd_vacancy(title: str, description: str) -> bool:
    text = f"{title} {description}".lower()
    return any(keyword in text for keyword in RND_KEYWORDS)


def parse_salary_text(text: str):
    if not text:
        return None, None, ""

    normalized = text.replace("\u202f", "").replace("\xa0", "").replace(" ", "")
    salary_from = None
    salary_to = None
    currency = ""

    if "$" in normalized or "USD" in normalized.upper():
        currency = "USD"
    elif "€" in normalized or "EUR" in normalized.upper():
        currency = "EUR"
    elif "₽" in normalized or "RUB" in normalized.upper():
        currency = "RUB"
    elif "₸" in normalized or "KZT" in normalized.upper():
        currency = "KZT"

    numbers = re.findall(r"\d+", normalized)
    if len(numbers) >= 2:
        salary_from = Decimal(numbers[0])
        salary_to = Decimal(numbers[1])
    elif len(numbers) == 1:
        salary_from = Decimal(numbers[0])
        salary_to = Decimal(numbers[0])

    return salary_from, salary_to, currency


def extract_job_id(job_card: BeautifulSoup, url: str) -> str:
    if job_card.has_attr("data-entity-urn"):
        urn = str(job_card.get("data-entity-urn"))
        match = re.search(r":(\d+)$", urn)
        if match:
            return match.group(1)

    url_match = re.search(r"/jobs/view/(\d+)", url)
    if url_match:
        return url_match.group(1)

    query_id = parse_qs(urlparse(url).query).get("currentJobId")
    if query_id:
        return query_id[0]

    return ""


class Command(BaseCommand):
    help = "Scrape R&D vacancies from LinkedIn guest search and save them with skills"

    def add_arguments(self, parser):
        parser.add_argument("--text", type=str, default=DEFAULT_SEARCH_QUERY)
        parser.add_argument(
            "--location",
            type=str,
            default="",
            help="LinkedIn location text (optional). Empty = no country/region filter.",
        )
        parser.add_argument(
            "--workplace",
            type=str,
            choices=["any", "remote", "onsite", "hybrid"],
            default="any",
            help="LinkedIn workplace filter: remote / onsite / hybrid, or any (default).",
        )
        parser.add_argument("--pages", type=int, default=5)
        parser.add_argument("--sleep", type=float, default=1.2)

    def handle(self, *args, **options):
        search_text = options["text"]
        location = (options["location"] or "").strip()
        workplace = options["workplace"]
        pages = max(1, options["pages"])
        sleep_seconds = max(0.0, options["sleep"])

        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9,ru;q=0.8",
        }

        created_count = 0
        updated_count = 0
        skipped_count = 0
        processed_ids = set()

        loc_log = location if location else "(no location filter)"
        wt_log = workplace if workplace != "any" else "any workplace"
        self.stdout.write(
            self.style.WARNING(
                f"Starting LinkedIn scraping for '{search_text}' | location: {loc_log} | "
                f"workplace: {wt_log} | last 7 days"
            )
        )

        for page in range(pages):
            start = page * 25
            params = {
                "keywords": search_text,
                "start": start,
                "f_TPR": "r604800",  # last 7 days
                "position": 1,
                "pageNum": page,
            }
            if location:
                params["location"] = location
            if workplace != "any":
                params["f_WT"] = LINKEDIN_WORKPLACE_FW[workplace]
            self.stdout.write(f"Fetching LinkedIn page {page + 1} (start={start})...")

            try:
                response = requests.get(
                    LINKEDIN_SEARCH_URL,
                    params=params,
                    headers=headers,
                    timeout=20,
                )
                response.raise_for_status()
            except Exception as err:
                self.stdout.write(self.style.ERROR(f"LinkedIn search request failed: {err}"))
                continue

            soup = BeautifulSoup(response.text, "html.parser")
            cards = soup.select("li")
            if not cards:
                self.stdout.write(self.style.WARNING("No vacancies on this page, stopping."))
                break

            for card in cards:
                title_elem = card.select_one("h3.base-search-card__title")
                company_elem = card.select_one("h4.base-search-card__subtitle")
                location_elem = card.select_one("span.job-search-card__location")
                url_elem = card.select_one("a.base-card__full-link")
                salary_elem = card.select_one("span.job-search-card__salary-info")

                if not title_elem or not url_elem:
                    continue

                title = " ".join(title_elem.get_text(strip=True).split())
                company = (
                    " ".join(company_elem.get_text(strip=True).split())
                    if company_elem
                    else "Unknown Company"
                )
                location_text = (
                    " ".join(location_elem.get_text(strip=True).split()) if location_elem else ""
                )
                url = url_elem.get("href", "").split("?")[0].strip()
                if not url:
                    continue

                job_id = extract_job_id(card, url)
                if not job_id:
                    job_id = re.sub(r"\W+", "", url)[:90]

                if job_id in processed_ids:
                    continue
                processed_ids.add(job_id)

                salary_text = salary_elem.get_text(strip=True) if salary_elem else ""
                salary_from, salary_to, currency = parse_salary_text(salary_text)

                description = ""
                page_skills = []
                experience = ""
                work_type = ""
                job_type = ""
                if job_id.isdigit():
                    detail_url = LINKEDIN_JOB_URL.format(job_id=job_id)
                else:
                    detail_url = url

                try:
                    if sleep_seconds:
                        time.sleep(sleep_seconds)
                    detail_resp = requests.get(detail_url, headers=headers, timeout=20)
                    if detail_resp.status_code == 200:
                        detail_soup = BeautifulSoup(detail_resp.text, "html.parser")
                        desc_elem = detail_soup.select_one("div.show-more-less-html__markup")
                        if desc_elem:
                            description = " ".join(desc_elem.get_text("\n", strip=True).split())

                        for selector in (
                            "a.job-details-how-you-match__skills-item-subtitle",
                            "span.job-details-how-you-match__skills-item-subtitle",
                            "li.job-details-preferences-and-skills__pill",
                            "span.job-details-preferences-and-skills__pill",
                        ):
                            for skill_node in detail_soup.select(selector):
                                text = " ".join(skill_node.get_text(strip=True).split())
                                if text and len(text) <= 40:
                                    page_skills.append(text)

                        experience, work_type, job_type = parse_linkedin_vacancy_meta(detail_soup)
                except Exception as detail_err:
                    self.stdout.write(
                        self.style.WARNING(f"Could not fetch details for {detail_url}: {detail_err}")
                    )

                if not description:
                    snippet_elem = card.select_one("p.base-search-card__snippet")
                    if snippet_elem:
                        description = " ".join(snippet_elem.get_text(" ", strip=True).split())

                blob = f"{title}\n{description}\n{location_text}"
                if not experience:
                    experience = extract_experience_snippet(blob) or ""
                if not work_type:
                    work_type = detect_work_type(blob) or ""
                if not job_type:
                    job_type = detect_job_type(blob) or ""

                if not is_rnd_vacancy(title, description):
                    skipped_count += 1
                    continue

                if job_id.isdigit():
                    vacancy_url = LINKEDIN_JOB_URL.format(job_id=job_id)
                else:
                    vacancy_url = url[:2048]

                vacancy, created = Vacancy.objects.update_or_create(
                    source="linkedin_guest",
                    external_id=job_id,
                    defaults={
                        "title": title,
                        "company": company,
                        "location": location_text,
                        "description": description,
                        "url": vacancy_url,
                        "published_at": timezone.now(),
                        "salary_from": salary_from,
                        "salary_to": salary_to,
                        "currency": currency,
                        "experience": experience,
                        "work_type": work_type,
                        "job_type": job_type,
                    },
                )

                if created:
                    created_count += 1
                else:
                    updated_count += 1

                extracted_skills = extract_skills(f"{title}\n{description}")
                all_skills = set(page_skills + extracted_skills)

                vacancy.skills.clear()
                for skill_name in all_skills:
                    cleaned = skill_name.strip()
                    if not cleaned or len(cleaned) > 40:
                        continue
                    skill, _ = Skill.objects.get_or_create(name=cleaned)
                    VacancySkill.objects.get_or_create(vacancy=vacancy, skill=skill)

                self.stdout.write(f"Saved LinkedIn vacancy: {title} ({company})")

            if sleep_seconds:
                time.sleep(sleep_seconds)

        self.stdout.write(self.style.SUCCESS("LinkedIn scraping finished"))
        self.stdout.write(self.style.SUCCESS(f"Created: {created_count}"))
        self.stdout.write(self.style.SUCCESS(f"Updated: {updated_count}"))
        self.stdout.write(self.style.SUCCESS(f"Skipped (Not R&D): {skipped_count}"))
