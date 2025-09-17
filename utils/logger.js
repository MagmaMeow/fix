const { load, save } = require("./storage");
let logs = load("logs.json");

function addLog(type, guildId, data) {
  if (!logs[guildId]) logs[guildId] = [];
  logs[guildId].push({ type, data, date: Date.now() });
  save("logs.json", logs);
}

module.exports = { addLog };
