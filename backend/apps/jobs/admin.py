from django.contrib import admin
from .models import Vacancy, Skill, VacancySkill, Watchlist


admin.site.register(Vacancy)
admin.site.register(Skill)
admin.site.register(VacancySkill)
admin.site.register(Watchlist)