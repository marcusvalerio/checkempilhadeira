"use client";
import { useState } from "react";
export default function Login() {
  const [senha, setSenha] = useState(""), [erro, setErro] = useState("");
  async function entrar(e) {
    e.preventDefault();
    const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ senha }) });
    if (r.ok) location.reload(); else setErro("Senha incorreta");
  }
  return (<main><form className="card" onSubmit={entrar}>
    <h2>Acesso administrativo</h2>{erro && <div className="erro">{erro}</div>}
    <label className="campo">Senha</label><input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoFocus />
    <button className="btn" style={{ marginTop: 14 }}>Entrar</button></form></main>);
}
