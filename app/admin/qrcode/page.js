import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import Gerador from "./Gerador";
export const dynamic = "force-dynamic";
export default async function QR() {
  if (!(await isAdmin())) redirect("/admin");
  return (<><header className="topo noprint"><h1>QR Codes</h1><div className="links" style={{ marginTop: 6 }}><a href="/admin">← Voltar</a></div></header><Gerador /></>);
}
