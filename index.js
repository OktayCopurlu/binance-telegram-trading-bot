const express = require("express");
const telegramListener = require("./telegramListener");
const parseSignal = require("./parseSignal");
const placeOrder = require("./placeOrder");
const bodyParser = require("body-parser");

telegramListener();
const app = express();
app.use(express.json());
app.use(bodyParser.text());

app.post("/webhook", async (req, res) => {
  const signal = parseSignal(req.body);

  if (signal) {
    const response = await placeOrder(signal);
    res.status(200).send(response);
  } else {
    res.status(400).send("Invalid signal received.");
  }
});

app.get("/", (req, res) => {
  res.status(200).send(`BINANCE TELEGRAM TRADING BOT IS RUNNING`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// const signal = parseSignal(
//   `
//   🔥 #XRP/USDT (Long📉, x20) 🔥

// Entry - 2.45
// Take-Profit:

// 🥉 2.5 (40% of profit)
// 🥈 2.6 (60% of profit)
// 🥇 2.7 (80% of profit)
// 🚀 2.8 (100% of profit)
//   `
// );

// if (signal) {
//   placeOrder(signal);
// }
