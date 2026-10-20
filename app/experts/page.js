"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Shell from "../nav";
import Icon from "../icons";

export default function Experts() {
  const [experts, setExperts] = useState(null);
  const [novoSlug, setNovoSlug] = useState("");
  const [criando, setCriando] = useState(false);

  async function carregar() {
    const r = await fetch("/api/experts");
    setExperts(await r.json());
  }
  useEffect(() => { carregar(); }, []);

  async function criar() {
    if (!novoSlug.trim()) return;
    setCriando(true);
    await fetch("/api/experts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: novoSlug.trim() }),
    });
    setNovoSlug("");
    setCriando(false);
    carregar();
  }

  async function toggleAtivo(e) {
    await fetch(`/api/experts/${e.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !e.ativo }),
    });
    carregar();
  }

  const on = (v) => <span className={`pill ${v ? "on" : "off"}`}>{v ? "on" : "off"}</span>;

  return (
    <Shell title="Experts" subtitle="Contas que disparam o reengajamento">
      <div className="card">
        <div className="card-title"><Icon name="plus" size={14} />Adicionar expert</div>
        <div className="row">
          <input
            placeholder="slug (igual ao que o DigoChat manda, ex.: Professor)"
            value={novoSlug}
            onChange={(ev) => setNovoSlug(ev.target.value)}
            onKeyDown={(ev) => ev.key === "Enter" && criar()}
          />
          <button onClick={criar} disabled={criando}><Icon name="plus" size={14} />Criar</button>
        </div>
      </div>

      <div className="card">
        <div className="card-title"><Icon name="users" size={14} />Cadastrados</div>
        {!experts && <p className="muted">Carregando...</p>}
        {experts && experts.length === 0 && <p className="muted">Nenhum expert cadastrado.</p>}
        {experts && experts.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Slug</th><th>Nome</th><th>Telegram</th><th>E-mail</th>
                  <th>Sessão</th><th>Ativo</th><th></th>
                </tr>
              </thead>
              <tbody>
                {experts.map((e) => (
                  <tr key={e.id}>
                    <td className="mono">{e.slug}</td>
                    <td>{e.nome}</td>
                    <td>{on(e.canal_telegram)}</td>
                    <td>{on(e.canal_email)}</td>
                    <td>{e.session_string ? <span className="pill on">ok</span> : <span className="pill sem_sessao">falta</span>}</td>
                    <td>
                      <label className="switch" style={{ border: 0, padding: 0, margin: 0 }}>
                        <input type="checkbox" checked={!!e.ativo} onChange={() => toggleAtivo(e)} />
                        <span className="track" />
                      </label>
                    </td>
                    <td><Link href={`/experts/${e.id}`} className="btn-link"><Icon name="edit" size={14} />Editar</Link></td>
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
