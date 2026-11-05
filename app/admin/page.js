import { isAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { ITENS } from "@/lib/checklist";
import Login from "./Login";
import Sair from "./Sair";
export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Checklists" };

export default async function Admin({ searchParams }) {
  if (!(await isAdmin())) return (<><header className="topo"><h1>Admin · Checklist de Empilhadeira</h1></header><Login /></>);
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
  return (<>
    <header className="topo noprint"><h1>Admin · Checklists</h1>
      <div className="links" style={{ marginTop: 6 }}><a href="/admin/qrcode">QR Codes</a><a href={`/api/checkins?formato=csv&${qs}`}>Exportar CSV</a><a href="/" target="_blank">Formulário</a><Sair /></div></header>
    <main className="wide">
      <form className="card filtros">
        <div><label className="campo">Empilhadeira</label><input name="empilhadeira" defaultValue={emp || ""} /></div>
        <div><label className="campo">De</label><input type="date" name="de" defaultValue={de || ""} /></div>
        <div><label className="campo">Até</label><input type="date" name="ate" defaultValue={ate || ""} /></div>
        <div><label className="campo">Resultado</label><select name="resultado" defaultValue={res || ""}><option value="">Todos</option><option>APROVADA</option><option>REPROVADA</option></select></div>
        <button className="btn">Filtrar</button>
      </form>
      <div className="stats">
        <div className="card"><b>{rows.length}</b>Checklists</div>
        <div className="card"><b style={{ color: "var(--ok)" }}>{rows.length - reprov}</b>Aprovadas</div>
        <div className="card"><b style={{ color: "var(--nok)" }}>{reprov}</b>Reprovadas</div>
      </div>
      <div className="card tabela-wrap"><table>
        <thead><tr><th>#</th><th>Data/hora</th><th>Empilhadeira</th><th>Operador</th><th>Turno</th><th>Itens Não OK</th><th>Resultado</th></tr></thead>
        <tbody>{rows.map((r) => { const nok = ITENS.filter((i) => r.itens[i.id] === "nok").length; return (
          <tr key={r.id}><td><a href={`/admin/${r.id}`}>{r.id}</a></td><td>{fmt(r.inspecao_em)}</td><td>{r.empilhadeira}</td><td>{r.operador}</td><td>{r.turno}</td>
            <td style={{ color: nok ? "var(--nok)" : undefined, fontWeight: nok ? 700 : 400 }}>{nok}</td><td><a href={`/admin/${r.id}`}><span className={`tag ${r.resultado}`}>{r.resultado}</span></a></td></tr>); })}
          {!rows.length && <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--cinza)" }}>Nenhum checklist encontrado.</td></tr>}</tbody>
      </table></div>
    </main></>);
}
