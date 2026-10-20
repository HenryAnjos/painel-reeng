"use client";
import { useEffect, useState } from "react";
import Shell from "../nav";
import Icon from "../icons";
import { api, limparMe, Msg, Uso, useMe, confirmarNome } from "../ui";

const PLANOS = [
  ["starter", "Starter", "3 experts · 3 pessoas"],
  ["pro", "Pro", "15 experts · 10 pessoas"],
  ["scale", "Scale", "100 experts · 50 pessoas"],
];

function Num({ label, help, value, onChange }) {
  return (
    <>
      <label>{label}</label>
      <input type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
      {help && <p className="help">{help}</p>}
    </>
  );
}

export default function Config() {
  const me = useMe();
  const [c, setC] = useState(null);
  const [msg, setMsg] = useState(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => { api("/api/workspace").then(setC); }, []);

  function set(k, v) { setC({ ...c, [k]: v }); }

  async function salvar() {
    setSalvando(true);
    setMsg(null);
    try {
      await api("/api/workspace", {
        method: "PATCH",
        body: {
          nome: c.nome,
          espera_minutos: Number(c.espera_minutos),
          dedup_horas: Number(c.dedup_horas),
          limite_diario: Number(c.limite_diario),
          intervalo_min: Number(c.intervalo_min),
          email_remetente: c.email_remetente,
          email_assunto: c.email_assunto,
        },
      });
      limparMe();
      setMsg({ ok: true, texto: "Salvo" });
    } catch (x) {
      setMsg({ texto: x.message });
    }
    setSalvando(false);
  }

  async function apagar() {
    const confirmar = await confirmarNome(c.nome, `Apagar o workspace "${c.nome}"?`);
    if (!confirmar) return;
    try {
      await api("/api/workspace", { method: "DELETE", body: { confirmar } });
      limparMe();
      location.href = "/";
    } catch (x) { setMsg({ texto: x.message }); }
  }

  if (!c) return (<Shell title="Configurações"><p className="muted">Carregando...</p></Shell>);

  return (
    <Shell title="Configurações" subtitle="Regras do motor para este workspace">
      <div className="grid2">
        <div>
          <div className="card">
            <div className="card-title"><Icon name="grid" size={14} />workspace</div>
            <label>Nome</label>
            <input value={c.nome || ""} onChange={(e) => set("nome", e.target.value)} />
          </div>
          <div className="card">
            <div className="card-title"><Icon name="send" size={14} />disparo</div>
            <Num label="Espera antes de enviar (minutos)" help="0 = imediato" value={c.espera_minutos} onChange={(v) => set("espera_minutos", v)} />
            <Num label="Janela de deduplicação (horas)" help="24 = no máximo 1 mensagem por lead por dia" value={c.dedup_horas} onChange={(v) => set("dedup_horas", v)} />
          </div>
          <div className="card">
            <div className="card-title"><Icon name="activity" size={14} />ritmo por conta</div>
            <Num label="Limite diário de envios por expert" help="Comece baixo (30–40) em contas novas" value={c.limite_diario} onChange={(v) => set("limite_diario", v)} />
            <Num label="Intervalo mínimo entre envios (segundos)" value={c.intervalo_min} onChange={(v) => set("intervalo_min", v)} />
          </div>
        </div>
        <div>
          <div className="card">
            <div className="card-title"><Icon name="mail" size={14} />e-mail</div>
            <label>Remetente</label>
            <input value={c.email_remetente || ""} onChange={(e) => set("email_remetente", e.target.value)} />
            <label>Assunto</label>
            <input value={c.email_assunto || ""} onChange={(e) => set("email_assunto", e.target.value)} />
          </div>
          <div className="card" id="plano">
            <div className="card-title"><Icon name="chart" size={14} />plano e uso</div>
            <Uso usado={c.uso.experts} limite={c.limites.experts} rotulo="Experts" />
            <Uso usado={c.uso.membros} limite={c.limites.membros} rotulo="Pessoas" />
            <div className="planos" style={{ marginTop: 18 }}>
              {PLANOS.map(([id, nome, d]) => (
                <div key={id} className={`plano ${c.plano === id ? "atual" : ""}`}>
                  <b>{nome}</b>
                  <div>{d}</div>
                  {c.plano === id && <div className="mono" style={{ color: "var(--lime)" }}>plano atual</div>}
                </div>
              ))}
            </div>
            <p className="help">Para mudar de plano, fale com o suporte.</p>
          </div>
          {me?.papel === "dono" && (
            <div className="card">
              <div className="card-title warn"><Icon name="trash" size={14} />zona de perigo</div>
              <p className="help" style={{ marginTop: 0, marginBottom: 12 }}>
                Apaga este workspace e tudo dele: experts, histórico, equipe, convites e a chave de API. Não dá para desfazer.
              </p>
              <button type="button" className="danger" onClick={apagar}><Icon name="trash" size={14} />Apagar workspace</button>
            </div>
          )}
        </div>
      </div>
      <div className="row">
        <button onClick={salvar} disabled={salvando}>{salvando ? "Salvando…" : "Salvar"}</button>
        <Msg m={msg} />
      </div>
    </Shell>
  );
}
