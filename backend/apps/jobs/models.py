from django.db import models
from django.conf import settings

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

    published_at = models.DateTimeField()

    created_at = models.DateTimeField(auto_now_add=True)

    skills = models.ManyToManyField(Skill, through="VacancySkill")

    def __str__(self):
        return self.title
    

class VacancySkill(models.Model):
    vacancy = models.ForeignKey(
        Vacancy,
        on_delete=models.CASCADE
    )

    skill = models.ForeignKey(
        Skill,
        on_delete=models.CASCADE
    )

    class Meta:
        unique_together = ("vacancy", "skill")


class Watchlist(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )

    skill = models.ForeignKey(
        Skill,
        on_delete=models.CASCADE
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "skill")