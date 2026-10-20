"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Shell from "./nav";
import Icon from "./icons";
import { api, Vazio } from "./ui";

const TZ = "America/Sao_Paulo";
const diaCurto = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("pt-BR", { timeZone: TZ, weekday: "short" }).replace(".", "");
const dataCurta = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit" });

function Barras({ serie }) {
  const max = Math.max(1, ...serie.map((d) => d.enviados));
  return (
    <div className="bars">
      {serie.map((d, i) => (
        <div key={d.dia} className={`b ${i === serie.length - 1 ? "hoje" : ""}`}
          title={`${diaCurto(d.dia)} ${dataCurta(d.dia)} · ${d.enviados} enviados · ${d.falhas} falhas`}>
          <i style={{ height: `${(d.enviados / max) * 100}%` }} />
          <span>{i === serie.length - 1 ? "hoje" : diaCurto(d.dia)}</span>
        </div>
      ))}
    </div>
  );
}

function Medidor({ enviados, falhas }) {
  const t = enviados + falhas;
  const pct = t ? enviados / t : 0;
  const r = 56, c = 2 * Math.PI * r;
  return (
    <div className="gauge">
      <div className="gauge-ring">
        <svg width="132" height="132" viewBox="0 0 132 132">
          <circle cx="66" cy="66" r={r} fill="none" stroke="#24241e" strokeWidth="10" />
          {t > 0 && (
            <circle cx="66" cy="66" r={r} fill="none" stroke="var(--lime)" strokeWidth="10"
              strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} />
          )}
        </svg>
        <div className="gauge-val">{t ? `${Math.round(pct * 100)}%` : "—"}</div>
      </div>
      <div className="gauge-legend">
        <span><i className="sq c-ok" />{enviados} ok</span>
        <span><i className="sq c-err" />{falhas} falhas</span>
      </div>
    </div>
  );
}

function Tile({ cor, icon, label, value, foot }) {
  return (
    <div className={`tile ${cor || ""}`}>
      <div className="tile-top"><span>{label}</span><Icon name={icon} size={15} /></div>
      <div className="tile-val">{value}</div>
      <div className="tile-foot">{foot}</div>
    </div>
  );
}

const COR_STATUS = {
  enviado: "c-ok", erro: "c-err", flood: "c-err", peer_flood: "c-err",
  nao_resolvido: "c-warn", bloqueado: "c-warn", sem_sessao: "c-warn", pausado: "c-warn",
};

export default function Dashboard() {
  const [s, setS] = useState(null);
  const [ultimos, setUltimos] = useState(null);

  async function carregar() {
    const [a, b] = await Promise.all([api("/api/stats"), api("/api/logs?por=7")]);
    setS(a);
    setUltimos(b.rows);
  }
  useEffect(() => {
    carregar();
    const t = setInterval(carregar, 30000);
    return () => clearInterval(t);
  }, []);

  const h = s?.hoje;
  const n = (v) => (s ? v : "…");
  const hora = (ts) => new Date(ts).toLocaleTimeString("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });

  return (
    <Shell
      title="Quem voltou hoje"
      subtitle="Reengajamentos disparados pelo motor, atualizado a cada 30s"
      actions={<button className="ghost" onClick={carregar}><Icon name="refresh" size={14} />Atualizar</button>}
    >
      {s && s.experts.semSessao.length > 0 && (
        <div className="alert">
          <Icon name="alert" size={16} />
          <span>
            {s.experts.semSessao.length === 1 ? "1 expert ativo está" : `${s.experts.semSessao.length} experts ativos estão`} sem
            sessão do Telegram: <b>{s.experts.semSessao.join(", ")}</b>
          </span>
          <Link href="/experts">Resolver →</Link>
        </div>
      )}

      <div className="hero-grid">
        <div className="card">
          <div className="card-title"><Icon name="send" size={14} />enviados hoje<span className="right">últimos 7 dias</span></div>
          <div className="hero">
            <div>
              <div className="big">{n(h?.enviados)}</div>
              <div className="big-sub">
                {s ? <><b>{h.telegram}</b> telegram · <b>{h.email}</b> e-mail · <b>{s.mes}</b> no mês</> : " "}
              </div>
            </div>
            {s && <Barras serie={s.serie} />}
          </div>
        </div>
        <div className="card">
          <div className="card-title"><Icon name="trend" size={14} />taxa de sucesso</div>
          {s && <Medidor enviados={h.enviados} falhas={h.falhas} />}
        </div>
      </div>

      <div className="tiles">
        <Tile cor="c-err" icon="xcircle" label="falhas hoje" value={n(h?.falhas)} foot="flood, erro, bloqueio…" />
        <Tile cor="c-info" icon="skip" label="ignorados hoje" value={n(h?.ignorados)} foot="duplicados e inativos" />
        <Tile cor="c-ok" icon="users" label="experts ativos" value={n(s?.experts.ativos)}
          foot={s && `de ${s.experts.total} cadastrados`} />
        <Tile cor="c-warn" icon="lock" label="sem sessão" value={n(s?.experts.semSessao.length)}
          foot={s && (s.experts.semSessao.length ? "precisam de atenção" : "tudo certo")} />
      </div>

      <div className="grid2">
        <div className="card">
          <div className="card-title"><Icon name="chart" size={14} />ranking de experts — hoje</div>
          {s && s.porExpert.length === 0 && <Vazio icon="chart">Nenhum disparo registrado hoje</Vazio>}
          {s && s.porExpert.length > 0 && (
            <div className="list">
              {s.porExpert.map((x, i) => {
                const t = x.enviados + x.falhas;
                return (
                  <div className="list-row" key={x.expert} title={`${x.enviados} enviados · ${x.falhas} falhas`}>
                    <span className="rank">{String(i + 1).padStart(2, "0")}</span>
                    <span className="grow">{x.expert}</span>
                    <span className="mono muted" style={{ fontSize: 12 }}>{x.enviados}</span>
                    <span className="bar">
                      {t > 0 && <i style={{ width: `${(x.enviados / t) * 100}%` }} />}
                      {x.falhas > 0 && <i className="f" style={{ width: `${(x.falhas / t) * 100}%` }} />}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="card">
          <div className="card-title"><Icon name="activity" size={14} />atividade recente</div>
          {ultimos && ultimos.length === 0 && <Vazio icon="check">Nenhum envio registrado</Vazio>}
          {ultimos && ultimos.length > 0 && (
            <div className="list feed">
              {ultimos.map((r) => (
                <div className={`list-row ${COR_STATUS[r.status] || ""}`} key={r.id}>
                  <span className="mono muted" style={{ fontSize: 11.5 }}>{hora(r.criado_em)}</span>
                  <span className="grow">{r.expert} <span className="muted">→ {r.canal === "email" ? r.email : (r.username || r.user_id)}</span></span>
                  <span className={`pill ${r.status}`}>{r.status}</span>
                </div>
              ))}
              <Link href="/logs" className="btn-link" style={{ marginTop: 10 }}>ver histórico completo →</Link>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
