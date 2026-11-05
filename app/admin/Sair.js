"use client";
export default function Sair() {
  return <a href="#" onClick={async (e) => { e.preventDefault(); await fetch("/api/admin/login", { method: "DELETE" }); location.href = "/admin"; }}>Sair</a>;
}
