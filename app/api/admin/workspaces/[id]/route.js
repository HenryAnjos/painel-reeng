import { NextResponse } from "next/server";
import { sbUpdate } from "../../../../../lib/supabase";
import { usuarioAtual, erro } from "../../../../../lib/auth";
import { PLANOS } from "../../../../../lib/planos";

export async function PATCH(req, { params }) {
  const u = await usuarioAtual();
  if (!u?.admin_plataforma) return erro(403, "Somente admin da plataforma");
  const { plano } = await req.json();
  if (!PLANOS[plano]) return erro(400, "Plano inválido");
  await sbUpdate("workspaces", { id: `eq.${params.id}` }, { plano });
  return NextResponse.json({ ok: true });
}
