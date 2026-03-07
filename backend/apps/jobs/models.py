from django.conf import settings
from django.db import models


class Skill(models.Model):
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.name


class Vacancy(models.Model):
    title = models.CharField(max_length=255)
    company = models.CharField(max_length=255)
    location = models.CharField(max_length=255, blank=True)
    description = models.TextField()
    url = models.URLField(unique=True)

    source = models.CharField(max_length=50)
    external_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        db_index=True,
    )

    salary_from = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
    )
    salary_to = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
    )
    currency = models.CharField(
        max_length=10,
        blank=True,
    )

    published_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    skills = models.ManyToManyField(
        Skill,
        through="VacancySkill",
        related_name="vacancies",
    )

    class Meta:
        ordering = ["-published_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["source", "external_id"],
                name="unique_source_external_id",
            )
        ]

    def __str__(self):
        return f"{self.title} ({self.company})"


class VacancySkill(models.Model):
    vacancy = models.ForeignKey(
        Vacancy,
        on_delete=models.CASCADE,
        related_name="vacancy_skills",
    )
    skill = models.ForeignKey(
        Skill,
        on_delete=models.CASCADE,
        related_name="skill_vacancies",
    )

    class Meta:
        unique_together = ("vacancy", "skill")

    def __str__(self):
        return f"{self.vacancy.title} - {self.skill.name}"


class Watchlist(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="watchlist_items",
    )
    vacancy = models.ForeignKey(
        Vacancy,
        on_delete=models.CASCADE,
        related_name="watchlisted_by",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "vacancy")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.vacancy.title}"