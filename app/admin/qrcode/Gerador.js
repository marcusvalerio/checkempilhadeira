"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

async function baixar({ id, url }) {
  const W = 1000, P = 80, Q = W - P * 2, H = W + 220;
  const qr = document.createElement("canvas");
  await QRCode.toCanvas(qr, url, { width: Q, margin: 0, errorCorrectionLevel: "M" });
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d");
  x.fillStyle = "#fff"; x.fillRect(0, 0, W, H);
  x.drawImage(qr, P, P);
  x.fillStyle = "#16181D"; x.textAlign = "center";
  x.font = "bold 72px system-ui, Arial, sans-serif"; x.fillText(id || "Checklist", W / 2, W + 70);
  x.fillStyle = "#6B7280"; x.font = "36px system-ui, Arial, sans-serif";
  x.fillText("Checklist diário · escaneie antes de operar", W / 2, W + 140);
  const a = document.createElement("a");
  a.href = c.toDataURL("image/png");
  a.download = `qrcode-${(id || "geral").replace(/[^\w-]+/g, "_")}.png`;
  document.body.appendChild(a); a.click(); a.remove();
}

export default function Gerador() {
  const [ids, setIds] = useState("EMP-01\nEMP-02");
  const [qrs, setQrs] = useState([]);
  useEffect(() => {
    const base = location.origin + "/";
    const lista = ["", ...new Set(ids.split("\n").map((s) => s.trim()).filter(Boolean))];
    Promise.all(lista.map(async (id) => {
      const url = id ? `${base}?e=${encodeURIComponent(id)}` : base;
      return { id, url, svg: await QRCode.toString(url, { type: "svg", margin: 1, width: 220 }) };
    })).then(setQrs);
  }, [ids]);
  async function baixarTodos() { for (const q of qrs) { await baixar(q); await new Promise((r) => setTimeout(r, 400)); } }
  return (<main className="wide">
    <nav className="chips noprint"><a href="/admin">← Voltar</a></nav>
    <div className="card noprint"><h2>Empilhadeiras</h2>
      <p style={{ fontSize: 14, marginTop: 0, color: "var(--cinza)" }}>Digite um ID por linha. Cada QR Code já abre o checklist com a empilhadeira preenchida.</p>
      <textarea value={ids} onChange={(e) => setIds(e.target.value)} rows={5} />
      <div className="opcoes" style={{ marginTop: 12 }}>
        <button className="btn sec" onClick={baixarTodos}>Baixar todos</button>
        <button className="btn sec" onClick={() => print()}>Imprimir</button>
      </div></div>
    <div className="qr-grade">
      {qrs.map((q) => (<div className="card qr-card" key={q.url}>
        <b>{q.id || "Geral (qualquer empilhadeira)"}</b>
        <div className="qr-img" dangerouslySetInnerHTML={{ __html: q.svg }} />
        <small>Checklist diário · escaneie antes de operar</small>
        <button className="btn noprint" onClick={() => baixar(q)}>Baixar PNG</button></div>))}
    </div></main>);
}
