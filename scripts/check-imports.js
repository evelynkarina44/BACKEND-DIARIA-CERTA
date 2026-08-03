import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pending = [resolve(root, "src/app.js"), resolve(root, "src/server.js")];
const visited = new Set();
const errors = [];
const importPattern = /(?:import|export)\s+(?:[^"']*?\s+from\s+)?["'](\.[^"']+)["']/g;

while (pending.length) {
  const file = pending.pop();
  if (visited.has(file)) continue;
  visited.add(file);
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1];
    if (!specifier.endsWith(".js")) errors.push(`${file}: import relativo sem extensão: ${specifier}`);
    const target = resolve(dirname(file), specifier);
    if (!existsSync(target)) errors.push(`${file}: import inexistente: ${specifier}`);
    else pending.push(target);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Imports alcançáveis verificados: ${visited.size} arquivos.`);
