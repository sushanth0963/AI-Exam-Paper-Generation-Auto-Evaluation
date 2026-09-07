# Stub producer — replaces RabbitMQ dependency so the app runs without a message broker.
# In production, replace the body of publish_email_task with actual RabbitMQ / Celery logic.

def publish_email_task(email: str) -> None:
    """
    Placeholder for async email notification.
    Currently a no-op; integrate with Celery/RabbitMQ when needed.
    """
    print(f"[EMAIL STUB] Welcome email would be sent to: {email}")