// Expo loads .env when this file exists; EXPO_PUBLIC_API_URL is then available.
// On a physical device, set in eventpro-mobile/.env: EXPO_PUBLIC_API_URL=http://YOUR_MAC_IP:8080
const base = require("./app.json").expo;
module.exports = {
  expo: {
    ...base,
    extra: {
      ...base.extra,
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080",
    },
  },
};
