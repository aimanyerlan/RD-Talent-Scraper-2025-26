import re
from decimal import Decimal

import requests
from django.core.management.base import BaseCommand
from django.utils.dateparse import parse_datetime

from apps.jobs.models import Skill, Vacancy, VacancySkill


HH_API_URL = "https://api.hh.ru/vacancies"

COMMON_SKILLS = [
    "Python",
    "SQL",
    "Machine Learning",
    "Deep Learning",
    "Data Analysis",
    "Data Science",
    "Research",
    "R",
    "Pandas",
    "NumPy",
    "Scikit-learn",
    "TensorFlow",
    "PyTorch",
    "Statistics",
    "Bioinformatics",
    "Laboratory Skills",
    "Communication",
    "Git",
    "Docker",
    "Linux",
]

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


def parse_hh_datetime(raw_value: str | None):
    if not raw_value:
        return None
    return parse_datetime(raw_value)


def extract_skills(text: str) -> list[str]:
    if not text:
        return []

    found_skills = []
    text_lower = text.lower()

    for skill in COMMON_SKILLS:
        pattern = r"\b" + re.escape(skill.lower()) + r"\b"
        if re.search(pattern, text_lower):
            found_skills.append(skill)

    return found_skills


def is_rnd_vacancy(title: str, description: str) -> bool:
    text = f"{title} {description}".lower()
    return any(keyword in text for keyword in RND_KEYWORDS)


class Command(BaseCommand):
    help = "Scrape only R&D-related vacancies from HH.ru and save them to database"

    def add_arguments(self, parser):
        parser.add_argument(
            "--text",
            type=str,
            default="research scientist OR researcher OR r&d OR data scientist OR machine learning OR bioinformatics OR laboratory OR scientist OR ai OR ml OR analyst OR engineer OR nlp OR computer vision OR automation",
            help="Search query for HH vacancies",
        )
        parser.add_argument(
            "--pages",
            type=int,
            default=20,
            help="How many HH pages to parse",
        )
        parser.add_argument(
            "--per-page",
            type=int,
            default=100,
            help="How many vacancies per page",
        )

    def handle(self, *args, **options):
        search_text = options["text"]
        pages = options["pages"]
        per_page = options["per_page"]

        self.stdout.write(self.style.WARNING("Starting HH scraping..."))
        self.stdout.write(f"Query: {search_text}")
        self.stdout.write(f"Pages: {pages}, per_page: {per_page}")

        created_count = 0
        updated_count = 0
        skipped_count = 0

        for page in range(pages):
            params = {
                "text": search_text,
                "page": page,
                "per_page": per_page,
            }

            response = requests.get(HH_API_URL, params=params, timeout=20)
            response.raise_for_status()

            data = response.json()
            items = data.get("items", [])

            self.stdout.write(f"Page {page + 1}: found {len(items)} vacancies")

            for item in items:
                external_id = str(item.get("id"))
                title = item.get("name", "")
                url = item.get("alternate_url", "")

                # HH-дегі нақты дата/уақытты алу үшін detail endpoint-ті де тексереміз.
                detail_published_at_raw = None
                key_skills = []
                detail_description = ""
                try:
                    detail_response = requests.get(f"{HH_API_URL}/{external_id}", timeout=20)
                    detail_response.raise_for_status()
                    detail_data = detail_response.json()
                    detail_published_at_raw = detail_data.get("published_at")
                    # Get key_skills from detail
                    key_skills_data = detail_data.get("key_skills", [])
                    key_skills = [skill.get("name") for skill in key_skills_data if skill.get("name")]
                    # Get full description
                    detail_description = detail_data.get("description", "")
                except requests.RequestException:
                    # Detail сұрау сәтсіз болса, list API-дегі published_at-қа fallback жасаймыз.
                    pass

                published_at = (
                    parse_hh_datetime(detail_published_at_raw)
                    or parse_hh_datetime(item.get("published_at"))
                    or parse_hh_datetime(item.get("created_at"))
                )

                if published_at is None:
                    skipped_count += 1
                    continue

                employer = item.get("employer") or {}
                company = employer.get("name", "")

                area = item.get("area") or {}
                location = area.get("name", "")

                snippet = item.get("snippet") or {}
                requirement = snippet.get("requirement") or ""
                responsibility = snippet.get("responsibility") or ""
                # Use full description from detail if available, otherwise use snippet
                description = detail_description or f"{requirement}\n{responsibility}".strip()

                if not is_rnd_vacancy(title, description):
                    skipped_count += 1
                    continue

                salary = item.get("salary") or {}
                salary_from = salary.get("from")
                salary_to = salary.get("to")
                currency = salary.get("currency") or ""

                vacancy, created = Vacancy.objects.update_or_create(
                    source="hh",
                    external_id=external_id,
                    defaults={
                        "title": title,
                        "company": company,
                        "location": location,
                        "description": description,
                        "url": url,
                        "published_at": published_at,
                        "salary_from": Decimal(str(salary_from)) if salary_from is not None else None,
                        "salary_to": Decimal(str(salary_to)) if salary_to is not None else None,
                        "currency": currency,
                    },
                )

                if created:
                    created_count += 1
                else:
                    updated_count += 1

                # Use key_skills from HH API if available, otherwise extract from text
                if key_skills:
                    extracted_skills = key_skills
                else:
                    extracted_skills = extract_skills(f"{title}\n{description}")

                vacancy.skills.clear()

                for skill_name in extracted_skills:
                    skill, _ = Skill.objects.get_or_create(name=skill_name)
                    VacancySkill.objects.get_or_create(
                        vacancy=vacancy,
                        skill=skill,
                    )

        self.stdout.write(self.style.SUCCESS("HH scraping finished"))
        self.stdout.write(self.style.SUCCESS(f"Created: {created_count}"))
        self.stdout.write(self.style.SUCCESS(f"Updated: {updated_count}"))
        self.stdout.write(self.style.SUCCESS(f"Skipped non-R&D: {skipped_count}"))