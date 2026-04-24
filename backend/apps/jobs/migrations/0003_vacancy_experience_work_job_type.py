from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("jobs", "0002_alter_vacancy_url"),
    ]

    operations = [
        migrations.AddField(
            model_name="vacancy",
            name="experience",
            field=models.CharField(
                blank=True,
                default="",
                help_text="Required experience (free text); empty if unknown.",
                max_length=255,
            ),
        ),
        migrations.AddField(
            model_name="vacancy",
            name="work_type",
            field=models.CharField(
                blank=True,
                choices=[
                    ("onsite", "On site"),
                    ("remote", "Remote"),
                    ("hybrid", "Hybrid"),
                ],
                default="",
                help_text="On site / Remote / Hybrid",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="vacancy",
            name="job_type",
            field=models.CharField(
                blank=True,
                choices=[
                    ("full_time", "Full time"),
                    ("part_time", "Part time"),
                    ("remote", "Remote"),
                    ("internship", "Internship"),
                    ("contract", "Contract"),
                ],
                default="",
                help_text="Full time / Part time / Remote / Internship / Contract",
                max_length=20,
            ),
        ),
    ]
