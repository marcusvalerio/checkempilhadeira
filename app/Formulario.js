"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SECOES, ITENS, TURNOS, imagem } from "@/lib/checklist";

const hoje = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };

export default function Formulario() {
  const sp = useSearchParams();
  const empQR = sp.get("e") || "";
  const [f, setF] = useState({ data: hoje(), turno: "", operador: "", empilhadeira: empQR, descricao: "", observacoes: "", resultado: "", irregularidade: null });
  const [itens, setItens] = useState({});
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [feito, setFeito] = useState(null);
  const canvas = useRef(null);
  const [assinou, setAssinou] = useState(false);

  useEffect(() => { try { const n = localStorage.getItem("operador"); if (n) setF((x) => ({ ...x, operador: n })); } catch {} }, []);

  const temNok = Object.values(itens).includes("nok");
  const irregular = temNok || f.irregularidade === true;
  const respondidos = ITENS.filter((i) => itens[i.id]).length;
  const progresso = Math.round((respondidos / ITENS.length) * 100);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  useEffect(() => { if (temNok) setF((x) => ({ ...x, irregularidade: true, resultado: x.resultado || "REPROVADA" })); }, [temNok]);

  // Assinatura
  useEffect(() => {
    const c = canvas.current; if (!c) return;
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
  }, [feito]);
  const limpar = () => { const c = canvas.current; c.getContext("2d").clearRect(0, 0, c.width, c.height); setAssinou(false); };

  async function enviar() {
    setErro("");
    const falta = ITENS.find((i) => !itens[i.id]);
    if (!f.turno || !f.operador || !f.empilhadeira) return setErro("Preencha a identificação (turno, operador e empilhadeira).");
    if (falta) { document.getElementById("it-" + falta.id)?.scrollIntoView({ behavior: "smooth", block: "center" }); return setErro(`Falta responder: ${falta.label}`); }
    if (f.irregularidade === null && !temNok) return setErro("Informe se foi identificada alguma irregularidade.");
    if (irregular && !f.descricao.trim()) return setErro("Descreva a irregularidade encontrada.");
    if (!f.resultado) return setErro("Informe o resultado da inspeção.");
    if (!assinou) return setErro("Assine no campo de assinatura.");
    setEnviando(true);
    try {
      const res = await fetch("/api/checkins", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, irregularidade: irregular, itens, assinatura: canvas.current.toDataURL("image/png") }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.erro || "Erro ao enviar");
      try { localStorage.setItem("operador", f.operador); } catch {}
      setFeito({ ...j, resultado: f.resultado });
      window.scrollTo(0, 0);
    } catch (e) { setErro(e.message); } finally { setEnviando(false); }
  }

  if (feito) return (
    <><header className="cab"><div><small>Inspeção pré-operacional</small><h1>Checklist diário</h1></div></header>
    <main><div className="card sucesso">
      <div className="ico">{feito.resultado === "APROVADA" ? "✅" : "⛔"}</div>
      <h2>Checklist nº {feito.id} enviado!</h2>
      <p>{new Date(feito.inspecao_em).toLocaleString("pt-BR")}</p>
      {feito.resultado === "REPROVADA" && <p className="aviso"><b>Não utilize a empilhadeira.</b> Comunique imediatamente o responsável. A máquina só pode voltar a operar após avaliação e liberação por pessoa autorizada.</p>}
      <button className="btn sec" style={{ marginTop: 16 }} onClick={() => location.reload()}>Novo checklist</button>
    </div></main></>
  );

  return (
    <>
      <header className="cab">
        <div><small>Inspeção pré-operacional</small><h1>Checklist diário</h1></div>
        <div className="anel" style={{ "--p": progresso }}><span>{respondidos}/{ITENS.length}</span></div>
      </header>
      <main>
        <section className="card">
          <h2>1. Identificação</h2>
          <label className="campo">Data</label><input type="date" value={f.data} onChange={set("data")} />
          <label className="campo">Turno</label>
          <select value={f.turno} onChange={set("turno")}><option value="">Selecione…</option>{TURNOS.map((t) => <option key={t}>{t}</option>)}</select>
          <label className="campo">Operador</label><input value={f.operador} onChange={set("operador")} placeholder="Nome completo" autoComplete="name" />
          <label className="campo">Empilhadeira (ID/Patrimônio)</label>
          <input value={f.empilhadeira} onChange={set("empilhadeira")} placeholder="Ex.: EMP-01" readOnly={!!empQR} />
        </section>

        {SECOES.map((s) => (
          <section className="card" key={s.titulo}>
            <div className="sec-tit"><h2>{s.titulo}</h2><span>{s.itens.filter((i) => itens[i.id]).length}/{s.itens.length}</span></div>
            <div className="grade">
            {s.itens.map((it) => (
              <div className={`tile ${itens[it.id] || ""}`} key={it.id} id={"it-" + it.id}>
                <img src={imagem(it.id)} alt="" />
                <b>{it.label}</b>
                <div className="opcoes mini">
                    {[["ok", "OK"], ["nok", "Não OK"], ...(it.na ? [["na", "N/A"]] : [])].map(([v, l]) => (
                      <button key={v} type="button" className={`op ${v} ${itens[it.id] === v ? "sel" : ""}`}
                        onClick={() => setItens((x) => ({ ...x, [it.id]: v }))}>{l}</button>
                    ))}
                </div>
              </div>
            ))}
            </div>
          </section>
        ))}

        <section className="card">
          <h2>3. Registro de irregularidades</h2>
          <p style={{ marginTop: 0, fontSize: 14 }}>Foi identificada alguma irregularidade?</p>
          <div className="opcoes">
            <button type="button" disabled={temNok} className={`op grande ok ${!irregular && f.irregularidade === false ? "sel" : ""}`} onClick={() => setF((x) => ({ ...x, irregularidade: false }))}>NÃO</button>
            <button type="button" className={`op grande nok ${irregular ? "sel" : ""}`} onClick={() => setF((x) => ({ ...x, irregularidade: true }))}>SIM</button>
          </div>
          {temNok && <p className="aviso">Há itens marcados como "Não OK".</p>}
          {irregular && <><label className="campo">Descrição da irregularidade</label>
            <textarea value={f.descricao} onChange={set("descricao")} placeholder={"Itens com problema: " + ITENS.filter((i) => itens[i.id] === "nok").map((i) => i.label).join("; ")} /></>}
        </section>

        <section className="card">
          <h2>4. Resultado da inspeção</h2>
          <div className="opcoes">
            <button type="button" className={`op grande ok ${f.resultado === "APROVADA" ? "sel" : ""}`} onClick={() => setF((x) => ({ ...x, resultado: "APROVADA" }))}>APROVADA PARA OPERAÇÃO</button>
            <button type="button" className={`op grande nok ${f.resultado === "REPROVADA" ? "sel" : ""}`} onClick={() => setF((x) => ({ ...x, resultado: "REPROVADA" }))}>REPROVADA PARA OPERAÇÃO</button>
          </div>
          {temNok && f.resultado === "APROVADA" && <p className="aviso">Atenção: existem itens "Não OK". Em caso de defeito que comprometa a segurança, a empilhadeira não deve ser utilizada.</p>}
          <label className="campo">Observações</label><textarea value={f.observacoes} onChange={set("observacoes")} />
        </section>

        <section className="card">
          <h2>5. Responsabilidade</h2>
          <p style={{ margin: "0 0 8px", fontSize: 14 }}>Operador: <b>{f.operador || "—"}</b></p>
          <label className="campo">Assinatura (desenhe com o dedo)</label>
          <canvas ref={canvas} className="assin" />
          <button type="button" className="btn sec" style={{ marginTop: 12 }} onClick={limpar}>Limpar assinatura</button>
          <p style={{ fontSize: 12, color: "var(--cinza)" }}>A data e o horário da inspeção são registrados automaticamente no envio.</p>
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
      </main>
      <div className="fixo">
        {erro && <div className="erro">{erro}</div>}
        <button className="btn pilula" disabled={enviando} onClick={enviar}>
          <span className="pb"><span style={{ width: progresso + "%" }} /></span>
          {enviando ? "Enviando…" : "Enviar checklist"}</button>
      </div>
    </>
  );
}
