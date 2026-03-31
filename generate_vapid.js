const webpush = require("web-push");
const fs = require("fs");
const path = require("path");

const keys = webpush.generateVAPIDKeys();

const envPath = path.resolve(__dirname, ".env.local");
let content = "";
if (fs.existsSync(envPath)) {
  content = fs.readFileSync(envPath, "utf-8");
}

if (!content.includes("NEXT_PUBLIC_VAPID_PUBLIC_KEY")) {
  fs.appendFileSync(
    envPath,
    `\n# VAPID Keys for Web Push Notifications\nNEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}\nVAPID_PRIVATE_KEY=${keys.privateKey}\nVAPID_SUBJECT=mailto:admin@campusbite.com\n`
  );
  console.log("Keys appended successfully.");
} else {
  console.log("Keys already exist in .env.local.");
}
