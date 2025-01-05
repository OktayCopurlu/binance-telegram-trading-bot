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
  res.status(200).send("Server is running.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// const signal = parseSignal(
//   `
//   #XRP/USDT (Short📉, x20) 🔥

//   Entry - 2.572
//   Take-Profit:

//   🥉 2.6501 (40% of profit)
//   🥈 2.7465 (60% of profit)
//   🥇 2.8429 (80% of profit)
//   🚀 2.9393 (100% of profit)
//     `
// );

// if (signal) {
//   placeOrder(signal);
// }
