from django.db import migrations
from django.contrib.auth.hashers import make_password

def populate_demo_data(apps, schema_editor):
    Project = apps.get_model('tasks', 'Project')
    Task = apps.get_model('tasks', 'Task')
    Participant = apps.get_model('tasks', 'Participant')
    User = apps.get_model('tasks', 'User')

    # Create demo users
    user1, created = User.objects.get_or_create(
        username='demo_user1',
        email='demo1@example.com',
        defaults={'password': make_password('password123')}
    )

    user2, created = User.objects.get_or_create(
        username='demo_user2',
        email='demo2@example.com',
        defaults={'password': make_password('password123')}
    )

    # Create demo projects
    project1 = Project.objects.create(name='Demo Project 1', description='This is a demo project 1', user=user1)
    project2 = Project.objects.create(name='Demo Project 2', description='This is a demo project 2', user=user2)

    # Create demo tasks
    Task.objects.create(title='Demo Task 1', description='This is a demo task 1', completed=False, user=user1, project=project1)
    Task.objects.create(title='Demo Task 2', description='This is a demo task 2', completed=False, user=user1, project=project1)
    Task.objects.create(title='Demo Task 3', description='This is a demo task 3', completed=True, user=user2, project=project2)
    Task.objects.create(title='Demo Task 4', description='This is a demo task 4', completed=True, user=user2, project=project2)

    # Create demo participants
    Participant.objects.create(project=project1, user=user1)
    Participant.objects.create(project=project1, user=user2)
    Participant.objects.create(project=project2, user=user1)
    Participant.objects.create(project=project2, user=user2)


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(populate_demo_data),
    ]
