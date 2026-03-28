import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'banking_project.settings')

app = Celery('banking_project')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

from celery.schedules import crontab

app.conf.beat_schedule = {
    'process-scheduled-transfers-daily': {
        'task': 'transactions.tasks.process_scheduled_transfers',
        'schedule': crontab(hour=0, minute=0), # Run exactly at midnight every day
    },
}
