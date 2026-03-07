from django.contrib import admin
from .models import Vacancy, Skill, VacancySkill, Watchlist


class VacancySkillInline(admin.TabularInline):
    model = VacancySkill
    extra = 1


@admin.register(Vacancy)
class VacancyAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "company", "location", "source", "published_at")
    search_fields = ("title", "company", "location", "description")
    list_filter = ("source", "location")
    inlines = [VacancySkillInline]


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "category")
    search_fields = ("name", "category")


@admin.register(VacancySkill)
class VacancySkillAdmin(admin.ModelAdmin):
    list_display = ("vacancy", "skill")
    search_fields = ("vacancy__title", "skill__name")


@admin.register(Watchlist)
class WatchlistAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "vacancy", "created_at")
    search_fields = ("user__email", "vacancy__title")