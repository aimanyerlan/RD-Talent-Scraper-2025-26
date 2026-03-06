import django_filters

from .models import Vacancy


class VacancyFilter(django_filters.FilterSet):
    skill = django_filters.CharFilter(field_name="skills__name", lookup_expr="icontains")

    class Meta:
        model = Vacancy
        fields = ["location", "source", "skill"]