from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = (
        "Run vacancy scrapers: HH.kz, LinkedIn guest search, or both. "
        "Omit --text / --pages / --location / --sleep to use each scraper's defaults."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--source",
            type=str,
            choices=["hh", "linkedin", "all"],
            default="all",
            help="Which scraper to run (default: all).",
        )
        parser.add_argument(
            "--text",
            type=str,
            default=None,
            help="Search query for both scrapers when set.",
        )
        parser.add_argument(
            "--pages",
            type=int,
            default=None,
            help="Max pages for both scrapers when set (otherwise each uses its own default).",
        )
        parser.add_argument(
            "--location",
            type=str,
            default=None,
            help="LinkedIn location (optional). Omit for no geo filter.",
        )
        parser.add_argument(
            "--workplace",
            type=str,
            choices=["any", "remote", "onsite", "hybrid"],
            default=None,
            help="LinkedIn workplace: remote / onsite / hybrid, or any (default).",
        )
        parser.add_argument(
            "--sleep",
            type=float,
            default=None,
            help="Delay between LinkedIn detail requests in seconds (LinkedIn / all only).",
        )

    def handle(self, *args, **options):
        source = options["source"]
        verbosity = options.get("verbosity", 1)

        def hh_kwargs():
            kw = {}
            if options["text"] is not None:
                kw["text"] = options["text"]
            if options["pages"] is not None:
                kw["pages"] = options["pages"]
            return kw

        def linkedin_kwargs():
            kw = {}
            if options["text"] is not None:
                kw["text"] = options["text"]
            if options["pages"] is not None:
                kw["pages"] = options["pages"]
            if options["location"] is not None:
                kw["location"] = options["location"]
            if options["workplace"] is not None:
                kw["workplace"] = options["workplace"]
            if options["sleep"] is not None:
                kw["sleep"] = options["sleep"]
            return kw

        if source in ("hh", "all"):
            self.stdout.write(self.style.WARNING("=== HH.kz ==="))
            call_command(
                "scrape_hh",
                stdout=self.stdout,
                stderr=self.stderr,
                verbosity=verbosity,
                **hh_kwargs(),
            )

        if source in ("linkedin", "all"):
            self.stdout.write(self.style.WARNING("=== LinkedIn ==="))
            call_command(
                "scrape_linkedin",
                stdout=self.stdout,
                stderr=self.stderr,
                verbosity=verbosity,
                **linkedin_kwargs(),
            )

        self.stdout.write(self.style.SUCCESS("scrape_all finished."))
