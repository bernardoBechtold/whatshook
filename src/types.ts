import { WebhookObject } from "whatsapp/build/types/webhooks";

export type ChangesObject = WebhookObject["entry"][0]["changes"][0];
