"use client";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "./icons";

const ITENS = [
  { href: "/", label: "Visão geral", icon: "grid" },
  { href: "/experts", label: "Experts", icon: "users" },
  { href: "/logs", label: "Histórico", icon: "history" },
  { href: "/config", label: "Configurações", icon: "sliders" },
];

export function Marca() {
  return (
    <span className="brand">
      <span className="logo"><Icon name="loop" size={18} /></span>
      <span className="wordmark">reeng<i>.</i></span>
    </span>
  );
}

// Casca do painel: barra lateral + topo. Envolve o conteudo de cada pagina.
export default function Shell({ title, subtitle, actions, children }) {
  const path = usePathname();
  const router = useRouter();

  async function sair() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  }

  const ativo = (href) => (href === "/" ? path === "/" : path.startsWith(href));
  const idx = ITENS.findIndex((i) => ativo(i.href));
  const hoje = new Date().toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo", weekday: "short", day: "2-digit", month: "short",
  });

  return (
    <div className="app">
      <aside className="side">
        <Marca />
        <div className="side-label">// painel</div>
        <nav>
          {ITENS.map((i, n) => (
            <Link key={i.href} href={i.href} className={ativo(i.href) ? "active" : ""}>
              <span className="num">0{n + 1}</span>
              <Icon name={i.icon} />
              <span>{i.label}</span>
            </Link>
          ))}
        </nav>
        <div className="side-foot">
          <span className="dot" />fluxo de bloqueio
        </div>
      </aside>

      <div className="main">
        <header className="top">
          <span className="mono crumb">{hoje}</span>
          <button className="chip" onClick={sair}><Icon name="logout" size={14} />Sair</button>
        </header>
        <main className="content">
          <div className="page-head">
            <div>
              {idx >= 0 && <div className="eyebrow">0{idx + 1} / {ITENS[idx].label.toLowerCase()}</div>}
              <h1>{title}</h1>
              {subtitle && <p className="sub">{subtitle}</p>}
            </div>
            {actions && <div className="row">{actions}</div>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
