"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Shell from "../nav";
import Icon from "../icons";
import { api, useMe, podeGerir, Uso, Vazio, Msg } from "../ui";

export default function Experts() {
  const me = useMe();
  const gestor = podeGerir(me);
  const [experts, setExperts] = useState(null);
  const [novoSlug, setNovoSlug] = useState("");
  const [busca, setBusca] = useState("");
  const [msg, setMsg] = useState(null);
  const [criando, setCriando] = useState(false);

  async function carregar() {
    setExperts(await api("/api/experts"));
  }
  useEffect(() => { carregar(); }, []);

  async function criar(e) {
    e.preventDefault();
    if (!novoSlug.trim()) return;
    setCriando(true);
    setMsg(null);
    try {
      await api("/api/experts", { method: "POST", body: { slug: novoSlug.trim() } });
      setNovoSlug("");
      carregar();
    } catch (x) {
      setMsg({ texto: x.message });
    }
    setCriando(false);
  }

  async function toggleAtivo(e) {
    await api(`/api/experts/${e.id}`, { method: "PATCH", body: { ativo: !e.ativo } });
    carregar();
  }

  const lim = me?.workspace.limites.experts;
  const cheio = experts && lim && experts.length >= lim;
  const termo = busca.trim().toLowerCase();
  const lista = (experts || []).filter((e) => !termo || e.slug.toLowerCase().includes(termo) || (e.nome || "").toLowerCase().includes(termo));
  const on = (v) => <span className={`pill ${v ? "on" : "off"}`}>{v ? "on" : "off"}</span>;

  return (
    <Shell title="Experts" subtitle="Contas do Telegram que disparam o reengajamento">
      {gestor && (
        <div className="grid2" style={{ gridTemplateColumns: "2fr 1fr" }}>
          <div className="card">
            <div className="card-title"><Icon name="plus" size={14} />adicionar expert</div>
            <form className="row" onSubmit={criar}>
              <input
                placeholder="slug (igual ao que o DigoChat manda, ex.: Professor)"
                value={novoSlug}
                onChange={(ev) => setNovoSlug(ev.target.value)}
                disabled={cheio}
              />
              <button disabled={criando || cheio}><Icon name="plus" size={14} />Criar</button>
            </form>
            {cheio && <p className="help">Limite do plano atingido. Fale com o suporte para fazer upgrade.</p>}
            <Msg m={msg} />
          </div>
          <div className="card">
            <div className="card-title"><Icon name="chart" size={14} />uso do plano</div>
            {experts && lim && <Uso usado={experts.length} limite={lim} rotulo={`experts · plano ${me.workspace.limites.nome}`} />}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title">
          <Icon name="users" size={14} />cadastrados
          <span className="right" style={{ width: 240 }}>
            <input placeholder="buscar…" value={busca} onChange={(e) => setBusca(e.target.value)} style={{ padding: "6px 10px", fontSize: 12.5 }} />
          </span>
        </div>
        {!experts && <p className="muted">Carregando...</p>}
        {experts && lista.length === 0 && <Vazio icon="users">{experts.length ? "Nenhum expert encontrado" : "Nenhum expert cadastrado ainda"}</Vazio>}
        {lista.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Slug</th><th>Nome</th><th>Telegram</th><th>E-mail</th>
                  <th>Sessão</th><th>Ativo</th><th></th>
                </tr>
              </thead>
              <tbody>
                {lista.map((e) => (
                  <tr key={e.id}>
                    <td className="mono">{e.slug}</td>
                    <td>{e.nome}</td>
                    <td>{on(e.canal_telegram)}</td>
                    <td>{on(e.canal_email)}</td>
                    <td>{e.tem_sessao ? <span className="pill on">ok</span> : <span className="pill sem_sessao">falta</span>}</td>
                    <td>
                      <label className="switch" style={{ border: 0, padding: 0, margin: 0, cursor: gestor ? "pointer" : "default" }}>
                        <input type="checkbox" checked={!!e.ativo} disabled={!gestor} onChange={() => toggleAtivo(e)} />
                        <span className="track" />
                      </label>
                    </td>
                    <td><Link href={`/experts/${e.id}`} className="btn-link"><Icon name="edit" size={14} />{gestor ? "Editar" : "Ver"}</Link></td>
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
