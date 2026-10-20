"use client";
import { useEffect, useState } from "react";
import Icon from "./icons";

// fetch JSON com erro amigavel ({ erro } vindo da API)
export async function api(url, opts = {}) {
  const r = await fetch(url, {
    ...opts,
    headers: opts.body ? { "Content-Type": "application/json", ...(opts.headers || {}) } : opts.headers,
    body: opts.body && typeof opts.body !== "string" ? JSON.stringify(opts.body) : opts.body,
  });
  if (r.status === 401 && typeof window !== "undefined" && !location.pathname.startsWith("/login")) {
    location.href = "/login";
  }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.erro || `Erro ${r.status}`);
  return data;
}

// Sessao atual (usuario, workspace, papel). Cacheada entre telas.
let cacheMe = null;
let promessaMe = null;
export function useMe() {
  const [me, setMe] = useState(cacheMe);
  useEffect(() => {
    if (cacheMe) return;
    promessaMe ||= api("/api/me").then((d) => (cacheMe = d)).catch(() => (promessaMe = null));
    promessaMe.then((d) => d && setMe(d));
  }, []);
  return me;
}
export function limparMe() { cacheMe = null; promessaMe = null; }

export const PAPEIS = { dono: "Dono", admin: "Admin", leitor: "Leitor" };
export const podeGerir = (me) => me && (me.papel === "dono" || me.papel === "admin");

export function Vazio({ icon, children }) {
  return (
    <div className="empty">
      <Icon name={icon} size={28} />
      <div>{children}</div>
    </div>
  );
}

export function Copiar({ texto, rotulo = "Copiar" }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" className="ghost sm" onClick={async () => {
      try { await navigator.clipboard.writeText(texto); setOk(true); setTimeout(() => setOk(false), 1500); } catch {}
    }}>
      <Icon name={ok ? "check" : "copy"} size={13} />{ok ? "Copiado" : rotulo}
    </button>
  );
}

export function Paginacao({ pagina, total, por, onChange }) {
  const paginas = Math.max(1, Math.ceil(total / por));
  return (
    <div className="pager">
      <span className="mono muted">{total.toLocaleString("pt-BR")} registros · página {pagina} de {paginas}</span>
      <div className="row">
        <button className="ghost sm" disabled={pagina <= 1} onClick={() => onChange(pagina - 1)}>← Anterior</button>
        <button className="ghost sm" disabled={pagina >= paginas} onClick={() => onChange(pagina + 1)}>Próxima →</button>
      </div>
    </div>
  );
}

export function Msg({ m }) {
  if (!m) return null;
  return <span className={`msg ${m.ok ? "ok" : "err"}`}>{m.texto}</span>;
}

export function Uso({ usado, limite, rotulo }) {
  const pct = Math.min(100, (usado / Math.max(1, limite)) * 100);
  return (
    <div className="uso">
      <div className="uso-top"><span>{rotulo}</span><span className="mono">{usado} / {limite}</span></div>
      <div className="uso-bar"><i className={pct >= 100 ? "cheio" : ""} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

// ---------- dialogos do painel (no lugar de confirm/prompt/alert) ----------
// dialogo({ titulo, texto, botao, perigo, icone, digitar, campo, soOk })
//   -> true/false; com `campo` -> texto digitado ou null.
//   `digitar`: o botao so libera quando a pessoa digita exatamente esse texto.
let abrirDialogo = null;
export function dialogo(opts) {
  return new Promise((resolve) => {
    if (!abrirDialogo) return resolve(opts.campo ? null : false);
    abrirDialogo({ ...opts, resolve });
  });
}

export function DialogoHost() {
  const [d, setD] = useState(null);
  const [valor, setValor] = useState("");
  useEffect(() => {
    abrirDialogo = (o) => { setValor(""); setD(o); };
    return () => { abrirDialogo = null; };
  }, []);
  useEffect(() => {
    if (!d) return;
    const esc = (e) => e.key === "Escape" && fechar(false);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  });
  if (!d) return null;

  function fechar(ok) {
    d.resolve(d.campo ? (ok ? valor.trim() : null) : ok);
    setD(null);
  }
  const liberado = d.digitar ? valor.trim() === d.digitar : d.campo ? valor.trim() !== "" : true;

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && fechar(false)}>
      <form className="modal" role="dialog" aria-modal="true" onSubmit={(e) => { e.preventDefault(); if (liberado) fechar(true); }}>
        <div className={`modal-ico ${d.perigo ? "perigo" : ""}`}>
          <Icon name={d.icone || (d.perigo ? "trash" : "alert")} size={18} />
        </div>
        <h3>{d.titulo}</h3>
        {d.texto && <p>{d.texto}</p>}
        {d.digitar && (
          <>
            <label>Digite <b className="mono">{d.digitar}</b> para confirmar</label>
            <input autoFocus value={valor} onChange={(e) => setValor(e.target.value)} autoComplete="off" />
          </>
        )}
        {d.campo && (
          <>
            <label>{d.campo.label}</label>
            <input autoFocus value={valor} placeholder={d.campo.placeholder} onChange={(e) => setValor(e.target.value)} />
          </>
        )}
        <div className="modal-acoes">
          {!d.soOk && <button type="button" className="ghost" onClick={() => fechar(false)}>Cancelar</button>}
          <button autoFocus={!d.digitar && !d.campo} className={d.perigo ? "perigo-solid" : ""} disabled={!liberado}>
            {d.botao || (d.soOk ? "Ok" : "Confirmar")}
          </button>
        </div>
      </form>
    </div>
  );
}

// Confirmacao de exclusao de workspace: a pessoa digita o nome.
export async function confirmarNome(nome, titulo) {
  const ok = await dialogo({
    titulo,
    texto: "Isso apaga experts, histórico, equipe, convites e a chave de API deste workspace. Não dá para desfazer.",
    digitar: nome,
    botao: "Apagar workspace",
    perigo: true,
  });
  return ok ? nome : null;
}
