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

const ABAS = [["direto", "CRM direto"], ["n8n", "Via n8n"], ["email", "E-mail"], ["teste", "Testar (curl)"]];

const CORPO_CRM = `{
  "evento": "bot_bloqueado",
  "expert": "Professor",
  "user_id": "{{User Id}}",
  "username": "{{User Name}}",
  "nome": "{{First Name}}"
}`;

const CORPO_N8N = `{
  "expert": "{{ $json.body.expert }}",
  "user_id": "{{ $json.body.user_id }}",
  "username": "{{ $json.body.username }}",
  "nome": "{{ $json.body.nome }}"
}`;

const CORPO_EMAIL = `{
  "expert": "Professor",
  "email": "{{Email}}"
}`;

function Passo({ n, titulo, children }) {
  return (
    <div className="passo">
      <div className="passo-t"><span className="passo-n">{n}</span>{titulo}</div>
      {children}
    </div>
  );
}

function Linha({ texto }) {
  return (
    <div className="linha">
      <span className="mono">{texto}</span>
      <Copiar texto={texto} />
    </div>
  );
}

function Bloco({ texto }) {
  return (
    <div style={{ position: "relative" }}>
      <div className="code">{texto}</div>
      <div style={{ position: "absolute", top: 8, right: 8 }}><Copiar texto={texto} /></div>
    </div>
  );
}

export default function Integracao() {
  const [aba, setAba] = useState("direto");
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
  const chave = nova || "SUA_CHAVE";

  return (
    <Shell title="Integração" subtitle="Ligue o DigoChat ou qualquer CRM ao motor de envio">
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
        <div className="card-title"><Icon name="send" size={14} />como chamar o motor</div>
        <div className="tabs">
          {ABAS.map(([id, nome]) => (
            <button key={id} type="button" className={aba === id ? "on" : ""} onClick={() => setAba(id)}>{nome}</button>
          ))}
        </div>

        {aba === "direto" && (
          <>
            <p className="tab-lead">
              Para o <b>DigoChat</b> ou qualquer CRM com “External Request” / webhook. O CRM precisa permitir configurar <b>cabeçalhos</b> (para enviar a chave).
              O CRM chama o motor direto, <b>sem n8n</b>.
            </p>
            <Passo n="1" titulo="Método e URL"><Linha texto={`POST ${base}/send`} /></Passo>
            <Passo n="2" titulo="Cabeçalhos">
              <Linha texto={`x-api-key: ${chave}`} />
              <Linha texto="Content-Type: application/json" />
            </Passo>
            <Passo n="3" titulo="Corpo (raw / JSON)">
              <Bloco texto={CORPO_CRM} />
              <p className="help">
                Troque <span className="mono">{"{{User Id}}"}</span>, <span className="mono">{"{{User Name}}"}</span> e <span className="mono">{"{{First Name}}"}</span> pelas
                variáveis do seu CRM. <span className="mono">expert</span> = slug cadastrado em Experts. Campos extras (como <span className="mono">evento</span>) são ignorados.
              </p>
            </Passo>
          </>
        )}

        {aba === "n8n" && (
          <>
            <p className="tab-lead">
              Se você já usa o n8n no meio (CRM → webhook do n8n → motor). O CRM manda para o webhook do n8n e o
              n8n repassa ao motor com um nó <b>HTTP Request</b>.
            </p>
            <Passo n="1" titulo="No CRM: External Request para o webhook do n8n">
              <Linha texto="POST https://SEU-N8N/webhook/SEU-ID" />
              <Bloco texto={CORPO_CRM} />
            </Passo>
            <Passo n="2" titulo="No n8n: nó HTTP Request depois do Webhook">
              <Linha texto={`POST ${base}/send`} />
              <Linha texto={`x-api-key: ${chave}`} />
              <Bloco texto={CORPO_N8N} />
            </Passo>
          </>
        )}

        {aba === "email" && (
          <>
            <p className="tab-lead">Reengajamento por e-mail. Mesma chave; o texto do expert vira o corpo do e-mail.</p>
            <Passo n="1" titulo="Método e URL"><Linha texto={`POST ${base}/send-email`} /></Passo>
            <Passo n="2" titulo="Cabeçalhos">
              <Linha texto={`x-api-key: ${chave}`} />
              <Linha texto="Content-Type: application/json" />
            </Passo>
            <Passo n="3" titulo="Corpo (raw / JSON)"><Bloco texto={CORPO_EMAIL} /></Passo>
          </>
        )}

        {aba === "teste" && (
          <>
            <p className="tab-lead">Para testar pelo terminal antes de configurar o CRM.</p>
            <Bloco texto={`curl -X POST "${base}/send" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${chave}" \\
  -d '{"expert": "Professor", "user_id": "123456789", "username": "seu_usuario"}'`} />
          </>
        )}
      </div>
    </Shell>
  );
}
