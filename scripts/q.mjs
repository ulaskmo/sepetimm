import { readFile } from "node:fs/promises";
import { Pool, neonConfig } from "@neondatabase/serverless";
neonConfig.webSocketConstructor = globalThis.WebSocket;
const text = await readFile(".env.local", "utf8");
let url = null;
for (const line of text.split("\n")) {
  const m = /^\s*DATABASE_URL\s*=\s*(.*)\s*$/.exec(line);
  if (m) url = m[1].replace(/^["']|["']$/g, "").trim();
}
const pool = new Pool({ connectionString: url });
try {
  const { rows } = await pool.query(process.argv[2]);
  for (const r of rows) console.log(Object.values(r).join(" | "));
  if (rows.length === 0) console.log("(satır yok)");
} catch (e) {
  console.error("sorgu hatası:", e.message);
} finally {
  await pool.end();
}
