from decimal import Decimal, InvalidOperation

import django_filters
from django.db.models import Q

from .facet_normalize import city_match_q, city_other_q, experience_bucket_q
from .models import Vacancy


class CharInFilter(django_filters.BaseInFilter, django_filters.CharFilter):
    pass


class VacancyFilter(django_filters.FilterSet):
    location = django_filters.CharFilter(field_name="location", lookup_expr="icontains")
    city = django_filters.CharFilter(method="filter_city")
    experience = django_filters.CharFilter(field_name="experience", lookup_expr="icontains")
    experience_bucket = django_filters.CharFilter(method="filter_experience_bucket")
    source = django_filters.CharFilter(field_name="source", lookup_expr="iexact")
    skill = django_filters.CharFilter(method="filter_skills_multi")
    company = django_filters.CharFilter(field_name="company", lookup_expr="icontains")
    work_type = CharInFilter(field_name="work_type", lookup_expr="in")
    job_type = CharInFilter(field_name="job_type", lookup_expr="in")
    salary_min = django_filters.NumberFilter(method="filter_salary_min")
    salary_max = django_filters.NumberFilter(method="filter_salary_max")

    class Meta:
        model = Vacancy
        fields = [
            "location",
            "city",
            "experience",
            "experience_bucket",
            "source",
            "skill",
            "company",
            "work_type",
            "job_type",
            "salary_min",
            "salary_max",
        ]

    def filter_city(self, queryset, name, value):
        if not value:
            return queryset
        if value in ("_other", "other"):
            return queryset.filter(city_other_q()).distinct()
        return queryset.filter(city_match_q(value)).distinct()

    def filter_experience_bucket(self, queryset, name, value):
        if not value:
            return queryset
        return queryset.filter(experience_bucket_q(value)).distinct()

    def filter_skills_multi(self, queryset, name, value):
        if not value:
            return queryset
        parts = [p.strip() for p in str(value).split(",") if p.strip()]
        if not parts:
            return queryset
        q = Q()
        for part in parts:
            q |= Q(skills__name__icontains=part)
        return queryset.filter(q).distinct()

    def filter_salary_min(self, queryset, name, value):
        if value is None:
            return queryset
        try:
            v = Decimal(str(value))
        except (InvalidOperation, TypeError, ValueError):
            return queryset
        no_salary = Q(salary_from__isnull=True, salary_to__isnull=True)
        in_range = Q(salary_to__gte=v) | Q(salary_from__gte=v)
        return queryset.filter(no_salary | in_range)

    def filter_salary_max(self, queryset, name, value):
        if value is None:
            return queryset
        try:
            v = Decimal(str(value))
        except (InvalidOperation, TypeError, ValueError):
            return queryset
        no_salary = Q(salary_from__isnull=True, salary_to__isnull=True)
        in_range = Q(salary_from__lte=v) | Q(salary_to__lte=v)
        return queryset.filter(no_salary | in_range)
