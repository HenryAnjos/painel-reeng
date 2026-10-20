import { NextResponse } from "next/server";
import { sbUpdate, sbSelectOne, sbDelete } from "../../../../../lib/supabase";
import { usuarioAtual, erro, UUID } from "../../../../../lib/auth";
import { PLANOS } from "../../../../../lib/planos";

export async function PATCH(req, { params }) {
  const u = await usuarioAtual();
  if (!u?.admin_plataforma) return erro(403, "Somente admin da plataforma");
  const { plano } = await req.json();
  if (!PLANOS[plano]) return erro(400, "Plano inválido");
  await sbUpdate("workspaces", { id: `eq.${params.id}` }, { plano });
  return NextResponse.json({ ok: true });
}

// Admin da plataforma apaga o workspace de qualquer cliente (confirmando o nome).
export async function DELETE(req, { params }) {
  const u = await usuarioAtual();
  if (!u?.admin_plataforma) return erro(403, "Somente admin da plataforma");
  if (!UUID.test(params.id)) return erro(400, "workspace invalido");
  const ws = await sbSelectOne("workspaces", { id: `eq.${params.id}`, select: "id,nome" });
  if (!ws) return erro(404, "Workspace não encontrado");
  const { confirmar } = await req.json().catch(() => ({}));
  if (String(confirmar || "").trim() !== ws.nome) return erro(400, "Digite o nome do workspace exatamente para confirmar");
  await sbDelete("workspaces", { id: `eq.${ws.id}` });
  return NextResponse.json({ ok: true });
}
