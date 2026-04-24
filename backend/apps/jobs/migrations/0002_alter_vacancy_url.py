from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("jobs", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="vacancy",
            name="url",
            field=models.URLField(max_length=2048, unique=True),
        ),
    ]
