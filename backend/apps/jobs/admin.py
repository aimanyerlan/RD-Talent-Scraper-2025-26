from django.contrib import admin
from .models import Vacancy, Skill, VacancySkill, Watchlist


class VacancySkillInline(admin.TabularInline):
    model = VacancySkill
    extra = 1
    autocomplete_fields = ("skill",)


@admin.register(Vacancy)
class VacancyAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "company",
        "location",
        "work_type",
        "job_type",
        "source",
        "published_at",
        "created_at",
    )
    search_fields = ("title", "company", "location", "description", "experience")
    list_filter = ("source", "work_type", "job_type", "published_at", "created_at")
    ordering = ("-published_at",)
    readonly_fields = ("created_at",)
    date_hierarchy = "published_at"
    list_per_page = 20
    inlines = [VacancySkillInline]


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "category")
    search_fields = ("name", "category")
    ordering = ("name",)
    list_per_page = 20


@admin.register(VacancySkill)
class VacancySkillAdmin(admin.ModelAdmin):
    list_display = ("vacancy", "skill")
    search_fields = ("vacancy__title", "skill__name")
    autocomplete_fields = ("vacancy", "skill")
    list_per_page = 20


@admin.register(Watchlist)
class WatchlistAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "vacancy", "created_at")
    search_fields = ("user__email", "vacancy__title")
    list_filter = ("created_at",)
    ordering = ("-created_at",)
    readonly_fields = ("created_at",)
    autocomplete_fields = ("user", "vacancy")
    list_select_related = ("user", "vacancy")
    list_per_page = 20
