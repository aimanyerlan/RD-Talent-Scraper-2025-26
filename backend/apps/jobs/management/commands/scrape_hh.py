import re
import time
from decimal import Decimal

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
    parse_hh_vacancy_meta,
)

HH_SEARCH_URL = "https://hh.kz/search/vacancy"

RND_KEYWORDS = [
    "research", "r&d", "rnd", "scientist", "science", "laboratory", "lab",
    "researcher", "biotech", "bioinformatics", "machine learning", "ml", "ai",
    "artificial intelligence", "data science", "data scientist", "data analyst",
    "data engineer", "analyst", "engineer", "nlp", "computer vision", "qa",
    "automation", "chemistry", "biology", "physics", "statistician",
    "innovation", "clinical research",
]

DEFAULT_SEARCH_QUERY = "research OR r&d OR scientist OR laboratory OR data OR machine learning OR AI OR bioinformatics OR nlp OR computer vision"

def is_rnd_vacancy(title: str, description: str) -> bool:
    text = f"{title} {description}".lower()
    return any(keyword in text for keyword in RND_KEYWORDS)

def parse_salary(salary_text: str):
    if not salary_text:
        return None, None, ""
    
    text = salary_text.replace("\u202f", "").replace("\xa0", "").replace(" ", "")
    salary_from = None
    salary_to = None
    currency = "KZT"

    if "₸" in text or "KZT" in text.upper():
        currency = "KZT"
    elif "₽" in text or "руб" in text.lower():
        currency = "RUB"
    elif "$" in text or "USD" in text.upper():
        currency = "USD"

    numbers = re.findall(r'\d+', text)
    if "от" in salary_text.lower() and "до" in salary_text.lower() and len(numbers) >= 2:
        salary_from = Decimal(numbers[0])
        salary_to = Decimal(numbers[1])
    elif "от" in salary_text.lower() and len(numbers) >= 1:
        salary_from = Decimal(numbers[0])
    elif "до" in salary_text.lower() and len(numbers) >= 1:
        salary_to = Decimal(numbers[0])
    elif len(numbers) == 1:
        salary_from = Decimal(numbers[0])
        salary_to = Decimal(numbers[0])
        
    return salary_from, salary_to, currency

class Command(BaseCommand):
    help = "Scrape ALL R&D vacancies and their details from HH.kz using BeautifulSoup"

    def add_arguments(self, parser):
        parser.add_argument("--text", type=str, default=DEFAULT_SEARCH_QUERY)
        parser.add_argument("--pages", type=int, default=5)

    def handle(self, *args, **options):
        search_text = options["text"]
        pages = options["pages"]

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7"
        }

        self.stdout.write(self.style.WARNING(f"Starting HTML Scraping from HH.kz for: '{search_text}'..."))

        created_count = 0
        updated_count = 0
        skipped_count = 0

        for page in range(pages):
            self.stdout.write(f"Fetching search page {page + 1}...")
            
            params = {
                "text": search_text,
                "page": page,
                "items_on_page": 20,
                "area": 40 
            }

            try:
                response = requests.get(HH_SEARCH_URL, params=params, headers=headers, timeout=15)
                response.raise_for_status()
                soup = BeautifulSoup(response.text, "html.parser")
                vacancy_cards = soup.find_all("div", attrs={"data-qa": "vacancy-serp__vacancy"})
                
                if not vacancy_cards:
                    self.stdout.write(self.style.WARNING("No more vacancies found on this page."))
                    break

                for card in vacancy_cards:
                    url_elem = card.find("a", attrs={"data-qa": "serp-item__title"})
                    if not url_elem:
                        continue
                        
                    raw_url = url_elem["href"]
                    clean_url = raw_url.split('?')[0]
                    
                    title = url_elem.text.strip()
                    
                    external_id = "unknown"
                    id_match = re.search(r'vacancy/(\d+)', clean_url)
                    if id_match:
                        external_id = id_match.group(1)

                    company_elem = card.find("a", attrs={"data-qa": "vacancy-serp__vacancy-employer"})
                    company = company_elem.text.strip() if company_elem else "Unknown Company"
                    company = " ".join(company.split())

                    location_elem = card.find("span", attrs={"data-qa": "vacancy-serp__vacancy-address"})
                    location = location_elem.text.strip() if location_elem else ""

                    salary_elem = card.find("span", attrs={"data-qa": "vacancy-serp__vacancy-compensation"})
                    salary_text = salary_elem.text.strip() if salary_elem else ""
                    salary_from, salary_to, currency = parse_salary(salary_text)

                    full_description = ""
                    scraped_skills = []
                    experience = ""
                    work_type = ""
                    job_type = ""

                    try:
                        time.sleep(1)
                        detail_resp = requests.get(clean_url, headers=headers, timeout=15)
                        
                        if detail_resp.status_code == 200:
                            detail_soup = BeautifulSoup(detail_resp.text, "html.parser")
                            
                            desc_elem = detail_soup.find("div", attrs={"data-qa": "vacancy-description"})
                            if desc_elem:
                                full_description = desc_elem.text.strip()
                            
                            skill_elems = detail_soup.find_all(attrs={"data-qa": re.compile(r"skills-element|bloko-tag__text")})
                            scraped_skills = [s.text.strip() for s in skill_elems if s.text.strip()]

                            experience, work_type, job_type = parse_hh_vacancy_meta(detail_soup)
                    except Exception as detail_err:
                        self.stdout.write(self.style.WARNING(f"Could not fetch details for {clean_url}: {detail_err}"))

                    if not full_description:
                        req_elem = card.find("div", attrs={"data-qa": "vacancy-serp__vacancy_snippet_requirement"})
                        resp_elem = card.find("div", attrs={"data-qa": "vacancy-serp__vacancy_snippet_responsibility"})
                        full_description = f"{req_elem.text.strip() if req_elem else ''}\n{resp_elem.text.strip() if resp_elem else ''}".strip()

                    blob = f"{title}\n{full_description}"
                    if not experience:
                        experience = extract_experience_snippet(blob) or ""
                    if not work_type:
                        work_type = detect_work_type(blob) or ""
                    if not job_type:
                        job_type = detect_job_type(blob) or ""

                    if not is_rnd_vacancy(title, full_description):
                        skipped_count += 1
                        continue

                    vacancy, created = Vacancy.objects.update_or_create(
                        external_id=external_id,
                        defaults={
                            "source": "hh_parser_detailed",
                            "title": title,
                            "company": company,
                            "location": location,
                            "description": full_description,
                            "url": clean_url,
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

                    extracted_skills = extract_skills(f"{title}\n{full_description}")
                    all_skills = set(scraped_skills + extracted_skills)
                    
                    vacancy.skills.clear()

                    for skill_name in all_skills:
                        if len(skill_name) < 40: 
                            skill, _ = Skill.objects.get_or_create(name=skill_name)
                            VacancySkill.objects.get_or_create(vacancy=vacancy, skill=skill)

                    self.stdout.write(f"Saved R&D Vacancy: {title} ({company})")

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error on page {page + 1}: {e}"))

            time.sleep(2)

        self.stdout.write(self.style.SUCCESS("Detailed Scraping finished!"))
        self.stdout.write(self.style.SUCCESS(f"Created: {created_count}"))
        self.stdout.write(self.style.SUCCESS(f"Updated: {updated_count}"))
        self.stdout.write(self.style.SUCCESS(f"Skipped (Not R&D): {skipped_count}"))