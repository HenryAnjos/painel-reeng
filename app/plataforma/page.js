"use client";
import { useEffect, useState } from "react";
import Shell from "../nav";
import Icon from "../icons";
import { api, limparMe, Msg, confirmarNome } from "../ui";

export default function Plataforma() {
  const [rows, setRows] = useState(null);
  const [msg, setMsg] = useState(null);

  const carregar = () => api("/api/admin/workspaces").then(setRows).catch((x) => setMsg({ texto: x.message }));
  useEffect(() => { carregar(); }, []);

  async function entrar(r) {
    if (!confirm(`Entrar em "${r.nome}" como dono (modo suporte)?`)) return;
    try {
      await api("/api/workspace/trocar", { method: "POST", body: { id: r.id } });
      limparMe();
      location.href = "/";
    } catch (x) { setMsg({ texto: x.message }); }
  }

  async function apagar(r) {
    const confirmar = confirmarNome(r.nome, `Apagar o workspace "${r.nome}" do cliente?`);
    if (!confirmar) return;
    try {
      await api(`/api/admin/workspaces/${r.id}`, { method: "DELETE", body: { confirmar } });
      limparMe();
      carregar();
    } catch (x) { setMsg({ texto: x.message }); }
  }

  async function mudarPlano(id, plano) {
    try {
      await api(`/api/admin/workspaces/${id}`, { method: "PATCH", body: { plano } });
      limparMe();
      carregar();
    } catch (x) { setMsg({ texto: x.message }); }
  }

  const tot = (k) => (rows || []).reduce((a, r) => a + Number(r[k]), 0);

  return (
    <Shell title="Plataforma" subtitle="Todos os clientes do reeng (visível só para administradores)">
      <div className="tiles">
        <div className="tile c-ok"><div className="tile-top"><span>workspaces</span><Icon name="grid" size={15} /></div><div className="tile-val">{rows ? rows.length : "…"}</div></div>
        <div className="tile c-info"><div className="tile-top"><span>pessoas</span><Icon name="team" size={15} /></div><div className="tile-val">{rows ? tot("membros") : "…"}</div></div>
        <div className="tile c-warn"><div className="tile-top"><span>experts</span><Icon name="users" size={15} /></div><div className="tile-val">{rows ? tot("experts") : "…"}</div></div>
        <div className="tile c-ok"><div className="tile-top"><span>enviados no mês</span><Icon name="send" size={15} /></div><div className="tile-val">{rows ? tot("envios_mes").toLocaleString("pt-BR") : "…"}</div></div>
      </div>
      <div className="card">
        <div className="card-title"><Icon name="shield" size={14} />clientes</div>
        <Msg m={msg} />
        {rows && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Workspace</th><th>Criado em</th><th>Pessoas</th><th>Experts</th><th>Enviados no mês</th><th>Plano</th><th></th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.nome}</td>
                    <td className="muted mono">{new Date(r.criado_em).toLocaleDateString("pt-BR")}</td>
                    <td className="mono">{r.membros}</td>
                    <td className="mono">{r.experts}</td>
                    <td className="mono">{Number(r.envios_mes).toLocaleString("pt-BR")}</td>
                    <td>
                      <select className="inline" value={r.plano} onChange={(e) => mudarPlano(r.id, e.target.value)}>
                        <option value="starter">Starter</option>
                        <option value="pro">Pro</option>
                        <option value="scale">Scale</option>
                      </select>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="row" style={{ justifyContent: "flex-end", gap: 6 }}>
                        <button className="ghost sm" onClick={() => entrar(r)}><Icon name="shield" size={13} />Entrar como dono</button>
                        <button className="icon-btn" title="Apagar workspace" onClick={() => apagar(r)}><Icon name="trash" size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Shell>
  );
}
