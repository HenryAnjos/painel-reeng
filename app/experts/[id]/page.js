"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Nav from "../../nav";

export default function EditarExpert() {
  const { id } = useParams();
  const router = useRouter();
  const [e, setE] = useState(null);
  const [msg, setMsg] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    fetch(`/api/experts/${id}`).then((r) => r.json()).then(setE);
  }, [id]);

  function set(campo, valor) { setE({ ...e, [campo]: valor }); }

  async function salvar() {
    setSalvando(true);
    setMsg("");
    const r = await fetch(`/api/experts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome: e.nome,
        api_id: e.api_id ? Number(e.api_id) : null,
        api_hash: e.api_hash || null,
        session_string: e.session_string || null,
        texto: e.texto || null,
        audio_url: e.audio_url || null,
        canal_telegram: e.canal_telegram,
        canal_email: e.canal_email,
        ativo: e.ativo,
      }),
    });
    setSalvando(false);
    setMsg(r.ok ? "Salvo" : "Erro ao salvar");
  }

  if (!e) return (<><Nav /><div className="wrap"><p className="muted">Carregando...</p></div></>);

  return (
    <>
      <Nav />
      <div className="wrap">
        <h1>Expert: {e.slug}</h1>

        <div className="card">
          <h2>Identificação</h2>
          <label>Nome</label>
          <input value={e.nome || ""} onChange={(ev) => set("nome", ev.target.value)} />
          <label>Slug (não editável, é a chave que o DigoChat manda)</label>
          <input value={e.slug} disabled />
        </div>

        <div className="card">
          <h2>Credenciais Telegram</h2>
          <label>api_id</label>
          <input value={e.api_id || ""} onChange={(ev) => set("api_id", ev.target.value)} />
          <label>api_hash</label>
          <input value={e.api_hash || ""} onChange={(ev) => set("api_hash", ev.target.value)} />
          <label>session_string</label>
          <textarea value={e.session_string || ""} onChange={(ev) => set("session_string", ev.target.value)} />
          <p className="muted" style={{ fontSize: 12 }}>
            A session é gerada uma vez pelo script. Cole aqui a string completa.
          </p>
        </div>

        <div className="card">
          <h2>Conteúdo</h2>
          <label>Texto da mensagem</label>
          <textarea value={e.texto || ""} onChange={(ev) => set("texto", ev.target.value)} />
          <label>URL do áudio (.ogg) — opcional</label>
          <input value={e.audio_url || ""} onChange={(ev) => set("audio_url", ev.target.value)} />
        </div>

        <div className="card">
          <h2>Canais</h2>
          <div className="toggle">
            <input type="checkbox" checked={!!e.canal_telegram}
              onChange={(ev) => set("canal_telegram", ev.target.checked)} />
            <span>Telegram</span>
          </div>
          <div className="toggle" style={{ marginTop: 8 }}>
            <input type="checkbox" checked={!!e.canal_email}
              onChange={(ev) => set("canal_email", ev.target.checked)} />
            <span>E-mail</span>
          </div>
          <div className="toggle" style={{ marginTop: 8 }}>
            <input type="checkbox" checked={!!e.ativo}
              onChange={(ev) => set("ativo", ev.target.checked)} />
            <span>Expert ativo</span>
          </div>
        </div>

        <div className="row">
          <button onClick={salvar} disabled={salvando}>{salvando ? "..." : "Salvar"}</button>
          <button className="ghost" onClick={() => router.push("/")}>Voltar</button>
          {msg && <span className={`msg ${msg === "Salvo" ? "ok" : "err"}`}>{msg}</span>}
        </div>
      </div>
    </>
  );
}
