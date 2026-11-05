"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
export default function Gerador() {
  const [ids, setIds] = useState("EMP-01\nEMP-02");
  const [qrs, setQrs] = useState([]);
  useEffect(() => {
    const base = location.origin + "/";
    const lista = ["", ...ids.split("\n").map((s) => s.trim()).filter(Boolean)];
    Promise.all(lista.map(async (id) => {
      const url = id ? `${base}?e=${encodeURIComponent(id)}` : base;
      return { id, url, svg: await QRCode.toString(url, { type: "svg", margin: 1, width: 220 }) };
    })).then(setQrs);
  }, [ids]);
  return (<main className="wide">
    <div className="card noprint"><h2>Empilhadeiras</h2>
      <p style={{ fontSize: 14, marginTop: 0 }}>Um ID por linha. Cada QR já abre o checklist com a empilhadeira preenchida. Imprima e cole na máquina.</p>
      <textarea value={ids} onChange={(e) => setIds(e.target.value)} rows={5} />
      <button className="btn" style={{ marginTop: 10 }} onClick={() => print()}>Imprimir QR Codes</button></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
      {qrs.map((q) => (<div className="card" key={q.url} style={{ textAlign: "center", breakInside: "avoid" }}>
        <b style={{ fontSize: 18 }}>{q.id || "Geral (qualquer empilhadeira)"}</b>
        <div dangerouslySetInnerHTML={{ __html: q.svg }} style={{ margin: "8px auto", width: 220 }} />
        <small style={{ wordBreak: "break-all", color: "var(--cinza)" }}>Checklist diário · escaneie antes de operar</small></div>))}
    </div></main>);
}
