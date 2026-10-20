"use client";
import { useEffect, useState } from "react";
import Shell from "../nav";
import Icon from "../icons";
import { api, Paginacao, Vazio } from "../ui";

const STATUS = ["enviado", "duplicado", "nao_resolvido", "bloqueado", "flood", "peer_flood", "pausado",
  "sem_sessao", "limite_diario", "expert_inativo", "erro"];
const VAZIO = { q: "", expert: "", canal: "", status: "", de: "", ate: "" };

export default function Logs() {
  const [f, setF] = useState(VAZIO);
  const [aplicado, setAplicado] = useState(VAZIO);
  const [pagina, setPagina] = useState(1);
  const [dados, setDados] = useState(null);
  const [experts, setExperts] = useState([]);

  useEffect(() => { api("/api/experts").then(setExperts).catch(() => {}); }, []);

  useEffect(() => {
    const qs = new URLSearchParams({ pagina: String(pagina) });
    for (const [k, v] of Object.entries(aplicado)) if (v) qs.set(k, v);
    setDados(null);
    api(`/api/logs?${qs}`).then(setDados).catch(() => setDados({ rows: [], total: 0, pagina: 1, por: 50 }));
  }, [aplicado, pagina]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  function filtrar(e) {
    e.preventDefault();
    setPagina(1);
    setAplicado(f);
  }
  function limpar() {
    setF(VAZIO);
    setPagina(1);
    setAplicado(VAZIO);
  }

  const fmt = (ts) => new Date(ts).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  const ativos = Object.values(aplicado).some(Boolean);

  return (
    <Shell title="Histórico" subtitle="Tudo que o motor registrou neste workspace">
      <form className="card" onSubmit={filtrar}>
        <div className="filters">
          <input placeholder="buscar username, e-mail ou user_id" value={f.q} onChange={set("q")} />
          <select value={f.expert} onChange={set("expert")}>
            <option value="">todos os experts</option>
            {experts.map((e) => <option key={e.id} value={e.slug}>{e.slug}</option>)}
          </select>
          <select value={f.canal} onChange={set("canal")}>
            <option value="">todos os canais</option>
            <option value="telegram">telegram</option>
            <option value="email">e-mail</option>
          </select>
          <select value={f.status} onChange={set("status")}>
            <option value="">todos os status</option>
            {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="date" value={f.de} onChange={set("de")} title="de" />
          <input type="date" value={f.ate} onChange={set("ate")} title="até" />
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button><Icon name="search" size={14} />Filtrar</button>
          {ativos && <button type="button" className="ghost" onClick={limpar}>Limpar filtros</button>}
        </div>
      </form>
      <div className="card">
        {!dados && <p className="muted">Carregando...</p>}
        {dados && dados.rows.length === 0 && <Vazio icon="history">Nenhum registro{ativos ? " com esses filtros" : ""}.</Vazio>}
        {dados && dados.rows.length > 0 && (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Quando</th><th>Expert</th><th>Canal</th><th>Destino</th><th>Status</th><th>Detalhe</th></tr>
                </thead>
                <tbody>
                  {dados.rows.map((r) => (
                    <tr key={r.id}>
                      <td className="muted mono" style={{ whiteSpace: "nowrap" }}>{fmt(r.criado_em)}</td>
                      <td className="mono">{r.expert}</td>
                      <td>{r.canal}</td>
                      <td>{r.canal === "email" ? r.email : (r.username ? `@${r.username}` : r.user_id)}</td>
                      <td><span className={`pill ${r.status}`}>{r.status}</span></td>
                      <td className="muted">{r.detalhe || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Paginacao pagina={dados.pagina} total={dados.total} por={dados.por} onChange={setPagina} />
          </>
        )}
      </div>
    </Shell>
  );
}
