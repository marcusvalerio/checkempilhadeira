import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
const sql = neon(process.env.DATABASE_URL);
const stmts = readFileSync(new URL("../schema.sql", import.meta.url), "utf8")
  .split(";").map((s) => s.trim()).filter(Boolean);
for (const s of stmts) await sql.query(s);
console.log("Tabela checkins pronta.");
