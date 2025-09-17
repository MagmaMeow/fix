const fs = require("fs");
const path = require("path");

function load(file) {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, "../data", file), "utf8"));
  } catch {
    return {};
  }
}

function save(file, data) {
  fs.writeFileSync(path.join(__dirname, "../data", file), JSON.stringify(data, null, 2));
}

module.exports = { load, save };
