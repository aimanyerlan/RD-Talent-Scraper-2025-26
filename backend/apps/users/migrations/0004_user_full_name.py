from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0003_remove_user_is_phone_verified_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="full_name",
            field=models.CharField(default="", max_length=255),
            preserve_default=False,
        ),
    ]
