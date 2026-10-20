import { NextResponse } from "next/server";
import { sbUpdate, sbCount, sbDelete } from "../../../lib/supabase";
import { contexto, wsPublico, erro, COOKIE_WS } from "../../../lib/auth";
import { plano } from "../../../lib/planos";

export async function GET() {
  const c = await contexto();
  if (c.erro) return c.erro;
  const ws = c.workspace;
  const [experts, membros] = await Promise.all([
    sbCount("experts", { workspace_id: `eq.${ws.id}` }),
    sbCount("membros", { workspace_id: `eq.${ws.id}` }, "usuario_id"),
  ]);
  return NextResponse.json({
    ...wsPublico(ws),
    limites: plano(ws.plano),
    uso: { experts, membros },
    motor_url: process.env.MOTOR_URL || null,
  });
}

const INTEIROS = { espera_minutos: [0, 1440], dedup_horas: [1, 720], limite_diario: [1, 1000], intervalo_min: [5, 3600] };

export async function PATCH(req) {
  const c = await contexto("admin");
  if (c.erro) return c.erro;
  const b = await req.json();
  const data = {};
  if (b.nome !== undefined) {
    if (!String(b.nome).trim()) return erro(400, "Nome não pode ficar vazio");
    data.nome = String(b.nome).trim();
  }
  for (const [k, [min, max]] of Object.entries(INTEIROS)) {
    if (b[k] === undefined) continue;
    const n = Number(b[k]);
    if (!Number.isInteger(n) || n < min || n > max) return erro(400, `${k} deve estar entre ${min} e ${max}`);
    data[k] = n;
  }
  for (const k of ["email_remetente", "email_assunto"]) {
    if (b[k] !== undefined) data[k] = b[k] ? String(b[k]).trim() : null;
  }
  const [ws] = await sbUpdate("workspaces", { id: `eq.${c.workspace.id}` }, data);
  return NextResponse.json(wsPublico(ws));
}

// Apaga o workspace atual e tudo dele (experts, envios, membros, convites:
// on delete cascade). So o dono, confirmando com o nome exato.
export async function DELETE(req) {
  const c = await contexto("dono");
  if (c.erro) return c.erro;
  const { confirmar } = await req.json().catch(() => ({}));
  if (String(confirmar || "").trim() !== c.workspace.nome) return erro(400, "Digite o nome do workspace exatamente para confirmar");
  await sbDelete("workspaces", { id: `eq.${c.workspace.id}` });
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE_WS);
  return res;
}
