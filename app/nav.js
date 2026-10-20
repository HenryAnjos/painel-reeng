"use client";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

export default function Nav() {
  const path = usePathname();
  const router = useRouter();
  if (path === "/login") return null;

  async function sair() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  }

  const item = (href, label) => (
    <Link href={href} className={path === href ? "active" : ""}>{label}</Link>
  );

  return (
    <div className="nav">
      <span className="brand">Reengajamento</span>
      {item("/", "Experts")}
      {item("/config", "Config")}
      {item("/logs", "Logs")}
      <button className="ghost" onClick={sair}>Sair</button>
    </div>
  );
}
