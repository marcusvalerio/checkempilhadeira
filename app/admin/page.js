import { isAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { ITENS } from "@/lib/checklist";
import Login from "./Login";
import Sair from "./Sair";
export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Checklists" };

export default async function Admin({ searchParams }) {
  if (!(await isAdmin())) return (<><header className="cab"><div><small>Admin</small><h1>Checklist de empilhadeira</h1></div></header><Login /></>);
  const p = await searchParams;
  const emp = p.empilhadeira || null, de = p.de || null, ate = p.ate || null, res = p.resultado || null;
  const rows = await sql()`
    SELECT id, data, turno, operador, empilhadeira, irregularidade, resultado, inspecao_em, itens FROM checkins
    WHERE (${emp}::text IS NULL OR empilhadeira ILIKE '%' || ${emp} || '%')
      AND (${de}::date IS NULL OR data >= ${de}::date) AND (${ate}::date IS NULL OR data <= ${ate}::date)
      AND (${res}::text IS NULL OR resultado = ${res})
    ORDER BY inspecao_em DESC LIMIT 500`;
  const reprov = rows.filter((r) => r.resultado === "REPROVADA").length;
  const qs = new URLSearchParams(Object.entries({ empilhadeira: emp, de, ate, resultado: res }).filter(([, v]) => v)).toString();
  const fmt = (d) => new Date(d).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const filtrando = Boolean(emp || de || ate || res);
  return (<>
    <header className="cab noprint"><div><small>Admin</small><h1>Checklists</h1></div><nav className="chips"><Sair /></nav></header>
    <main className="wide">
      <nav className="chips noprint"><a href="/admin/qrcode">QR Codes</a><a href={`/api/checkins?formato=csv&${qs}`}>Exportar CSV</a><a href="/" target="_blank">Formulário</a></nav>
      <div className="stats">
        <div className="card"><b>{rows.length}</b>Total</div>
        <div className="card"><b style={{ color: "var(--ok)" }}>{rows.length - reprov}</b>Aprovadas</div>
        <div className="card"><b style={{ color: "var(--nok)" }}>{reprov}</b>Reprovadas</div>
      </div>
      <details className="card filtros-box" open={filtrando}>
        <summary>Filtros{filtrando ? " · ativos" : ""}</summary>
        <form className="filtros">
          <div className="f-full"><label className="campo">Empilhadeira</label><input name="empilhadeira" defaultValue={emp || ""} placeholder="Ex.: EMP-01" /></div>
          <div><label className="campo">De</label><input type="date" name="de" defaultValue={de || ""} /></div>
          <div><label className="campo">Até</label><input type="date" name="ate" defaultValue={ate || ""} /></div>
          <div className="f-full"><label className="campo">Resultado</label><select name="resultado" defaultValue={res || ""}><option value="">Todos</option><option>APROVADA</option><option>REPROVADA</option></select></div>
          <button className="btn f-full">Aplicar filtros</button>
          {filtrando && <a className="limpar f-full" href="/admin">Limpar filtros</a>}
        </form>
      </details>
      <section className="card lista">
        <div className="sec-tit"><h2>Inspeções</h2><span>{rows.length}</span></div>
        {rows.map((r) => { const nok = ITENS.filter((i) => r.itens[i.id] === "nok").length; return (
          <a className="linha" key={r.id} href={`/admin/${r.id}`}>
            <div className="l-main"><b>{r.empilhadeira}</b><small>{r.operador} · {r.turno}</small><small>{fmt(r.inspecao_em)} · nº {r.id}</small></div>
            <div className="l-dir"><span className={`tag ${r.resultado}`}>{r.resultado === "APROVADA" ? "Aprovada" : "Reprovada"}</span>
              {nok > 0 && <small style={{ color: "var(--nok)" }}>{nok} item{nok > 1 ? "s" : ""} não OK</small>}</div>
          </a>); })}
        {!rows.length && <p className="vazio">Nenhum checklist encontrado.</p>}
      </section>
    </main></>);
}
