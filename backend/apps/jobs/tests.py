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

    def test_stats_endpoint(self):
        response = self.client.get("/api/vacancies/stats/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("total_vacancies", data)
        self.assertGreaterEqual(data["total_vacancies"], 1)
