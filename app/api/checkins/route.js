import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ITENS } from "@/lib/checklist";
import { isAdmin } from "@/lib/auth";

const txt = (v, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req) {
  let b;
  try { b = await req.json(); } catch { return NextResponse.json({ erro: "JSON inválido" }, { status: 400 }); }

  const data = txt(b.data, 10), turno = txt(b.turno, 50), operador = txt(b.operador, 120), empilhadeira = txt(b.empilhadeira, 60);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !turno || !operador || !empilhadeira)
    return NextResponse.json({ erro: "Preencha data, turno, operador e empilhadeira." }, { status: 400 });

  const itens = {};
  for (const it of ITENS) {
    const v = b.itens?.[it.id];
    if (!["ok", "nok", "na"].includes(v) || (v === "na" && !it.na))
      return NextResponse.json({ erro: `Responda o item: ${it.label}` }, { status: 400 });
    itens[it.id] = v;
  }
  const temNok = Object.values(itens).includes("nok");
  const irregularidade = Boolean(b.irregularidade) || temNok;
  const descricao = txt(b.descricao, 2000);
  if (irregularidade && !descricao)
    return NextResponse.json({ erro: "Descreva a irregularidade encontrada." }, { status: 400 });
  const resultado = b.resultado === "APROVADA" ? "APROVADA" : b.resultado === "REPROVADA" ? "REPROVADA" : null;
  if (!resultado) return NextResponse.json({ erro: "Informe o resultado da inspeção." }, { status: 400 });
  const assinatura = typeof b.assinatura === "string" && b.assinatura.startsWith("data:image/png;base64,") && b.assinatura.length < 400000 ? b.assinatura : null;
  if (!assinatura) return NextResponse.json({ erro: "Assine o checklist." }, { status: 400 });

  const [row] = await sql()`
    INSERT INTO checkins (data, turno, operador, empilhadeira, itens, irregularidade, descricao, resultado, observacoes, assinatura, inspecao_em)
    VALUES (${data}, ${turno}, ${operador}, ${empilhadeira}, ${JSON.stringify(itens)}, ${irregularidade}, ${descricao || null},
            ${resultado}, ${txt(b.observacoes, 2000) || null}, ${assinatura}, now())
    RETURNING id, inspecao_em`;
  return NextResponse.json(row, { status: 201 });
}

export async function GET(req) {
  if (!(await isAdmin())) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const p = new URL(req.url).searchParams;
  const emp = p.get("empilhadeira") || null, de = p.get("de") || null, ate = p.get("ate") || null, res = p.get("resultado") || null;
  const rows = await sql()`
    SELECT id, data, turno, operador, empilhadeira, irregularidade, resultado, inspecao_em, itens
    FROM checkins
    WHERE (${emp}::text IS NULL OR empilhadeira ILIKE '%' || ${emp} || '%')
      AND (${de}::date IS NULL OR data >= ${de}::date)
      AND (${ate}::date IS NULL OR data <= ${ate}::date)
      AND (${res}::text IS NULL OR resultado = ${res})
    ORDER BY inspecao_em DESC LIMIT 1000`;
  if (p.get("formato") === "csv") {
    const { ITENS } = await import("@/lib/checklist");
    const head = ["id", "data", "turno", "operador", "empilhadeira", "resultado", "irregularidade", "inspecao_em", ...ITENS.map((i) => i.id)];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = rows.map((r) => [r.id, String(r.data).slice(0, 10), r.turno, r.operador, r.empilhadeira, r.resultado, r.irregularidade ? "SIM" : "NÃO",
      new Date(r.inspecao_em).toISOString(), ...ITENS.map((i) => r.itens[i.id])].map(esc).join(";"));
    return new NextResponse("﻿" + [head.join(";"), ...lines].join("\n"), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=checkins.csv" },
    });
  }
  return NextResponse.json(rows);
}
