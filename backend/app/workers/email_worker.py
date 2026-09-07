import pika
import json


def callback(
    ch,
    method,
    properties,
    body
):

    data = json.loads(body)

    print(
        f"Sending email to: {data['email']}"
    )

    ch.basic_ack(
        delivery_tag=method.delivery_tag
    )


connection = pika.BlockingConnection(
    pika.ConnectionParameters(
        host="rabbitmq"
    )
)

channel = connection.channel()

channel.queue_declare(
    queue="email_queue"
)

channel.basic_consume(
    queue="email_queue",
    on_message_callback=callback
)

print("Waiting for messages...")

channel.start_consuming()