const { NewMessage } = require("telegram/events");
const parseSignal = require("./parseSignal");
const input = require("input");
const { telegramClient, sessionFilePath } = require("./config");
const channelId = BigInt("1174005146");
const fs = require("fs");

async function telegramListener() {
  if (!fs.existsSync(sessionFilePath)) {
    await client.start({
      phoneNumber: async () =>
        await input.text("Enter your phone number (+90...): "),
      password: async () =>
        await input.text("Two-step verification password (if any): "),
      phoneCode: async () =>
        await input.text("Enter the Telegram verification code: "),
      onError: (err) => console.log("An error occurred:", err),
    });

    fs.writeFileSync(sessionFilePath, telegramClient.session.save());
  } else {
    await telegramClient.connect();
  }

  // Handling messages from Telegram
  telegramClient.addEventHandler((event) => {
    try {
      const message = event.message;
      const eventChannelId = BigInt(message.peerId.channelId.toString());
      // Correct comparison using BigInt
      if (message && eventChannelId === channelId) {
        const messageText = message.message;
        const signal = parseSignal(messageText);

        if (signal) {
          placeOrder(signal);
        }
      }
    } catch (error) {
      console.error("An error occurred while checking messages:", error);
      return `An error occurred while checking messages: ${error.message}`;
    }
  }, new NewMessage({ incoming: true }));
}

module.exports = telegramListener;
