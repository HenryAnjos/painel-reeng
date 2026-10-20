"use client";
import { useEffect, useState } from "react";
import Shell from "../nav";
import Icon from "../icons";
import { api, Copiar, Msg } from "../ui";

const STATUS = [
  ["enviado", "áudio + texto entregues"],
  ["duplicado", "já recebeu dentro da janela de deduplicação"],
  ["nao_resolvido", "sem username e sem grupo em comum: não achou o lead"],
  ["bloqueado", "a privacidade do lead impede o envio"],
  ["limite_diario", "o expert atingiu o limite de envios do dia"],
  ["sem_sessao", "o expert não tem sessão do Telegram válida"],
  ["flood / peer_flood", "o Telegram limitou a conta: o motor pausa sozinho"],
];

export default function Integracao() {
  const [ws, setWs] = useState(null);
  const [nova, setNova] = useState("");
  const [msg, setMsg] = useState(null);

  useEffect(() => { api("/api/workspace").then(setWs); }, []);

  async function gerar() {
    const aviso = ws.api_key_prefixo
      ? "Gerar uma nova chave? A chave atual para de funcionar na hora — atualize o n8n em seguida."
      : "Gerar a chave de API deste workspace?";
    if (!confirm(aviso)) return;
    setMsg(null);
    try {
      const r = await api("/api/workspace/chave", { method: "POST" });
      setNova(r.chave);
      setWs({ ...ws, api_key_prefixo: r.prefixo });
    } catch (x) { setMsg({ texto: x.message }); }
  }

  const base = ws?.motor_url || "https://SEU-MOTOR";
  const chave = nova || (ws?.api_key_prefixo ? `${ws.api_key_prefixo}…` : "SUA_CHAVE");

  return (
    <Shell title="Integração" subtitle="Ligue o DigoChat / n8n ao motor de envio">
      <div className="grid2">
        <div className="card">
          <div className="card-title"><Icon name="key" size={14} />chave de api</div>
          {!ws && <p className="muted">Carregando...</p>}
          {ws && (
            <>
              <div className="kv">
                <span>Chave atual</span>
                <span className="mono">{ws.api_key_prefixo ? `${ws.api_key_prefixo}••••••••••••` : "nenhuma"}</span>
              </div>
              <div className="kv">
                <span>Endereço do motor</span>
                <span className="mono">{ws.motor_url || "defina MOTOR_URL no painel"}</span>
              </div>
              <div className="row" style={{ marginTop: 14 }}>
                <button onClick={gerar}><Icon name="refresh" size={14} />{ws.api_key_prefixo ? "Gerar nova chave" : "Gerar chave"}</button>
                <Msg m={msg} />
              </div>
              {nova && (
                <div className="chave-nova">
                  <b>Copie agora:</b> por segurança esta chave não será mostrada de novo.
                  <div className="code">{nova}</div>
                  <Copiar texto={nova} rotulo="Copiar chave" />
                </div>
              )}
              <p className="help">Cada workspace tem a sua chave. É ela que diz ao motor de qual cliente é o envio.</p>
            </>
          )}
        </div>

        <div className="card">
          <div className="card-title"><Icon name="activity" size={14} />respostas do motor</div>
          <div className="list">
            {STATUS.map(([s, d]) => (
              <div className="list-row" key={s}>
                <span className="pill" style={{ flexShrink: 0 }}>{s}</span>
                <span className="grow muted" style={{ whiteSpace: "normal", fontSize: 13 }}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title"><Icon name="send" size={14} />n8n · nó http request — telegram</div>
        <div className="code">{`POST ${base}/send
x-api-key: ${chave}
Content-Type: application/json

{
  "expert": "{{ $json.body.expert }}",
  "user_id": "{{ $json.body.user_id }}",
  "username": "{{ $json.body.username }}"
}`}</div>
      </div>
      <div className="card">
        <div className="card-title"><Icon name="mail" size={14} />n8n · nó http request — e-mail</div>
        <div className="code">{`POST ${base}/send-email
x-api-key: ${chave}
Content-Type: application/json

{
  "expert": "{{ $json.body.expert }}",
  "email": "{{ $json.body.email }}"
}`}</div>
        <p className="help">O campo <span className="mono">expert</span> precisa ser igual ao slug cadastrado em Experts.</p>
      </div>
    </Shell>
  );
}
