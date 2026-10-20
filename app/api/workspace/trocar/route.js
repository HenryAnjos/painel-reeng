import { NextResponse } from "next/server";
import { sbSelect, sbSelectOne } from "../../../../lib/supabase";
import { usuarioAtual, erro, COOKIE_WS, UUID } from "../../../../lib/auth";

// Troca o workspace atual. Admin da plataforma pode entrar em qualquer um
// (modo suporte). { id: null } volta para o proprio workspace.
export async function POST(req) {
  const u = await usuarioAtual();
  if (!u) return erro(401, "nao autenticado");
  const { id } = await req.json();
  const res = NextResponse.json({ ok: true });
  if (!id) {
    res.cookies.delete(COOKIE_WS);
    return res;
  }
  if (!UUID.test(String(id))) return erro(400, "workspace invalido");
  const m = await sbSelect("membros", { usuario_id: `eq.${u.id}`, workspace_id: `eq.${id}`, select: "papel" });
  if (m.length === 0) {
    if (!u.admin_plataforma) return erro(403, "sem acesso a este workspace");
    if (!(await sbSelectOne("workspaces", { id: `eq.${id}`, select: "id" }))) return erro(404, "workspace nao encontrado");
  }
  res.cookies.set(COOKIE_WS, id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 7 * 86400, secure: process.env.NODE_ENV === "production" });
  return res;
}
