from decimal import Decimal

from django.test import SimpleTestCase
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.jobs.facet_normalize import canonical_city_key, experience_bucket
from apps.jobs.models import Vacancy


class FacetNormalizeUnitTests(SimpleTestCase):
    def test_experience_bucket_no(self):
        self.assertEqual(experience_bucket("no experience required"), "no")

    def test_experience_bucket_senior(self):
        self.assertEqual(experience_bucket("senior developer 6+ years"), "6_plus")

    def test_canonical_city_almaty(self):
        self.assertEqual(canonical_city_key("Office, Almaty"), "almaty")


class VacancyAPIIntegrationTests(APITestCase):
    def setUp(self):
        self.vacancy = Vacancy.objects.create(
            title="R&D Scientist",
            company="TestCorp",
            location="Almaty",
            description="Laboratory research and Python.",
            url="https://example.com/vacancies/ci-test-1",
            source="ci_test",
            external_id="ci-1",
            published_at=timezone.now(),
        )

    def test_list_vacancies_returns_200_and_results(self):
        response = self.client.get("/api/vacancies/")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertIn("results", body)
        self.assertGreaterEqual(len(body["results"]), 1)

    def test_retrieve_vacancy(self):
        response = self.client.get(f"/api/vacancies/{self.vacancy.pk}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["title"], "R&D Scientist")
        self.assertIn("ai_summary", response.json())
        self.assertIsInstance(response.json()["ai_summary"], list)

    def test_stats_endpoint(self):
        response = self.client.get("/api/vacancies/stats/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("total_vacancies", data)
        self.assertGreaterEqual(data["total_vacancies"], 1)

    def test_facet_counts_endpoint(self):
        response = self.client.get("/api/vacancies/facet-counts/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("total", data)
        self.assertIn("job_type", data)
        self.assertIn("work_type", data)
        self.assertIn("locations", data)
        self.assertIn("experiences", data)
        self.assertGreaterEqual(data["total"], 1)

    def test_top_skills_invalid_limit_returns_400(self):
        response = self.client.get("/api/vacancies/top-skills/?limit=abc")
        self.assertEqual(response.status_code, 400)

    def test_salary_filter_includes_vacancies_without_salary(self):
        """Rows with both salary fields null must not disappear when a salary range is applied."""
        response = self.client.get("/api/vacancies/?salary_min=1&salary_max=999999")
        self.assertEqual(response.status_code, 200)
        ids = {row["id"] for row in response.json()["results"]}
        self.assertIn(self.vacancy.pk, ids)

    def test_salary_min_excludes_low_paid_when_salary_known(self):
        paid = Vacancy.objects.create(
            title="Paid role",
            company="Co",
            location="X",
            description="Desc",
            url="https://example.com/vacancies/ci-test-paid",
            source="ci_test",
            external_id="ci-paid",
            published_at=timezone.now(),
            salary_from=Decimal("50000.00"),
            salary_to=Decimal("80000.00"),
        )
        response = self.client.get("/api/vacancies/?salary_min=100000")
        self.assertEqual(response.status_code, 200)
        ids = {row["id"] for row in response.json()["results"]}
        self.assertNotIn(paid.pk, ids)
        self.assertIn(self.vacancy.pk, ids)

    def test_salary_max_excludes_high_paid_when_salary_known(self):
        paid = Vacancy.objects.create(
            title="Senior role",
            company="Co",
            location="X",
            description="Desc",
            url="https://example.com/vacancies/ci-test-senior",
            source="ci_test",
            external_id="ci-senior",
            published_at=timezone.now(),
            salary_from=Decimal("300000.00"),
            salary_to=Decimal("400000.00"),
        )
        response = self.client.get("/api/vacancies/?salary_max=200000")
        self.assertEqual(response.status_code, 200)
        ids = {row["id"] for row in response.json()["results"]}
        self.assertNotIn(paid.pk, ids)
