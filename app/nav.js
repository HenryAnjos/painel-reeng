"use client";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "./icons";

const ITENS = [
  { href: "/", label: "Dashboard", icon: "grid" },
  { href: "/experts", label: "Experts", icon: "users" },
  { href: "/logs", label: "Histórico", icon: "history" },
  { href: "/config", label: "Configurações", icon: "sliders" },
];

// Casca do painel: barra lateral + topo. Envolve o conteudo de cada pagina.
export default function Shell({ title, subtitle, actions, children }) {
  const path = usePathname();
  const router = useRouter();

  async function sair() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  }

  const ativo = (href) => (href === "/" ? path === "/" : path.startsWith(href));
  const atual = ITENS.find((i) => ativo(i.href));

  return (
    <div className="app">
      <aside className="side">
        <div className="brand">
          <span className="logo"><Icon name="bolt" size={16} /></span>
          <span>Reeng<b>Experts</b></span>
        </div>
        <div className="side-label">Navegação</div>
        <nav>
          {ITENS.map((i) => (
            <Link key={i.href} href={i.href} className={ativo(i.href) ? "active" : ""}>
              <Icon name={i.icon} />
              <span>{i.label}</span>
            </Link>
          ))}
        </nav>
        <div className="side-foot">Reengajamento v1.0</div>
      </aside>

      <div className="main">
        <header className="top">
          <div className="top-left">
            <span className="mono crumb">{atual ? atual.label : ""}</span>
          </div>
          <div className="top-right">
            <button className="chip" onClick={sair}><Icon name="logout" size={14} />Sair</button>
          </div>
        </header>
        <main className="content">
          <div className="page-head">
            <div>
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
