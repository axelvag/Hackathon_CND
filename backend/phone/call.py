from vonage import Auth, Vonage
from vonage_voice import CreateCallRequest, Phone, ToPhone
import os

client = Vonage(Auth(
    application_id=os.getenv("VONAGE_APPLICATION_ID"),
    private_key=os.getenv("VONAGE_APPLICATION_PRIVATE_KEY_PATH"),
    ))

def send_call(to_number: str, from_number: str, text: str):
    print(client)
    response = client.voice.create_call(
    CreateCallRequest(
        ncco=[
            {
                "action": "talk",
                "text": text,
                "language": "fr-FR",
                "style": "1",
                "premium": True,
            }
        ],
        to=[ToPhone(number=to_number)],
        from_=Phone(number=from_number),
        text=text
    ))
    return response