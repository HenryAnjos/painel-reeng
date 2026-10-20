"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "./nav";

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

  return (
    <>
      <Nav />
      <div className="wrap">
        <h1>Experts</h1>

        <div className="card">
          {!experts && <p className="muted">Carregando...</p>}
          {experts && experts.length === 0 && <p className="muted">Nenhum expert cadastrado.</p>}
          {experts && experts.length > 0 && (
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
                    <td>{e.slug}</td>
                    <td>{e.nome}</td>
                    <td>{e.canal_telegram ? "on" : "off"}</td>
                    <td>{e.canal_email ? "on" : "off"}</td>
                    <td>{e.session_string ? "ok" : <span className="muted">falta</span>}</td>
                    <td>
                      <button className="ghost" onClick={() => toggleAtivo(e)}>
                        {e.ativo ? "Sim" : "Não"}
                      </button>
                    </td>
                    <td><Link href={`/experts/${e.id}`}>Editar</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h2>Adicionar expert</h2>
          <div className="row">
            <input
              placeholder="slug (igual ao que o DigoChat manda, ex.: Professor)"
              value={novoSlug}
              onChange={(ev) => setNovoSlug(ev.target.value)}
            />
            <button onClick={criar} disabled={criando}>Criar</button>
          </div>
        </div>
      </div>
    </>
  );
}
