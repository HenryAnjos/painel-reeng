"use client";
import { useEffect, useState } from "react";
import Nav from "../nav";

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

  if (!c) return (<><Nav /><div className="wrap"><p className="muted">Carregando...</p></div></>);

  return (
    <>
      <Nav />
      <div className="wrap">
        <h1>Configuração</h1>
        <div className="card">
          <h2>Disparo</h2>
          <label>Espera antes de enviar (minutos, 0 = imediato)</label>
          <input value={c.espera_minutos ?? 0} onChange={(e) => set("espera_minutos", e.target.value)} />
          <label>Janela de deduplicação (horas, 24 = 1x por dia)</label>
          <input value={c.dedup_horas ?? 24} onChange={(e) => set("dedup_horas", e.target.value)} />
        </div>
        <div className="card">
          <h2>Ritmo por conta</h2>
          <label>Limite diário de envios</label>
          <input value={c.limite_diario ?? 40} onChange={(e) => set("limite_diario", e.target.value)} />
          <label>Intervalo mínimo entre envios (segundos)</label>
          <input value={c.intervalo_min ?? 20} onChange={(e) => set("intervalo_min", e.target.value)} />
        </div>
        <div className="card">
          <h2>E-mail</h2>
          <label>Remetente</label>
          <input value={c.email_remetente || ""} onChange={(e) => set("email_remetente", e.target.value)} />
          <label>Assunto</label>
          <input value={c.email_assunto || ""} onChange={(e) => set("email_assunto", e.target.value)} />
        </div>
        <div className="row">
          <button onClick={salvar} disabled={salvando}>{salvando ? "..." : "Salvar"}</button>
          {msg && <span className={`msg ${msg === "Salvo" ? "ok" : "err"}`}>{msg}</span>}
        </div>
      </div>
    </>
  );
}
