const express = require("express");
const logger = require("morgan");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();

app.use(logger("dev"));
app.use(bodyParser.json());

app.get("/", function (req, res) {
  res.send("Hello World");
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
  const data = req.body.entry[0].changes[0];
  if (data.field !== "messages") {
    // not from the messages webhook so dont process
    return res.sendStatus(400);
  }

  console.log("data: ", JSON.stringify(data));

  if (data.value.statuses) {
    // dont process messages from test number
    console.log("message from test number, not processing");
    return res.sendStatus(200);
  }

  const payload = {
    to: "491778583716",
    messaging_product: "whatsapp",
    text: { body: "Hello, this is a test message!" },
  };

  console.log("bearar: ", process.env.WHATSAPP_BEARER_TOKEN);

  try {
    const response = await axios.post(
      "https://graph.facebook.com/v16.0/117680034656711/messages",
      payload,
      {
        headers: {
          Authorization: process.env.WHATSAPP_BEARER_TOKEN,
        },
      }
    );

    // Process the response data as needed
    console.log(response.data);

    res.sendStatus(200);
  } catch (error) {
    console.error("Error sending POST request:", error);
    res.status(500).send("Error sending POST request");
  }
});

app.listen(3000);

// 1) get message
// 2) send to openAI
// 3) get response
// 4) send response to user
// 5) add typescript
// 6) add to a
