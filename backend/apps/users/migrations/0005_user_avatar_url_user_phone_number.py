from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0004_user_full_name"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="avatar_url",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="user",
            name="phone_number",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
    ]
