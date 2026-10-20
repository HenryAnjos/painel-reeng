"use client";
import { useEffect, useState } from "react";
import Shell from "../nav";
import Icon from "../icons";

export default function Config() {
  const [c, setC] = useState(null);
  const [msg, setMsg] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    fetch("/api/config").then((r) => r.json()).then(setC);
  }, []);

  function set(k, v) { setC({ ...c, [k]: v }); }

  async function salvar() {
    setSalvando(true);
    setMsg("");
    const r = await fetch("/api/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        espera_minutos: Number(c.espera_minutos) || 0,
        dedup_horas: Number(c.dedup_horas) || 24,
        limite_diario: Number(c.limite_diario) || 40,
        intervalo_min: Number(c.intervalo_min) || 20,
        email_remetente: c.email_remetente || null,
        email_assunto: c.email_assunto || null,
      }),
    });
    setSalvando(false);
    setMsg(r.ok ? "Salvo" : "Erro ao salvar");
  }

  if (!c) return (<Shell title="Configurações"><p className="muted">Carregando...</p></Shell>);

  return (
    <Shell title="Configurações" subtitle="Regras globais do motor de envio">
      <div className="grid2">
        <div className="card">
          <div className="card-title"><Icon name="send" size={14} />Disparo</div>
          <label>Espera antes de enviar (minutos, 0 = imediato)</label>
          <input value={c.espera_minutos ?? 0} onChange={(e) => set("espera_minutos", e.target.value)} />
          <label>Janela de deduplicação (horas, 24 = 1x por dia)</label>
          <input value={c.dedup_horas ?? 24} onChange={(e) => set("dedup_horas", e.target.value)} />
        </div>
        <div className="card">
          <div className="card-title"><Icon name="activity" size={14} />Ritmo por conta</div>
          <label>Limite diário de envios</label>
          <input value={c.limite_diario ?? 40} onChange={(e) => set("limite_diario", e.target.value)} />
          <label>Intervalo mínimo entre envios (segundos)</label>
          <input value={c.intervalo_min ?? 20} onChange={(e) => set("intervalo_min", e.target.value)} />
        </div>
        <div className="card">
          <div className="card-title"><Icon name="mail" size={14} />E-mail</div>
          <label>Remetente</label>
          <input value={c.email_remetente || ""} onChange={(e) => set("email_remetente", e.target.value)} />
          <label>Assunto</label>
          <input value={c.email_assunto || ""} onChange={(e) => set("email_assunto", e.target.value)} />
        </div>
      </div>
        <div className="row">
          <button onClick={salvar} disabled={salvando}>{salvando ? "..." : "Salvar"}</button>
          {msg && <span className={`msg ${msg === "Salvo" ? "ok" : "err"}`}>{msg}</span>}
        </div>
    </Shell>
  );
}
