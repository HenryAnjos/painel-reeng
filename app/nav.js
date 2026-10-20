"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Icon from "./icons";
import { api, useMe, limparMe, podeGerir, PAPEIS } from "./ui";

const ITENS = [
  { href: "/", label: "Visão geral", icon: "grid" },
  { href: "/experts", label: "Experts", icon: "users" },
  { href: "/logs", label: "Histórico", icon: "history" },
  { href: "/equipe", label: "Equipe", icon: "team" },
  { href: "/integracao", label: "Integração", icon: "plug", gestao: true },
  { href: "/config", label: "Configurações", icon: "sliders", gestao: true },
  { href: "/plataforma", label: "Plataforma", icon: "shield", plataforma: true },
];

export function Marca() {
  return (
    <span className="brand">
      <span className="logo"><Icon name="loop" size={18} /></span>
      <span className="wordmark">reeng<i>.</i></span>
    </span>
  );
}

const iniciais = (nome = "") => nome.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

function Seletor({ me }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const fora = (e) => ref.current && !ref.current.contains(e.target) && setAberto(false);
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);

  async function trocar(id) {
    await api("/api/workspace/trocar", { method: "POST", body: { id } });
    limparMe();
    location.href = "/";
  }
  async function criar() {
    const nome = prompt("Nome do novo workspace (ex.: nome da empresa ou do cliente)");
    if (!nome) return;
    try {
      await api("/api/workspaces", { method: "POST", body: { nome } });
      limparMe();
      location.href = "/";
    } catch (e) { alert(e.message); }
  }

  const ws = me?.workspace;
  return (
    <div className="ws" ref={ref}>
      <button className="ws-btn" onClick={() => setAberto(!aberto)} disabled={!me}>
        <span className="ws-av">{iniciais(ws?.nome || "…")}</span>
        <span className="ws-txt">
          <b>{ws?.nome || "…"}</b>
          <small>{ws ? `${ws.limites.nome} · ${me.suporte ? "Suporte" : PAPEIS[me.papel]}` : " "}</small>
        </span>
        <Icon name="chevron" size={14} />
      </button>
      {aberto && me && (
        <div className="ws-menu">
          <div className="ws-menu-label">seus workspaces</div>
          {me.workspaces.map((w) => (
            <button key={w.id} className={w.id === ws.id ? "on" : ""} onClick={() => trocar(w.id)}>
              <span className="ws-av sm">{iniciais(w.nome)}</span>
              <span className="grow">{w.nome}</span>
              {w.id === ws.id && <Icon name="check" size={14} />}
            </button>
          ))}
          <button onClick={criar}><Icon name="plus" size={14} /><span className="grow">Novo workspace</span></button>
        </div>
      )}
    </div>
  );
}

function CriarWs() {
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");
  async function criar(e) {
    e.preventDefault();
    try {
      await api("/api/workspaces", { method: "POST", body: { nome } });
      limparMe();
      location.href = "/";
    } catch (x) { setErro(x.message); }
  }
  return (
    <form onSubmit={criar} className="row">
      <input placeholder="Nome da empresa" value={nome} onChange={(e) => setNome(e.target.value)} />
      <button>Criar</button>
      {erro && <span className="msg err">{erro}</span>}
    </form>
  );
}

// Casca do painel: barra lateral + topo. Envolve o conteudo de cada pagina.
export default function Shell({ title, subtitle, actions, children }) {
  const path = usePathname();
  const me = useMe();

  async function sair() {
    await fetch("/api/auth/logout", { method: "POST" });
    limparMe();
    location.href = "/login";
  }

  const itens = ITENS.filter((i) =>
    (!i.gestao || !me || podeGerir(me)) && (!i.plataforma || me?.usuario.admin_plataforma));
  const ativo = (href) => (href === "/" ? path === "/" : path.startsWith(href));
  const idx = itens.findIndex((i) => ativo(i.href));
  const hoje = new Date().toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo", weekday: "short", day: "2-digit", month: "short",
  });

  if (me && !me.workspace) {
    return (
      <div className="login-page">
        <div className="login">
          <Marca />
          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-title"><Icon name="plus" size={14} />você ainda não tem um workspace</div>
            <p className="muted" style={{ marginTop: 0 }}>Crie um para começar ou peça um convite a quem já usa o reeng.</p>
            <CriarWs />
            <button className="ghost" style={{ marginTop: 16 }} onClick={sair}><Icon name="logout" size={14} />Sair</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="side">
        <Marca />
        <Seletor me={me} />
        <div className="side-label">// painel</div>
        <nav>
          {itens.map((i, n) => (
            <Link key={i.href} href={i.href} className={ativo(i.href) ? "active" : ""}>
              <span className="num">0{n + 1}</span>
              <Icon name={i.icon} />
              <span>{i.label}</span>
            </Link>
          ))}
        </nav>
        <div className="side-foot">
          <span className="user-av">{iniciais(me?.usuario.nome)}</span>
          <span className="user-txt">
            <b>{me?.usuario.nome || "…"}</b>
            <small>{me?.usuario.email}</small>
          </span>
          <button className="icon-btn" title="Sair" onClick={sair}><Icon name="logout" size={15} /></button>
        </div>
      </aside>

      <div className="main">
        <header className="top">
          <span className="mono crumb">{hoje}</span>
          {me && (
            <Link href={podeGerir(me) ? "/config#plano" : "#"} className="chip">
              <span className="dot" />plano {me.workspace.limites.nome.toLowerCase()}
            </Link>
          )}
        </header>
        {me?.suporte && (
          <div className="suporte">
            <Icon name="shield" size={15} />
            <span>Modo suporte: você está em <b>{me.workspace.nome}</b> como dono. Tudo que fizer vale para este cliente.</span>
            <button className="sm" onClick={async () => {
              await api("/api/workspace/trocar", { method: "POST", body: { id: null } });
              limparMe();
              location.href = "/plataforma";
            }}>Sair do modo suporte</button>
          </div>
        )}
        <main className="content">
          <div className="page-head">
            <div>
              {idx >= 0 && <div className="eyebrow">0{idx + 1} / {itens[idx].label.toLowerCase()}</div>}
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
