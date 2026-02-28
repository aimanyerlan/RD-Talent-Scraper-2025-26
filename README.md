# R&D Talent Scraper

## 1. Жоба туралы

R&D Talent Scraper — ғылым және зерттеу (Research & Development) саласындағы бос жұмыс орындарын жинап, олардағы талап етілетін құзыреттерді (skills) талдап көрсететін веб-қосымша.

Жүйе вакансияларды (MVP-де HH платформасынан) жинап, сипаттамасынан негізгі дағдыларды шығарып, пайдаланушыға іздеу, сүзгілеу және сұрыптау арқылы көрсетуге мүмкіндік береді.

---

## 2. Ақпарат

- Нұсқаларды бақылау жүйесі: GitHub  
- Деплой платформасы: Render  
- Backend: Django + Django REST Framework  

---

## 3. Жобаның мақсаты

### Негізгі мақсат

Ғылым саласындағы вакансияларды жинау, сақтау және олардан талап етілетін дағдыларды талдап көрсету.

### Қосымша мақсаттар

- Skill бойынша іздеу және сүзгілеу
- Вакансияларды сұрыптау және пагинация
- Пайдаланушының watchlist мүмкіндігі
- Қарапайым админ басқаруы

---

## 4. MVP

### Міндетті функционал:

- Пайдаланушы тіркелуі (register)
- Кіру / шығу (login/logout)
- Рөлдер: user және admin
- HH платформасынан вакансияларды жинау
- Вакансияларды дерекқорда сақтау
- Сипаттамадан skills шығару (dictionary-based әдіс)
- Іздеу (search)
- Сүзгілеу (location, skill, source, дата)
- Сұрыптау (жарияланған уақыты бойынша)
- Пагинация
- Watchlist (таңдалған skill бақылау)
- REST API
- Қауіпсіздік: құпиясөздерді хэштеу, енгізуді тексеру
- Docker контейнеризация
- Render платформасына деплой

---

## 5. MVP-ден тыс (кейінгі мүмкіндіктер)

- LinkedIn толық скрейпинг (ToS тәуекеліне байланысты кейін)
- ML/LLM арқылы advanced skill extraction
- Аналитикалық дашборд
- Email/Telegram хабарламалар

---

## 6. Пайдаланушы рөлдері

### Қарапайым пайдаланушы

- Тіркелу және кіру
- Вакансияларды көру
- Іздеу және сүзгілеу
- Skill бойынша watchlist қосу

### Админ

- Skills dictionary басқару
- Вакансия жинау процесін іске қосу
- Жүйе белсенділігін бақылау

---

## 7. Жүйе архитектурасы (жоғары деңгей)

Жоба классикалық үш қабатты (3-tier) архитектураға негізделген:

1. Presentation Layer (Frontend)
2. Application Layer (Django REST API)
3. Data Layer (PostgreSQL)

Сонымен қатар асинхронды өңдеу қабаты бар (Celery Worker).

### Компоненттер:

- Django REST API (backend)
- PostgreSQL (дерекқор)
- Celery (асинхронды вакансия жинау)
- Redis (broker)
- Docker (контейнеризация)
- Render (деплой)

### Деректер ағыны (Data Flow)

1. Celery Worker HH API-дан вакансия алады  
2. Вакансия сипаттамасы өңделеді  
3. Skill dictionary арқылы skills анықталады  
4. PostgreSQL-ға Vacancy және Skill байланысы сақталады  
5. Пайдаланушы API арқылы деректерді сұратады  
6. API фильтр, сұрыптау, пагинация орындайды  
7. JSON жауап қайтарылады  

---

## 8. Деректер моделі (жоспар)

### User
- id
- email
- password
- role

### Vacancy
- id
- title
- company
- location
- description
- url
- source
- published_at
- created_at

### Skill
- id
- name
- category

### VacancySkill (Many-to-Many)

### Watchlist
- user
- skill

---

## 9. REST API (жоба нобайы)

### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/me

### Vacancies
- GET /api/vacancies
- GET /api/vacancies/{id}

Query параметрлері:
- q
- location
- skill
- source
- date_from
- date_to
- sort
- page

### Skills
- GET /api/skills
- POST /api/skills (admin)
- PUT /api/skills/{id} (admin)
- DELETE /api/skills/{id} (admin)

### Watchlist
- GET /api/watchlist
- POST /api/watchlist
- DELETE /api/watchlist/{id}

---

## 10. Негізгі функционалдық емес талаптар

- Валидация (client + server)
- Қателерді өңдеу
- Логирование
- Мониторинг
- Unit және integration тесттер
- Қауіпсіздік (SQL injection, XSS, CSRF қорғау)
- CI/CD pipeline
- Жүктемелік тестілеу

---

## 11. Тәуекелдер және шешімдер

### LinkedIn ToS тәуекелі
Шешім: MVP-де HH ғана пайдалану.

### Деректердің қайталануы
Шешім: URL + source арқылы дедупликация.

