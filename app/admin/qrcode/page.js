import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import Gerador from "./Gerador";
export const dynamic = "force-dynamic";
export default async function QR() {
  if (!(await isAdmin())) redirect("/admin");
  return (<><header className="cab noprint"><div><small>Admin</small><h1>QR Codes</h1></div></header><Gerador /></>);
}
