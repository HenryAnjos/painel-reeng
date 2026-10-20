"use client";
import { useEffect, useState } from "react";
import Shell from "../nav";
import Icon from "../icons";
import { api, useMe, podeGerir, Copiar, Msg, PAPEIS, Uso, dialogo } from "../ui";

export default function Equipe() {
  const me = useMe();
  const gestor = podeGerir(me);
  const [d, setD] = useState(null);
  const [f, setF] = useState({ email: "", papel: "leitor" });
  const [msg, setMsg] = useState(null);
  const [link, setLink] = useState("");

  const carregar = () => api("/api/equipe").then(setD);
  useEffect(() => { carregar(); }, []);

  const linkDe = (token) => `${location.origin}/convite/${token}`;

  async function convidar(e) {
    e.preventDefault();
    setMsg(null);
    setLink("");
    try {
      const c = await api("/api/equipe", { method: "POST", body: f });
      setLink(linkDe(c.token));
      setF({ ...f, email: "" });
      carregar();
    } catch (x) {
      setMsg({ texto: x.message });
    }
  }

  async function acao(fn) {
    setMsg(null);
    try { await fn(); carregar(); } catch (x) { setMsg({ texto: x.message }); }
  }

  const papelDe = (usuarioId, papel) => acao(() => api(`/api/equipe/${usuarioId}`, { method: "PATCH", body: { papel } }));
  const remover = async (m) => (await dialogo({ titulo: `Remover ${m.usuario.nome}?`, texto: "A pessoa perde o acesso a este workspace na hora. A conta dela continua existindo.", botao: "Remover", perigo: true })) &&
    acao(() => api(`/api/equipe/${m.usuario.id}`, { method: "DELETE" }));
  const revogar = (c) => acao(() => api(`/api/equipe/${c.id}?convite=1`, { method: "DELETE" }));

  const lim = me?.workspace.limites.membros;
  const ocupado = d ? d.membros.length + d.convites.length : 0;

  return (
    <Shell title="Equipe" subtitle="Quem tem acesso a este workspace">
      {gestor && (
        <div className="grid2" style={{ gridTemplateColumns: "2fr 1fr" }}>
          <div className="card">
            <div className="card-title"><Icon name="team" size={14} />convidar pessoa</div>
            <form className="row" onSubmit={convidar}>
              <input type="email" placeholder="email@empresa.com" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
              <select value={f.papel} onChange={(e) => setF({ ...f, papel: e.target.value })} style={{ width: 150 }}>
                <option value="leitor">Leitor</option>
                <option value="admin">Admin</option>
              </select>
              <button><Icon name="plus" size={14} />Gerar convite</button>
            </form>
            <p className="help">Leitor vê tudo e não altera nada. Admin gerencia experts, equipe e configurações.</p>
            {link && (
              <div className="chave-nova">
                <b>Convite criado.</b> Envie este link para a pessoa (vale 7 dias):
                <div className="code">{link}</div>
                <Copiar texto={link} rotulo="Copiar link" />
              </div>
            )}
            <Msg m={msg} />
          </div>
          <div className="card">
            <div className="card-title"><Icon name="chart" size={14} />uso do plano</div>
            {d && lim && <Uso usado={ocupado} limite={lim} rotulo="pessoas (incl. convites)" />}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title"><Icon name="users" size={14} />membros</div>
        {!d && <p className="muted">Carregando...</p>}
        {d && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nome</th><th>E-mail</th><th>Papel</th><th></th></tr></thead>
              <tbody>
                {d.membros.map((m) => {
                  const editavel = gestor && m.papel !== "dono" && m.usuario.id !== d.eu && (m.papel !== "admin" || d.papel === "dono");
                  return (
                    <tr key={m.usuario.id}>
                      <td>{m.usuario.nome}{m.usuario.id === d.eu && <span className="muted"> (você)</span>}</td>
                      <td className="muted">{m.usuario.email}</td>
                      <td>
                        {editavel ? (
                          <select className="inline" value={m.papel} onChange={(e) => papelDe(m.usuario.id, e.target.value)}>
                            <option value="leitor">Leitor</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : <span className={`badge ${m.papel}`}>{PAPEIS[m.papel]}</span>}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {editavel && <button className="icon-btn" title="Remover" onClick={() => remover(m)}><Icon name="trash" size={14} /></button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {gestor && d && d.convites.length > 0 && (
        <div className="card">
          <div className="card-title"><Icon name="mail" size={14} />convites pendentes</div>
          <div className="list">
            {d.convites.map((c) => (
              <div className="list-row" key={c.id}>
                <span className="grow">{c.email} <span className="badge">{PAPEIS[c.papel]}</span></span>
                <span className="mono muted" style={{ fontSize: 11.5 }}>expira {new Date(c.expira_em).toLocaleDateString("pt-BR")}</span>
                <Copiar texto={linkDe(c.token)} rotulo="Link" />
                <button className="icon-btn" title="Revogar" onClick={() => revogar(c)}><Icon name="trash" size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Shell>
  );
}
