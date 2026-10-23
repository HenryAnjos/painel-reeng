import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { sbSelectOne } from "../../../../../lib/supabase";
import { contexto, erro } from "../../../../../lib/auth";

// Conecta a conta do Telegram do expert: repassa ao motor, que fala com o
// Telegram e grava a session_string. Etapas: inicio -> codigo -> [senha].
const ETAPAS = {
  inicio: (b) => ({ telefone: String(b.telefone || "") }),
  codigo: (b) => ({ login_id: String(b.login_id || ""), codigo: String(b.codigo || "") }),
  senha: (b) => ({ login_id: String(b.login_id || ""), senha: String(b.senha || "") }),
};

export async function POST(req, { params }) {
  const c = await contexto("admin");
  if (c.erro) return c.erro;
  const exp = await sbSelectOne("experts", { id: `eq.${params.id}`, workspace_id: `eq.${c.workspace.id}`, select: "id" });
  if (!exp) return erro(404, "Expert não encontrado");

  const motor = process.env.MOTOR_URL;
  // mesmo tratamento do motor: sem espacos/quebras/aspas coladas junto
  const token = String(process.env.PAINEL_TOKEN || "").trim().replace(/^['"]+|['"]+$/g, "").trim();
  if (!motor || !token) return erro(500, "Configure MOTOR_URL e PAINEL_TOKEN no painel");

  const b = await req.json();
  const montar = ETAPAS[b.etapa];
  if (!montar) return erro(400, "Etapa inválida");

  let r;
  try {
    r = await fetch(`${motor.replace(/\/$/, "")}/telegram/login/${b.etapa}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-painel-token": token },
      body: JSON.stringify({ expert_id: exp.id, ...montar(b) }),
      cache: "no-store",
    });
  } catch {
    return erro(502, "Motor fora do ar ou MOTOR_URL errado");
  }
  const data = await r.json().catch(() => ({}));
  if (r.status === 401) return erro(502, await diagnosticoToken(motor, token));
  if (!r.ok) return erro(r.status, data.detail || "Erro no motor");
  return NextResponse.json(data);
}

// Compara a impressao digital do token (8 primeiros hex do sha256, nao revela
// o valor) dos dois lados para dizer qual esta errado.
async function diagnosticoToken(motor, token) {
  const nosso = createHash("sha256").update(token).digest("hex").slice(0, 8);
  let deles;
  try {
    const h = await fetch(`${motor.replace(/\/$/, "")}/health`, { cache: "no-store" });
    deles = (await h.json()).painel_token;
  } catch {}
  if (deles === undefined) return `PAINEL_TOKEN recusado pelo motor. O motor parece estar numa versão antiga: faça um novo deploy na Railway. (painel: ${nosso})`;
  if (deles === null) return "O motor está sem PAINEL_TOKEN: crie a variável na Railway e faça o deploy.";
  return `PAINEL_TOKEN diferente entre painel (${nosso}) e motor (${deles}). Confira as variáveis e faça o redeploy de quem mudou.`;
}
