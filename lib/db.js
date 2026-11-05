import { neon } from "@neondatabase/serverless";
let _sql;
export function sql() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada");
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}
