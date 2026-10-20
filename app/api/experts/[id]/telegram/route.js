import { NextResponse } from "next/server";
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
  const token = process.env.PAINEL_TOKEN;
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
  if (!r.ok) return erro(r.status === 401 ? 502 : r.status, r.status === 401 ? "PAINEL_TOKEN diferente entre painel e motor" : (data.detail || "Erro no motor"));
  return NextResponse.json(data);
}
