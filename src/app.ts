import express from "express";
import logger from "morgan";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import axios from "axios";

import { ChangesObject } from "./types";

dotenv.config();
const app = express();

app.use(logger("dev"));
app.use(bodyParser.json());

app.get("/", function (req, res) {
  res.send("Hello World ✨");
});

app.get("/webhooks", (req, res) => {
  if (
    req.query["hub.mode"] == "subscribe" &&
    req.query["hub.verify_token"] == process.env.WHATSAPP_WEBHOOK_TOKEN
  ) {
    res.send(req.query["hub.challenge"]);
  } else {
    res.sendStatus(400);
  }
});

app.post("/webhooks", async (req, res) => {
  const changes: ChangesObject = req.body.data?.entry?.[0]?.changes?.[0];

  if (changes.field !== "messages") {
    // not from the messages webhook so dont process
    return res.sendStatus(400);
  }

  if (isBusinessAccountMessage(changes)) {
    // dont process messages from test number
    console.log("message from test number, not processing");
    return res.sendStatus(200);
  }

  const senderNumber = getSenderNumber(changes);

  try {
    console.log("📨 Sending message to ", senderNumber);

    const response = await sendMessage({
      to: senderNumber,
      text: "Hello, this is a test message!",
    });
    console.log("📬 Message sent to ", senderNumber);
    console.log("📩 Response: ", response);
    res.sendStatus(200);
  } catch (error) {
    console.error("Error sending POST request:", error);
    res.status(500).send("Error sending POST request");
  }
});

app.get("/whatsapp/send/test", async (req, res) => {
  try {
    const response = await sendMessage({});

    // Process the response data as needed
    console.log(response.data);

    res.status(200).send(JSON.stringify(response));
  } catch (error) {
    console.error("Error sending POST request:", error);
    res.status(500).send("Error sending POST request");
  }
});

app.listen(80);

function isBusinessAccountMessage(changes: ChangesObject) {
  return Boolean(changes?.value?.statuses);
}

function getSenderNumber(changes: ChangesObject) {
  return changes?.value?.messages[0]?.from;
}

async function sendMessage({
  to = process.env.TEST_PHONE_NUMBER,
  text = "Hello, this is a test message!",
}) {
  const payload = {
    to,
    messaging_product: "whatsapp",
    text: { body: text },
  };

  const response = await axios.post(
    "https://graph.facebook.com/v16.0/117680034656711/messages",
    payload,
    {
      headers: {
        Authorization: process.env.WHATSAPP_BEARER_TOKEN,
      },
    }
  );

  return response.data;
}
