# R&D Talent Scraper

## Project Overview

**R&D Talent Scraper** is a backend web application designed to collect research and development (R&D) related job vacancies and analyze the required skills from their descriptions.

In the MVP stage, the system collects vacancy data from the HH platform, extracts key skills using a dictionary-based approach, and provides a REST API for searching, filtering, and browsing vacancies.

---

# Tech Stack

**Backend**

* Python
* Django
* Django REST Framework

**Database**

* PostgreSQL

**Async Processing**

* Celery
* Redis

**Containerization**

* Docker
* Docker Compose

**Deployment**

* Render

**Version Control**

* GitHub

---

# Project Structure

```
rd
│
├── backend/                # Django backend application
│
├── docker/                 # Docker related configuration
│
├── .env.example            # Environment variables example
│
├── docker-compose.yml      # Multi-container configuration
│
├── Dockerfile              # Backend container definition
│
├── requirements.txt        # Production dependencies
│
├── requirements-dev.txt    # Development dependencies
│
├── pyproject.toml          # Formatter and import sorting configuration
│
├── .flake8                 # Linter configuration
│
└── README.md
```

---

# Environment Setup

### 1. Clone the repository

```
git clone https://github.com/your-username/rd-talent-scraper.git
cd rd-talent-scraper
```

### 2. Create virtual environment

```
python -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### 4. Configure environment variables

Create `.env` file using the example:

```
cp .env.example .env
```

Example variables:

```
DEBUG=True
SECRET_KEY=your_secret_key
DATABASE_URL=postgres://user:password@db:5432/talent_db
REDIS_URL=redis://redis:6379/0
```

### 5. Run with Docker

```
docker compose up --build
```

This will start:

* Django backend
* PostgreSQL database
* Redis broker
* Celery worker

---

# Code Style

The project follows consistent Python code style rules.

**Formatter**

* Black

**Import Sorting**

* isort

**Linting**

* Flake8

Developers should run formatters before committing code:

```
black .
isort .
flake8
```

Configuration files:

* `pyproject.toml`
* `.flake8`

---

# Branching Strategy

The project uses a simple Git workflow.

**Main branches**

`main`
Stable version of the project.

`dev`
Active development branch.

**Feature branches**

New features are developed in separate branches:

```
feature/auth
feature/vacancy-model
feature-skill-extraction
```

Development process:

1. Create feature branch from `dev`
2. Implement feature
3. Commit changes
4. Open Pull Request to `dev`
5. Merge after review

---

# Development Status

## Week 2 — Environment Setup**

Completed tasks:

* GitHub repository created
* README documentation prepared
* Project structure initialized
* Development environment configured
* Code style rules defined
* Branching strategy agreed

---

## Week 3 — Authentication & Authorization

Implemented JWT-based authentication using Django REST Framework.

Features:
- User registration
- Login with JWT tokens
- Token refresh
- Protected endpoint `/api/auth/me/`
- Role support (user/admin)

---

## Week 4 — Database Design & Models

The database schema for the R&D Talent Scraper was designed and implemented using Django ORM.

The schema includes the following entities:

- **User** – system users
- **Vacancy** – job postings collected from external sources
- **Skill** – technologies and competencies extracted from vacancies
- **Watchlist** – skills tracked by users

Relationships between entities were implemented using foreign keys and many-to-many associations to ensure a normalized and scalable database structure.

---

## Week 5 — Core Functionality (Part 1)

This week focused on implementing basic CRUD operations for the main system entities using Django REST Framework.

### Implemented functionality

- Created API endpoints for:
  - `Vacancy`
  - `Skill`
  - `Watchlist`

### Access control

- Regular users can:
  - view vacancies and skills
  - use search/filter features
  - manage only their own watchlist

- Admin users can:
  - create, update, and delete vacancies
  - create, update, and delete skills

--

## Week 6 — Core Functionality (Part 2)

### Implemented functionality

- Vacancy search by keyword
- Filtering vacancies by location, source, and skill
- Ordering vacancies by publication date
- Improved API response structure for vacancy-related data
- Added validation and ensured correct response codes for invalid requests

