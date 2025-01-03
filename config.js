const Binance = require("binance-api-node").default;
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
require("dotenv").config();

const BINANCE_API_KEY = process.env.BINANCE_API_KEY;
const BINANCE_API_SECRET = process.env.BINANCE_API_SECRET;

const binanceClient = Binance({
  apiKey: BINANCE_API_KEY,
  apiSecret: BINANCE_API_SECRET,
  futures: true,
});

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;
const sessionFilePath = "./session.json";

// Session information file path
const stringSession = fs.existsSync(sessionFilePath)
  ? new StringSession(fs.readFileSync(sessionFilePath, "utf8"))
  : new StringSession("");

const telegramClient = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
});

module.exports = { binanceClient, telegramClient, sessionFilePath };
