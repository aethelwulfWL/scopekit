const fs = require("node:fs");
const path = require("node:path");
const read = (name) => fs.readFileSync(path.join(__dirname, name), "utf8");
const html = read("shell.html")
  .replace("/*STYLE*/", () => read("style.css"))
  .replace("/*CORE*/", () => read("core.js"))
  .replace("/*APP*/", () => read("app.js"));
fs.writeFileSync(path.join(__dirname, "ScopeKit.html"), html);
console.log(
  "Built ScopeKit.html — " +
    Buffer.byteLength(html) +
    " bytes, no external dependencies.",
);
