import { NextResponse } from "next/server";
import { usuarioAtual, erro, COOKIE_WS } from "../../../lib/auth";
import { criarWorkspace } from "../../../lib/contas";

// Cria um workspace novo (o usuario vira dono) e ja troca para ele.
export async function POST(req) {
  const u = await usuarioAtual();
  if (!u) return erro(401, "nao autenticado");
  if (process.env.CADASTRO_ABERTO === "false" && !u.admin_plataforma) {
    return erro(403, "Criação de workspaces desativada");
  }
  const { nome } = await req.json();
  if (!nome || !String(nome).trim()) return erro(400, "Informe o nome");
  const ws = await criarWorkspace(nome, u.id);
  const res = NextResponse.json({ id: ws.id });
  res.cookies.set(COOKIE_WS, ws.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 7 * 86400, secure: process.env.NODE_ENV === "production" });
  return res;
}
