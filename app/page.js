"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Shell from "./nav";
import Icon from "./icons";

function Spark({ data }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(1, ...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 86 + 2},${26 - (v / max) * 22}`);
  const [lx, ly] = pts[pts.length - 1].split(",");
  return (
    <svg className="spark" viewBox="0 0 90 28" fill="none">
      <polyline points={pts.join(" ")} stroke="currentColor" strokeOpacity=".55" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="2.6" fill="currentColor" />
    </svg>
  );
}

function Stat({ cor, icon, label, value, foot, spark }) {
  return (
    <div className={`stat ${cor}`}>
      <div className="stat-head">
        <span className="stat-ico"><Icon name={icon} size={18} /></span>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value">{value}</div>
      {foot && <div className="stat-foot">{foot}</div>}
      <Spark data={spark} />
    </div>
  );
}

function Vazio({ icon, children }) {
  return (
    <div className="empty">
      <Icon name={icon} size={30} />
      <div>{children}</div>
    </div>
  );
}

export default function Dashboard() {
  const [s, setS] = useState(null);
  const [ultimos, setUltimos] = useState(null);

  async function carregar() {
    const [a, b] = await Promise.all([fetch("/api/stats"), fetch("/api/logs")]);
    setS(await a.json());
    setUltimos((await b.json()).slice(0, 8));
  }
  useEffect(() => {
    carregar();
    const t = setInterval(carregar, 30000);
    return () => clearInterval(t);
  }, []);

  const h = s?.hoje;
  const tentativas = h ? h.enviados + h.falhas : 0;
  const taxa = tentativas ? `${Math.round((h.enviados / tentativas) * 100)}%` : "—";
  const n = (v) => (s ? v : "…");
  const hora = (ts) => new Date(ts).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });

  return (
    <Shell
      title="Dashboard"
      subtitle="Visão geral — hoje"
      actions={<button className="ghost" onClick={carregar}><Icon name="refresh" size={14} />Atualizar</button>}
    >
      <div className="stats">
        <Stat cor="c-ok" icon="send" label="Enviados hoje" value={n(h?.enviados)}
          foot={s && `${h.telegram} telegram · ${h.email} e-mail`} spark={s?.serie.map((d) => d.enviados)} />
        <Stat cor="c-err" icon="xcircle" label="Falhas hoje" value={n(h?.falhas)}
          spark={s?.serie.map((d) => d.falhas)} />
        <Stat cor="c-gray" icon="trend" label="Taxa de sucesso" value={s ? taxa : "…"}
          foot={s && (tentativas ? `${tentativas} tentativas` : "Nenhum envio hoje")} />
        <Stat cor="c-blue" icon="activity" label="Ignorados hoje" value={n(h?.ignorados)}
          foot="duplicados e inativos" />
        <Stat cor="c-warn" icon="users" label="Experts ativos" value={n(s?.experts.ativos)}
          foot={s && s.experts.semSessao.length > 0 && `${s.experts.semSessao.length} sem sessão`} />
        <Stat cor="c-gray" icon="grid" label="Experts cadastrados" value={n(s?.experts.total)} />
      </div>

      <div className="card">
        <div className="card-title"><Icon name="bolt" size={14} />Desempenho por expert — hoje</div>
        {s && s.porExpert.length === 0 && <Vazio icon="chart">Nenhum disparo registrado hoje</Vazio>}
        {s && s.porExpert.length > 0 && (
          <div className="list">
            {s.porExpert.map((x) => {
              const t = x.enviados + x.falhas;
              return (
                <div className="list-row" key={x.expert}>
                  <span className="grow">{x.expert}</span>
                  <span className="mono muted" style={{ fontSize: 12 }}>{x.enviados} ok · {x.falhas} falha</span>
                  <span className="bar"><i style={{ width: `${t ? (x.enviados / t) * 100 : 0}%` }} /></span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid2">
        <div className="card">
          <div className="card-title warn"><Icon name="users" size={14} />Atenção</div>
          {s && s.experts.semSessao.length === 0 && <Vazio icon="check">Todos os experts ativos têm sessão</Vazio>}
          {s && s.experts.semSessao.length > 0 && (
            <div className="list">
              {s.experts.semSessao.map((slug) => (
                <div className="list-row" key={slug}>
                  <span className="grow">{slug}</span>
                  <span className="pill sem_sessao">sem sessão</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <div className="card-title ok"><Icon name="check" size={14} />Últimos envios</div>
          {ultimos && ultimos.length === 0 && <Vazio icon="check">Nenhum envio registrado</Vazio>}
          {ultimos && ultimos.length > 0 && (
            <div className="list">
              {ultimos.map((r) => (
                <div className="list-row" key={r.id}>
                  <span className="mono muted" style={{ fontSize: 12 }}>{hora(r.criado_em)}</span>
                  <span className="grow">{r.expert} <span className="muted">· {r.canal === "email" ? r.email : (r.username || r.user_id)}</span></span>
                  <span className={`pill ${r.status}`}>{r.status}</span>
                </div>
              ))}
              <Link href="/logs" className="btn-link" style={{ marginTop: 12 }}>Ver histórico completo →</Link>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
