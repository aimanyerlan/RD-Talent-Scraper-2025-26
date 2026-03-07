import django_filters

from .models import Vacancy


class VacancyFilter(django_filters.FilterSet):
    location = django_filters.CharFilter(field_name="location", lookup_expr="icontains")
    source = django_filters.CharFilter(field_name="source", lookup_expr="iexact")
    skill = django_filters.CharFilter(field_name="skills__name", lookup_expr="icontains")
    company = django_filters.CharFilter(field_name="company", lookup_expr="icontains")

    class Meta:
        model = Vacancy
        fields = ["location", "source", "skill", "company"]