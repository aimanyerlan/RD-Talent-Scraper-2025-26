from __future__ import annotations

from typing import Dict, Iterable, List, Optional, Tuple

from django.db.models import Q

_EXP_NO = (
    "без опыта",
    "без опыта работы",
    "опыт не требуется",
    "опыт работы не требуется",
    "не требуется опыт",
    "не требуется опыт работы",
    "стаж не требуется",
    "no experience",
    "no work experience",
    "experience not required",
    "not required",
    "не важен опыт",
    "опыт не важен",
    "не указан опыт",
    "не указан",
    "не требуется",
)

_EXP_1_3 = (
    "1-3",
    "1–3",
    "1—3",
    "1 3 ",
    "1-3 года",
    "1–3 года",
    "1—3 года",
    "1-3 лет",
    "от 1 года",
    "от 1 до 3",
    "1 до 3",
    "1-3 years",
    "1 to 3",
    "1 year",
    "2 years",
    "junior",
)
_EXP_3_6 = (
    "3-6",
    "3–6",
    "3—6",
    "3-6 лет",
    "3–6 лет",
    "3—6 лет",
    "3-6 года",
    "от 3 лет",
    "от 3 до 6",
    "3 до 6",
    "3-6 years",
    "middle",
)
_EXP_6_PLUS = (
    "более 6",
    "больше 6",
    ">6",
    "> 6",
    "6+",
    "6 +",
    "от 6",
    "6 лет и более",
    "6-10",
    "6–10",
    "10+",
    "10 лет",
    "senior",
    "lead",
    "6+ years",
    "more than 6",
)

EXPERIENCE_BUCKETS_UI: Tuple[str, ...] = ("no", "1_3", "3_6", "6_plus")

EXPERIENCE_BUCKET_LABELS: Dict[str, str] = {
    "no": "No experience",
    "1_3": "1–3 years",
    "3_6": "3–6 years",
    "6_plus": "6+ years",
    "other": "Other",
}


def experience_bucket(raw: str) -> str:
    t = (raw or "").strip().lower()
    if not t:
        return "no"
    for p in _EXP_NO:
        if p.lower() in t:
            return "no"
    for p in _EXP_1_3:
        if p.lower() in t:
            return "1_3"
    for p in _EXP_3_6:
        if p.lower() in t:
            return "3_6"
    for p in _EXP_6_PLUS:
        if p.lower() in t:
            return "6_plus"
    return "other"


def experience_ui_label(raw: str) -> Optional[str]:
    b = experience_bucket(raw or "")
    if b == "other":
        return None
    return EXPERIENCE_BUCKET_LABELS.get(b)


def experience_bucket_q(bucket: str) -> Q:
    if bucket == "no":
        q = Q(experience="")
        for p in _EXP_NO:
            q |= Q(experience__icontains=p)
        return q
    if bucket == "other":
        return Q(pk__in=[])
    q = Q()
    patterns = {
        "1_3": _EXP_1_3,
        "3_6": _EXP_3_6,
        "6_plus": _EXP_6_PLUS,
    }.get(bucket, ())
    for p in patterns:
        q |= Q(experience__icontains=p)
    return q


CITY_DEFINITIONS: List[Tuple[str, str, Tuple[str, ...]]] = [
    ("almaty", "Almaty", ("алматы", "almaty", "alma-ata", "алма-ата")),
    ("astana", "Astana", ("астана", "astana", "нур-султан", "nur-sultan", "нұр-сұлтан")),
    ("moscow", "Moscow", ("москва", "moscow")),
    ("saint_petersburg", "Saint Petersburg", ("санкт-петербург", "спб", "st. petersburg", "st petersburg", "saint petersburg")),
    ("new_york", "New York", ("new york", "нью-йорк", "nyc", "ny, united states")),
    ("los_angeles", "Los Angeles", ("los angeles", "лос-анджелес")),
    ("chicago", "Chicago", ("чикаго", "chicago")),
    ("london", "London", ("лондон", "london")),
    ("berlin", "Berlin", ("берлин", "berlin")),
    ("paris", "Paris", ("париж", "paris")),
    ("tokyo", "Tokyo", ("токио", "tokyo")),
    ("singapore", "Singapore", ("сингапур", "singapore")),
    ("dubai", "Dubai", ("дубай", "dubai")),
    ("shanghai", "Shanghai", ("шанхай", "shanghai")),
    ("beijing", "Beijing", ("пекин", "beijing")),
    ("hong_kong", "Hong Kong", ("гонконг", "hong kong")),
    ("tel_aviv", "Tel Aviv", ("тель-авив", "tel aviv")),
    ("warsaw", "Warsaw", ("варшава", "warsaw")),
    ("prague", "Prague", ("прага", "prague")),
    ("kyiv", "Kyiv", ("київ", "киев", "kyiv", "kiev")),
    ("wroclaw", "Wrocław", ("wrocław", "wroclaw", "вроцлав")),
    ("krakow", "Kraków", ("kraków", "krakow", "краков")),
    ("aktau", "Aktau", ("актау", "aktau")),
    ("atyrau", "Atyrau", ("атырау", "atyrau")),
    ("shymkent", "Shymkent", ("шымкент", "shymkent")),
    ("karaganda", "Karaganda", ("караганда", "karaganda")),
    ("aktobe", "Aktobe", ("актобе", "aktobe")),
    ("oral", "Oral", ("oral", "уральск", "uralsk")),
    ("pavlodar", "Pavlodar", ("павлодар", "pavlodar")),
    ("taraz", "Taraz", ("тараз", "taraz")),
    ("kostanay", "Kostanay", ("костанай", "kostanay")),
    ("semey", "Semey", ("семей", "semey")),
    ("hershey", "Hershey", ("hershey",)),
    ("philadelphia", "Philadelphia", ("philadelphia", "филадельфия")),
    ("wilmington_de", "Wilmington", ("wilmington",)),
    ("raleigh", "Raleigh", ("raleigh",)),
    ("charlotte", "Charlotte", ("charlotte",)),
    ("san_francisco", "San Francisco", ("san francisco", "sf bay")),
    ("boston", "Boston", ("boston", "бостон")),
    ("seattle", "Seattle", ("seattle", "сиэтл")),
    ("austin", "Austin", ("austin", "остин")),
    ("toronto", "Toronto", ("торонто", "toronto")),
    ("vancouver", "Vancouver", ("vancouver", "ванкувер")),
    ("mumbai", "Mumbai", ("мумбаи", "mumbai")),
    ("bangalore", "Bangalore", ("bangalore", "bengaluru", "бангалор")),
    ("remote", "Remote", ("remote", "удалённ", "удаленн", "дистанц")),
]

_COUNTRY_ONLY = frozenset(
    {
        "kazakhstan",
        "казахстан",
        "united states",
        "usa",
        "сша",
        "russia",
        "россия",
        "germany",
        "франция",
        "france",
        "uk",
        "united kingdom",
        "poland",
        "india",
        "china",
        "japan",
        "canada",
        "australia",
        "netherlands",
        "spain",
        "italy",
        "sweden",
        "norway",
        "finland",
        "denmark",
        "belgium",
        "austria",
        "switzerland",
        "ireland",
        "portugal",
        "czech republic",
        "hungary",
        "romania",
        "bulgaria",
        "greece",
        "turkey",
        "israel",
        "uae",
        "south korea",
        "singapore",
        "mexico",
        "brazil",
    }
)


def _location_segments(location: str) -> List[str]:
    s = location.strip().lower()
    return [p.strip() for p in s.replace(";", ",").split(",") if p.strip()]


def canonical_city_key(location: str) -> Optional[str]:
    if not location or not location.strip():
        return None
    s = location.strip().lower()
    segments = _location_segments(location)
    for seg in segments:
        if len(seg) < 2:
            continue
        if seg in _COUNTRY_ONLY:
            continue
        if "mangystau" in seg and "aktau" not in seg:
            continue
        for key, _label, aliases in CITY_DEFINITIONS:
            for a in aliases:
                al = a.lower()
                if al in seg:
                    return key
    if "mangystau" in s and "aktau" not in s:
        return None
    for key, _label, aliases in CITY_DEFINITIONS:
        for a in aliases:
            al = a.lower()
            if al in s:
                return key
    return None


def city_match_q(city_key: str) -> Q:
    for key, _label, aliases in CITY_DEFINITIONS:
        if key == city_key:
            q = Q()
            for a in aliases:
                q |= Q(location__icontains=a)
            return q
    return Q(pk__in=[])


def city_other_q() -> Q:
    q_any = Q()
    for _key, _label, aliases in CITY_DEFINITIONS:
        for a in aliases:
            q_any |= Q(location__icontains=a)
    return ~q_any


def aggregate_location_facets(rows: Iterable[dict], *, include_other: bool = False) -> List[dict]:
    counts: Dict[str, int] = {}
    for row in rows:
        loc = row.get("location") or ""
        c = int(row.get("vacancy_count") or 0)
        key = canonical_city_key(loc)
        if key is None:
            key = "_other"
        counts[key] = counts.get(key, 0) + c

    labels = {k: lab for k, lab, _a in CITY_DEFINITIONS}
    labels["_other"] = "Other"

    out: List[dict] = []
    for key, total in sorted(counts.items(), key=lambda x: (-x[1], x[0])):
        if total <= 0:
            continue
        if key == "_other" and not include_other:
            continue
        out.append(
            {
                "city_key": key,
                "label": labels.get(key, key),
                "vacancy_count": total,
            }
        )
    return out


def aggregate_experience_facets(rows: Iterable[dict]) -> List[dict]:
    counts: Dict[str, int] = {k: 0 for k in EXPERIENCE_BUCKETS_UI}
    for row in rows:
        exp = row.get("experience") or ""
        c = int(row.get("vacancy_count") or 0)
        b = experience_bucket(exp)
        if b in counts:
            counts[b] += c

    return [
        {
            "bucket": b,
            "label": EXPERIENCE_BUCKET_LABELS[b],
            "vacancy_count": counts[b],
        }
        for b in EXPERIENCE_BUCKETS_UI
    ]
