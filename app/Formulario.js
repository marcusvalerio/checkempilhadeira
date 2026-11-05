"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SECOES, ITENS, TURNOS, imagem } from "@/lib/checklist";

const hoje = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const SECAO_DE = Object.fromEntries(SECOES.flatMap((s) => s.itens.map((i) => [i.id, s.titulo])));
// Passos: identificação, 16 itens, irregularidade, resultado, assinatura
const PASSOS = ["ident", ...ITENS.map((i) => i.id), "irreg", "result", "assin"];

export default function Formulario() {
  const sp = useSearchParams();
  const empQR = sp.get("e") || "";
  const [f, setF] = useState({ data: hoje(), turno: "", operador: "", empilhadeira: empQR, descricao: "", observacoes: "", resultado: "", irregularidade: null });
  const [itens, setItens] = useState({});
  const [passo, setPasso] = useState(0);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [feito, setFeito] = useState(null);
  const canvas = useRef(null);
  const [assinou, setAssinou] = useState(false);

  useEffect(() => { try { const n = localStorage.getItem("operador"); if (n) setF((x) => ({ ...x, operador: n })); } catch {} }, []);

  const temNok = Object.values(itens).includes("nok");
  const irregular = temNok || f.irregularidade === true;
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const atual = PASSOS[passo];
  const item = ITENS.find((i) => i.id === atual);
  const progresso = Math.round((passo / (PASSOS.length - 1)) * 100);

  useEffect(() => { if (temNok) setF((x) => ({ ...x, irregularidade: true, resultado: x.resultado || "REPROVADA" })); }, [temNok]);
  useEffect(() => { setErro(""); window.scrollTo(0, 0); }, [passo]);

  // Assinatura
  useEffect(() => {
    const c = canvas.current; if (!c) return;
    setAssinou(false);
    const r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    c.width = r.width * dpr; c.height = r.height * dpr;
    const ctx = c.getContext("2d"); ctx.scale(dpr, dpr); ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.strokeStyle = "#111827";
    let des = false;
    const pos = (e) => { const b = c.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
    const down = (e) => { des = true; c.setPointerCapture(e.pointerId); ctx.beginPath(); ctx.moveTo(...pos(e)); };
    const move = (e) => { if (!des) return; ctx.lineTo(...pos(e)); ctx.stroke(); setAssinou(true); };
    const up = () => { des = false; };
    c.addEventListener("pointerdown", down); c.addEventListener("pointermove", move); c.addEventListener("pointerup", up); c.addEventListener("pointercancel", up);
    return () => { c.removeEventListener("pointerdown", down); c.removeEventListener("pointermove", move); c.removeEventListener("pointerup", up); c.removeEventListener("pointercancel", up); };
  }, [atual]);
  const limpar = () => { const c = canvas.current; c.getContext("2d").clearRect(0, 0, c.width, c.height); setAssinou(false); };

  function validar() {
    if (atual === "ident" && (!f.turno || !f.operador.trim() || !f.empilhadeira.trim())) return "Preencha turno, operador e empilhadeira.";
    if (item && !itens[item.id]) return "Escolha uma opção para continuar.";
    if (atual === "irreg") {
      if (f.irregularidade === null && !temNok) return "Informe se foi identificada alguma irregularidade.";
      if (irregular && !f.descricao.trim()) return "Descreva a irregularidade encontrada.";
    }
    if (atual === "result" && !f.resultado) return "Informe o resultado da inspeção.";
    return "";
  }
  function avancar() { const e = validar(); if (e) return setErro(e); setPasso((p) => Math.min(p + 1, PASSOS.length - 1)); }
  function responder(v) { setItens((x) => ({ ...x, [item.id]: v })); setTimeout(() => setPasso((p) => p + 1), 180); }

  async function enviar() {
    if (!assinou) return setErro("Assine no campo de assinatura.");
    setEnviando(true); setErro("");
    try {
      const res = await fetch("/api/checkins", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, irregularidade: irregular, itens, assinatura: canvas.current.toDataURL("image/png") }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.erro || "Erro ao enviar");
      try { localStorage.setItem("operador", f.operador); } catch {}
      setFeito({ ...j, resultado: f.resultado });
    } catch (e) { setErro(e.message); } finally { setEnviando(false); }
  }

  const Cab = ({ sub }) => (
    <header className="cab">
      <div><small>{sub}</small><h1>Checklist diário</h1></div>
      {!feito && <div className="anel" style={{ "--p": progresso }}><span>{passo + 1}/{PASSOS.length}</span></div>}
    </header>
  );

  if (feito) return (
    <><Cab sub="Inspeção pré-operacional" />
    <main><div className="card sucesso">
      <div className="ico">{feito.resultado === "APROVADA" ? "✅" : "⛔"}</div>
      <h2>Checklist nº {feito.id} enviado!</h2>
      <p>{new Date(feito.inspecao_em).toLocaleString("pt-BR")}</p>
      {feito.resultado === "REPROVADA" && <p className="aviso"><b>Não utilize a empilhadeira.</b> Comunique imediatamente o responsável. A máquina só pode voltar a operar após avaliação e liberação por pessoa autorizada.</p>}
      <button className="btn sec" style={{ marginTop: 16 }} onClick={() => location.reload()}>Novo checklist</button>
    </div></main></>
  );

  const nItem = item ? ITENS.indexOf(item) + 1 : 0;
  const sub = item ? `${SECAO_DE[item.id]} · ${nItem} de ${ITENS.length}` : { ident: "1. Identificação", irreg: "3. Irregularidades", result: "4. Resultado", assin: "5. Responsabilidade" }[atual];

  return (
    <>
      <Cab sub={sub} />
      <main key={atual} className="passo">
        {atual === "ident" && (
          <section className="card">
            <h2>Identificação</h2>
            <label className="campo">Data</label><input type="date" value={f.data} onChange={set("data")} />
            <label className="campo">Turno</label>
            <select value={f.turno} onChange={set("turno")}><option value="">Selecione…</option>{TURNOS.map((t) => <option key={t}>{t}</option>)}</select>
            <label className="campo">Operador</label><input value={f.operador} onChange={set("operador")} placeholder="Nome completo" autoComplete="name" />
            <label className="campo">Empilhadeira (ID/Patrimônio)</label>
            <input value={f.empilhadeira} onChange={set("empilhadeira")} placeholder="Ex.: EMP-01" readOnly={!!empQR} />
          </section>
        )}

        {item && (
          <section className={`card pergunta ${itens[item.id] || ""}`}>
            <img src={imagem(item.id)} alt="" />
            <h2>{item.label}</h2>
            {item.dica && <p className="dica">{item.dica}</p>}
            <div className="resp">
              <button type="button" className={`op grande ok ${itens[item.id] === "ok" ? "sel" : ""}`} onClick={() => responder("ok")}>✓ OK</button>
              <button type="button" className={`op grande nok ${itens[item.id] === "nok" ? "sel" : ""}`} onClick={() => responder("nok")}>✗ Não OK</button>
              {item.na && <button type="button" className={`op grande na ${itens[item.id] === "na" ? "sel" : ""}`} onClick={() => responder("na")}>Não se aplica</button>}
            </div>
          </section>
        )}

        {atual === "irreg" && (
          <section className="card">
            <h2>Foi identificada alguma irregularidade?</h2>
            <div className="opcoes">
              <button type="button" disabled={temNok} className={`op grande ok ${!irregular && f.irregularidade === false ? "sel" : ""}`} onClick={() => setF((x) => ({ ...x, irregularidade: false }))}>NÃO</button>
              <button type="button" className={`op grande nok ${irregular ? "sel" : ""}`} onClick={() => setF((x) => ({ ...x, irregularidade: true }))}>SIM</button>
            </div>
            {temNok && <p className="aviso">Itens marcados como "Não OK": {ITENS.filter((i) => itens[i.id] === "nok").map((i) => i.label).join("; ")}.</p>}
            {irregular && <><label className="campo">Descrição da irregularidade</label>
              <textarea value={f.descricao} onChange={set("descricao")} placeholder="Descreva o problema encontrado" /></>}
          </section>
        )}

        {atual === "result" && (
          <section className="card">
            <h2>Resultado da inspeção</h2>
            <div className="resp">
              <button type="button" className={`op grande ok ${f.resultado === "APROVADA" ? "sel" : ""}`} onClick={() => setF((x) => ({ ...x, resultado: "APROVADA" }))}>APROVADA PARA OPERAÇÃO</button>
              <button type="button" className={`op grande nok ${f.resultado === "REPROVADA" ? "sel" : ""}`} onClick={() => setF((x) => ({ ...x, resultado: "REPROVADA" }))}>REPROVADA PARA OPERAÇÃO</button>
            </div>
            {temNok && f.resultado === "APROVADA" && <p className="aviso">Atenção: existem itens "Não OK". Em caso de defeito que comprometa a segurança, a empilhadeira não deve ser utilizada.</p>}
            <label className="campo">Observações (opcional)</label><textarea value={f.observacoes} onChange={set("observacoes")} />
          </section>
        )}

        {atual === "assin" && (<>
          <section className="card">
            <h2>Assinatura</h2>
            <p style={{ margin: "0 0 12px", fontSize: 14 }}>Operador: <b>{f.operador}</b> · {f.empilhadeira}</p>
            <canvas ref={canvas} className="assin" />
            <button type="button" className="btn sec" style={{ marginTop: 12 }} onClick={limpar}>Limpar assinatura</button>
            <p style={{ fontSize: 12, color: "var(--cinza)", marginBottom: 0 }}>A data e o horário da inspeção são registrados automaticamente no envio.</p>
          </section>
          <section className="card orient">
            <h2>Orientações importantes</h2>
            <ol>
              <li>A inspeção deve ser realizada antes do início das atividades.</li>
              <li>Qualquer irregularidade deve ser comunicada imediatamente ao responsável.</li>
              <li>Em caso de defeito que comprometa a segurança, a empilhadeira não deve ser utilizada até que seja avaliada e liberada por pessoa autorizada.</li>
              <li>O checklist deve ser arquivado para controle e rastreabilidade das inspeções.</li>
            </ol>
          </section>
        </>)}
      </main>

      <div className="fixo">
        {erro && <div className="erro">{erro}</div>}
        <div className="nav-passos">
          {passo > 0 && <button className="btn voltar" onClick={() => setPasso((p) => p - 1)} aria-label="Voltar">←</button>}
          {atual === "assin"
            ? <button className="btn pilula" disabled={enviando} onClick={enviar}>{enviando ? "Enviando…" : "Enviar checklist"}</button>
            : (!item || itens[item.id]) && <button className="btn pilula" onClick={avancar}>Continuar</button>}
        </div>
      </div>
    </>
  );
}
