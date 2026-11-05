import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { SECOES, imagem } from "@/lib/checklist";
export const dynamic = "force-dynamic";
const ROT = { ok: ["✓ OK", "var(--ok)"], nok: ["✗ Não OK", "var(--nok)"], na: ["N/A", "var(--cinza)"] };

export default async function Detalhe({ params }) {
  if (!(await isAdmin())) redirect("/admin");
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const [c] = await sql()`SELECT * FROM checkins WHERE id = ${Number(id)}`;
  if (!c) notFound();
  return (<>
    <header className="cab"><div><small>Checklist nº {c.id}</small><h1>{c.empilhadeira}</h1></div><span className={`tag ${c.resultado}`}>{c.resultado}</span></header>
    <script dangerouslySetInnerHTML={{ __html: "document.getElementById('imp').onclick=function(e){e.preventDefault();print()}" }} />
    <main>
      <nav className="chips noprint"><a href="/admin">← Voltar</a><a href="#" id="imp">Imprimir</a></nav>
      <section className="card"><h2>1. Identificação</h2>
        <p>Data: <b>{new Date(c.data).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</b><br />Turno: <b>{c.turno}</b><br />Operador: <b>{c.operador}</b><br />Empilhadeira: <b>{c.empilhadeira}</b></p></section>
      <section className="card"><h2>2. Inspeção visual</h2>
        {SECOES.map((s) => (<div key={s.titulo}><h3 style={{ fontSize: 14, margin: "14px 0 4px" }}>{s.titulo}</h3>
          {s.itens.map((it) => { const [l, cor] = ROT[c.itens[it.id]] || ["—", "#999"]; return (
            <div className="item" key={it.id} style={{ alignItems: "center" }}><img src={imagem(it.id)} alt="" style={{ width: 44, height: 44 }} />
              <div className="txt">{it.label}</div><b style={{ color: cor, whiteSpace: "nowrap" }}>{l}</b></div>); })}</div>))}
      </section>
      <section className="card"><h2>3. Irregularidades</h2><p><b>{c.irregularidade ? "SIM" : "NÃO"}</b></p>{c.descricao && <p style={{ whiteSpace: "pre-wrap" }}>{c.descricao}</p>}</section>
      <section className="card"><h2>4. Resultado</h2><span className={`tag ${c.resultado}`}>{c.resultado} PARA OPERAÇÃO</span>
        {c.observacoes && <p style={{ whiteSpace: "pre-wrap" }}>Observações: {c.observacoes}</p>}</section>
      <section className="card"><h2>5. Responsabilidade</h2><p>Operador: <b>{c.operador}</b></p>
        {c.assinatura && <img src={c.assinatura} alt="Assinatura" style={{ maxWidth: "100%", border: "1px solid var(--borda)", borderRadius: 8 }} />}
        <p>Data e horário da inspeção: <b>{new Date(c.inspecao_em).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</b></p></section>
    </main></>);
}
