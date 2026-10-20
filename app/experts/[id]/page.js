"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Shell from "../../nav";
import Icon from "../../icons";
import { api, useMe, podeGerir, Msg } from "../../ui";

export default function EditarExpert() {
  const { id } = useParams();
  const router = useRouter();
  const me = useMe();
  const gestor = podeGerir(me);
  const [e, setE] = useState(null);
  const [cred, setCred] = useState({ api_hash: "", session_string: "" });
  const [msg, setMsg] = useState(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    api(`/api/experts/${id}`).then(setE).catch((x) => setMsg({ texto: x.message }));
  }, [id]);

  function set(campo, valor) { setE({ ...e, [campo]: valor }); }

  async function salvar() {
    setSalvando(true);
    setMsg(null);
    try {
      const novo = await api(`/api/experts/${id}`, {
        method: "PATCH",
        body: {
          nome: e.nome,
          api_id: e.api_id || null,
          texto: e.texto,
          audio_url: e.audio_url,
          canal_telegram: e.canal_telegram,
          canal_email: e.canal_email,
          ativo: e.ativo,
          ...(cred.api_hash && { api_hash: cred.api_hash }),
          ...(cred.session_string && { session_string: cred.session_string }),
        },
      });
      setE(novo);
      setCred({ api_hash: "", session_string: "" });
      setMsg({ ok: true, texto: "Salvo" });
    } catch (x) {
      setMsg({ texto: x.message });
    }
    setSalvando(false);
  }

  async function removerSessao() {
    if (!confirm("Remover a sessão do Telegram deste expert? Ele para de enviar até receber uma nova.")) return;
    setE(await api(`/api/experts/${id}`, { method: "PATCH", body: { limpar_sessao: true } }));
  }

  async function excluir() {
    if (!confirm(`Excluir o expert "${e.slug}"? O histórico de envios continua guardado.`)) return;
    await api(`/api/experts/${id}`, { method: "DELETE" });
    router.push("/experts");
  }

  if (!e) return (<Shell title="Expert"><p className="muted">{msg ? msg.texto : "Carregando..."}</p></Shell>);

  return (
    <Shell
      title={e.nome || e.slug}
      subtitle={<span className="mono">{e.slug}</span>}
      actions={<button className="ghost" onClick={() => router.push("/experts")}><Icon name="arrowLeft" size={14} />Voltar</button>}
    >
      <fieldset disabled={!gestor} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      <div className="grid2">
        <div>
          <div className="card">
            <div className="card-title"><Icon name="users" size={14} />identificação</div>
            <label>Nome</label>
            <input value={e.nome || ""} onChange={(ev) => set("nome", ev.target.value)} />
            <label>Slug (não editável, é a chave que o DigoChat manda)</label>
            <input value={e.slug} disabled />
          </div>

          <div className="card">
            <div className="card-title"><Icon name="lock" size={14} />credenciais telegram</div>
            <label>api_id</label>
            <input value={e.api_id || ""} onChange={(ev) => set("api_id", ev.target.value)} />
            <label>api_hash</label>
            <input type="password" autoComplete="off" value={cred.api_hash}
              placeholder={e.tem_api_hash ? "•••••••• configurado — preencha só para trocar" : "cole o api_hash"}
              onChange={(ev) => setCred({ ...cred, api_hash: ev.target.value })} />
            <label>session_string</label>
            <textarea value={cred.session_string}
              placeholder={e.tem_sessao ? "•••••••• sessão configurada — cole uma nova só para trocar" : "cole a string completa gerada pelo script"}
              onChange={(ev) => setCred({ ...cred, session_string: ev.target.value })} />
            <div className="row" style={{ marginTop: 10, justifyContent: "space-between" }}>
              <span className={`pill ${e.tem_sessao ? "on" : "sem_sessao"}`}>{e.tem_sessao ? "sessão ativa" : "sem sessão"}</span>
              {e.tem_sessao && gestor && <button type="button" className="danger sm" onClick={removerSessao}>Remover sessão</button>}
            </div>
            <p className="help">Por segurança, credenciais salvas nunca são exibidas de volta.</p>
          </div>
        </div>
        <div>
          <div className="card">
            <div className="card-title"><Icon name="send" size={14} />conteúdo</div>
            <label>Texto da mensagem</label>
            <textarea value={e.texto || ""} onChange={(ev) => set("texto", ev.target.value)} />
            <label>URL do áudio (.ogg) — opcional</label>
            <input value={e.audio_url || ""} onChange={(ev) => set("audio_url", ev.target.value)} />
          </div>

          <div className="card">
            <div className="card-title"><Icon name="sliders" size={14} />canais</div>
            {[["canal_telegram", "Telegram"], ["canal_email", "E-mail"], ["ativo", "Expert ativo"]].map(([k, l]) => (
              <label className="switch" key={k}>
                <span>{l}</span>
                <input type="checkbox" checked={!!e[k]} onChange={(ev) => set(k, ev.target.checked)} />
                <span className="track" />
              </label>
            ))}
          </div>

          {gestor && (
            <div className="card">
              <div className="card-title warn"><Icon name="trash" size={14} />zona de perigo</div>
              <button type="button" className="danger" onClick={excluir}><Icon name="trash" size={14} />Excluir expert</button>
            </div>
          )}
        </div>
      </div>
      </fieldset>

      {gestor && (
        <div className="row">
          <button onClick={salvar} disabled={salvando}>{salvando ? "Salvando…" : "Salvar"}</button>
          <Msg m={msg} />
        </div>
      )}
    </Shell>
  );
}
