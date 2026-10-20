"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Shell from "../../nav";
import Icon from "../../icons";
import { api, useMe, podeGerir, Msg, Copiar } from "../../ui";

const SCRIPT_PC = `from telethon.sync import TelegramClient
from telethon.sessions import StringSession

api_id = int(input("api_id: "))
api_hash = input("api_hash: ")

with TelegramClient(StringSession(), api_id, api_hash) as client:
    print("\\nSESSION STRING (copie tudo):\\n")
    print(client.session.save())`;

const SCRIPT_COLAB = `!pip install -q telethon
from telethon import TelegramClient
from telethon.sessions import StringSession

api_id = int(input("api_id: "))
api_hash = input("api_hash: ")
client = TelegramClient(StringSession(), api_id, api_hash)
await client.start()
print("\\nSESSION STRING (copie tudo):\\n")
print(client.session.save())
await client.disconnect()`;

function TutorialSessao() {
  return (
    <details className="tutorial">
      <summary><Icon name="key" size={13} />Como pegar a session_string (passo a passo)</summary>
      <p className="help" style={{ marginTop: 10 }}>
        O jeito mais fácil é o botão <b>Enviar código</b> no card acima: o painel gera e salva a sessão sozinho.
        Use este passo a passo só se preferir gerar por fora.
      </p>
      <ol>
        <li>
          <b>Pegue o api_id e o api_hash.</b> Entre em <a href="https://my.telegram.org" target="_blank" rel="noreferrer">my.telegram.org</a> com
          o número da conta do expert → <i>API development tools</i> → crie um app (qualquer nome, ex.: “reeng”) → copie o <b>App api_id</b> e o <b>App api_hash</b>.
        </li>
        <li>
          <b>Rode o script</b> em um dos dois lugares:
          <div className="tut-op">
            <b>Sem instalar nada (Google Colab):</b> abra <a href="https://colab.research.google.com" target="_blank" rel="noreferrer">colab.research.google.com</a> → <i>Novo notebook</i> → cole o código abaixo em uma célula → clique em ▶.
            <div className="code">{SCRIPT_COLAB}</div>
            <Copiar texto={SCRIPT_COLAB} rotulo="Copiar código do Colab" />
          </div>
          <div className="tut-op">
            <b>No computador (Python 3):</b> rode <span className="mono">pip install telethon</span>, salve o código abaixo como <span className="mono">gerar_sessao.py</span> e rode <span className="mono">python gerar_sessao.py</span>.
            <div className="code">{SCRIPT_PC}</div>
            <Copiar texto={SCRIPT_PC} rotulo="Copiar script" />
          </div>
        </li>
        <li>
          <b>Responda o que o script pedir:</b> api_id, api_hash, o telefone com DDI (ex.: <span className="mono">+5511999998888</span>),
          o código que chega <b>no app do Telegram</b> e, se a conta tiver, a senha de verificação em duas etapas.
        </li>
        <li>
          <b>Copie a string inteira</b> que aparece no final (uma linha longa, começa com <span className="mono">1</span>) e cole no campo
          <i> session_string</i> acima. Preencha também api_id e api_hash e clique em <b>Salvar</b>.
        </li>
        <li>
          <b>Segurança:</b> quem tem a session_string controla a conta do Telegram. Não mande por mensagem, apague o script/notebook
          depois e, se vazar, encerre a sessão em Telegram → Configurações → Dispositivos.
        </li>
      </ol>
    </details>
  );
}

// Conectar a conta do Telegram: telefone -> codigo do app -> [senha 2 etapas]
function ConectarTelegram({ id, conectado, onConectado }) {
  const [etapa, setEtapa] = useState("telefone");
  const [f, setF] = useState({ telefone: "", codigo: "", senha: "" });
  const [loginId, setLoginId] = useState("");
  const [msg, setMsg] = useState(null);
  const [carregando, setCarregando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setCarregando(true);
    setMsg(null);
    try {
      const corpo = etapa === "telefone"
        ? { etapa: "inicio", telefone: f.telefone }
        : etapa === "codigo" ? { etapa: "codigo", login_id: loginId, codigo: f.codigo }
          : { etapa: "senha", login_id: loginId, senha: f.senha };
      const r = await api(`/api/experts/${id}/telegram`, { method: "POST", body: corpo });
      if (r.login_id) { setLoginId(r.login_id); setEtapa("codigo"); }
      else if (r.precisa_senha) setEtapa("senha");
      else if (r.ok) {
        setEtapa("telefone");
        setF({ telefone: "", codigo: "", senha: "" });
        setMsg({ ok: true, texto: `Conectado como ${r.nome || ""}${r.username ? ` (@${r.username})` : ""}` });
        onConectado();
      }
    } catch (x) {
      setMsg({ texto: x.message });
      if (/expirad/i.test(x.message)) setEtapa("telefone");
    }
    setCarregando(false);
  }

  return (
    <form onSubmit={enviar}>
      {etapa === "telefone" && (
        <>
          <label>{conectado ? "Trocar a conta: telefone com DDI" : "Telefone da conta do Telegram (com DDI)"}</label>
          <input placeholder="+55 11 99999-8888" value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} />
          <p className="help">O Telegram envia um código para o app dessa conta (não por SMS).</p>
        </>
      )}
      {etapa === "codigo" && (
        <>
          <label>Código que chegou no app do Telegram</label>
          <input autoFocus inputMode="numeric" placeholder="12345" value={f.codigo} onChange={(e) => setF({ ...f, codigo: e.target.value })} />
          <p className="help">Válido por 10 minutos. Não encaminhe o código por mensagem: o Telegram bloqueia o login.</p>
        </>
      )}
      {etapa === "senha" && (
        <>
          <label>Senha de verificação em duas etapas</label>
          <input autoFocus type="password" autoComplete="off" value={f.senha} onChange={(e) => setF({ ...f, senha: e.target.value })} />
        </>
      )}
      <div className="row" style={{ marginTop: 12 }}>
        <button disabled={carregando}>
          {carregando ? "Aguarde…" : etapa === "telefone" ? "Enviar código" : "Confirmar"}
        </button>
        {etapa !== "telefone" && <button type="button" className="ghost" onClick={() => { setEtapa("telefone"); setMsg(null); }}>Cancelar</button>}
        <Msg m={msg} />
      </div>
    </form>
  );
}

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
    if (!confirm("Desconectar a conta do Telegram deste expert? Ele para de enviar até ser conectado de novo.")) return;
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
            <div className="card-title"><Icon name="send" size={14} />conta do telegram</div>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
              <span className={`pill ${e.tem_sessao ? "on" : "sem_sessao"}`}>{e.tem_sessao ? "conectada" : "não conectada"}</span>
              {e.tem_sessao && gestor && <button type="button" className="danger sm" onClick={removerSessao}>Desconectar</button>}
            </div>
            {gestor && <ConectarTelegram id={id} conectado={e.tem_sessao} onConectado={() => setE((x) => ({ ...x, tem_sessao: true }))} />}
            <p className="help">Prefere colar a session_string? Abra <b>avançado</b> abaixo: tem o passo a passo.</p>
          </div>

          <details className="card">
            <summary className="card-title" style={{ cursor: "pointer", marginBottom: 0 }}><Icon name="lock" size={14} />avançado: credenciais manuais</summary>
            <p className="help">Opcional. Em branco, o motor usa o api_id/api_hash padrão da plataforma.</p>
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
            <p className="help">Por segurança, credenciais salvas nunca são exibidas de volta.</p>
            <TutorialSessao />
          </details>
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
