# app/celery.py
from celery import Celery

celery_app = Celery(
    "mastermarket_tasks",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0"
)

celery_app.conf.beat_schedule = {
    'update-prices-every-hour': {
        'task': 'app.tasks.update_prices',
        'schedule': 3600.0,
    },
}
