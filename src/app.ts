import express from "express";
import logger from "morgan";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();
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

  res.sendStatus(200);
});

app.listen(80);
