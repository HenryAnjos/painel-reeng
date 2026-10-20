"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Shell from "../../nav";
import Icon from "../../icons";

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

  if (!e) return (<Shell title="Expert"><p className="muted">Carregando...</p></Shell>);

  return (
    <Shell
      title={e.nome || e.slug}
      subtitle={<span className="mono">{e.slug}</span>}
      actions={<button className="ghost" onClick={() => router.push("/experts")}><Icon name="arrowLeft" size={14} />Voltar</button>}
    >
      <div className="grid2">
      <div>

        <div className="card">
          <div className="card-title"><Icon name="users" size={14} />Identificação</div>
          <label>Nome</label>
          <input value={e.nome || ""} onChange={(ev) => set("nome", ev.target.value)} />
          <label>Slug (não editável, é a chave que o DigoChat manda)</label>
          <input value={e.slug} disabled />
        </div>

        <div className="card">
          <div className="card-title"><Icon name="lock" size={14} />Credenciais Telegram</div>
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
      </div>
      <div>
        <div className="card">
          <div className="card-title"><Icon name="send" size={14} />Conteúdo</div>
          <label>Texto da mensagem</label>
          <textarea value={e.texto || ""} onChange={(ev) => set("texto", ev.target.value)} />
          <label>URL do áudio (.ogg) — opcional</label>
          <input value={e.audio_url || ""} onChange={(ev) => set("audio_url", ev.target.value)} />
        </div>

        <div className="card">
          <div className="card-title"><Icon name="sliders" size={14} />Canais</div>
          {[["canal_telegram", "Telegram"], ["canal_email", "E-mail"], ["ativo", "Expert ativo"]].map(([k, l]) => (
            <label className="switch" key={k}>
              <span>{l}</span>
              <input type="checkbox" checked={!!e[k]} onChange={(ev) => set(k, ev.target.checked)} />
              <span className="track" />
            </label>
          ))}
        </div>
      </div>
      </div>

        <div className="row">
          <button onClick={salvar} disabled={salvando}>{salvando ? "..." : "Salvar"}</button>
          {msg && <span className={`msg ${msg === "Salvo" ? "ok" : "err"}`}>{msg}</span>}
        </div>
    </Shell>
  );
}
