import { NextResponse } from "next/server";
import { sbSelect } from "../../../../lib/supabase";
import { usuarioAtual, erro, COOKIE_WS } from "../../../../lib/auth";

export async function POST(req) {
  const u = await usuarioAtual();
  if (!u) return erro(401, "nao autenticado");
  const { id } = await req.json();
  const m = await sbSelect("membros", { usuario_id: `eq.${u.id}`, workspace_id: `eq.${id}`, select: "papel" });
  if (m.length === 0) return erro(403, "sem acesso a este workspace");
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_WS, id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 7 * 86400, secure: process.env.NODE_ENV === "production" });
  return res;
}
