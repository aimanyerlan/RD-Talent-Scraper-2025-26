from __future__ import annotations

import re
from typing import List, Tuple

_SKILL_DEFINITIONS: List[Tuple[str, List[str]]] = [
    ("Python", [r"\bpython\b", r"\bпитон\b", r"\bpython\s*3\b"]),
    ("SQL", [r"\bsql\b", r"\bpostgres\b", r"\bpostgresql\b", r"\bmysql\b", r"\bsqlite\b"]),
    (
        "Machine Learning",
        [r"\bmachine learning\b", r"\bмашинн\w*\s+обучен\w*\b", r"\bml\b", r"\bмашинн\w*\s+learning\b"],
    ),
    (
        "Deep Learning",
        [r"\bdeep learning\b", r"\bглубок\w*\s+обучен\w*\b", r"\bcnn\b", r"\brnn\b", r"\blstm\b"],
    ),
    ("Data Analysis", [r"\bdata analysis\b", r"\bанализ\s+данн", r"\bdata\s*analytics\b"]),
    ("Data Science", [r"\bdata science\b", r"\bdata\s*scientist\b", r"\bнаук\w*\s+о\s+данн"]),
    (
        "Research",
        [r"\bresearch\b", r"\bисследован\w*\b", r"\br&d\b", r"\brnd\b", r"\bнаучн\w*\s+исслед"],
    ),
    ("R", [r"(?<![\w&])R(?![\w&])\b", r"\bязык\s*R\b", r"\bprogramming\s+in\s+R\b"]),
    ("Pandas", [r"\bpandas\b"]),
    ("NumPy", [r"\bnumpy\b"]),
    ("Scikit-learn", [r"\bscikit-learn\b", r"\bsklearn\b", r"\bsci-kit\b"]),
    ("TensorFlow", [r"\btensorflow\b"]),
    ("PyTorch", [r"\bpytorch\b"]),
    ("Statistics", [r"\bstatistics\b", r"\bстатистик\w*\b", r"\bстатистическ"]),
    ("Bioinformatics", [r"\bbioinformatics\b", r"\bбиоинформатик"]),
    ("Laboratory Skills", [r"\blaboratory\b", r"\bлаборатор", r"\blab skills\b"]),
    ("Communication", [r"\bcommunication\b", r"\bкоммуникац\w*\b", r"\bcommunications\b"]),
    ("Git", [r"\bgit\b", r"\bgithub\b", r"\bgitlab\b"]),
    ("Docker", [r"\bdocker\b", r"\bконтейнериз"]),
    ("Linux", [r"\blinux\b", r"\bunix\b", r"\bubuntu\b"]),
    ("NLP", [r"\bnlp\b", r"\bnatural language processing\b", r"\bobработк\w*\s+естественн\w*\s+язык"]),
    ("Computer Vision", [r"\bcomputer vision\b", r"\bкомпьютерн\w*\s+зрен", r"\bcomputer-vision\b"]),
    ("Power BI", [r"\bpower\s*bi\b"]),
    ("Tableau", [r"\btableau\b"]),
    ("Kubernetes", [r"\bkubernetes\b", r"\bk8s\b"]),
    ("AWS", [r"\baws\b", r"\bamazon web services\b"]),
    ("Azure", [r"\bazure\b"]),
    ("Spark", [r"\bapache spark\b", r"\bspark\b"]),
    ("Kafka", [r"\bkafka\b"]),
    ("Airflow", [r"\bairflow\b"]),
    ("Jupyter", [r"\bjupyter\b"]),
    ("CI/CD", [r"\bci/cd\b", r"\bcontinuous integration\b"]),
]


def extract_skills_from_text(text: str) -> List[str]:
    if not text:
        return []
    found: List[str] = []
    seen: set[str] = set()
    for name, patterns in _SKILL_DEFINITIONS:
        for pat in patterns:
            try:
                if re.search(pat, text, re.IGNORECASE):
                    if name not in seen:
                        seen.add(name)
                        found.append(name)
                    break
            except re.error:
                continue
    return found


def extract_skills(text: str) -> List[str]:
    return extract_skills_from_text(text)
