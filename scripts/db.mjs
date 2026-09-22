/**
 * Applies .sql files to the Neon database over the connection in DATABASE_URL.
 *
 * Replaces the old psql-based scripts: psql is not installed on this machine
 * and is not something a shop owner should have to install to load products.
 *
 *   node scripts/db.mjs db/schema.sql db/seed-urunler.sql
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Pool, neonConfig } from "@neondatabase/serverless";

// Node 22+ ships a global WebSocket; the driver needs it for the pooled
// connection, which (unlike the HTTP one) can run multi-statement files.
neonConfig.webSocketConstructor = globalThis.WebSocket;

async function loadEnv() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const text = await readFile(path.join(process.cwd(), ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const m = /^\s*DATABASE_URL\s*=\s*(.*)\s*$/.exec(line);
      if (m) return m[1].replace(/^["']|["']$/g, "").trim();
    }
  } catch {
    /* no .env.local */
  }
  return null;
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Kullanım: node scripts/db.mjs <dosya.sql> [dosya2.sql ...]");
  process.exit(1);
}

const url = await loadEnv();
if (!url) {
  console.error(
    "DATABASE_URL bulunamadı.\n" +
      "Proje kökünde .env.local dosyası oluşturup Neon bağlantı adresini ekleyin."
  );
  process.exit(1);
}

const pool = new Pool({ connectionString: url });
try {
  for (const file of files) {
    const sql = await readFile(file, "utf8");
    process.stdout.write(`${file} … `);
    await pool.query(sql);
    console.log("tamam");
  }

  const { rows } = await pool.query(
    "select count(*)::int as toplam, count(*) filter (where published)::int as yayinda from products"
  );
  console.log(`ürün: ${rows[0].toplam} (yayında ${rows[0].yayinda})`);
} catch (err) {
  console.error("\nHATA:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
