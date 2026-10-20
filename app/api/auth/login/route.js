import { NextResponse } from "next/server";
import { sbSelectOne } from "../../../../lib/supabase";
import { confereSenha, abrirSessao, erro } from "../../../../lib/auth";

export async function POST(req) {
  const { email, senha } = await req.json();
  if (!email || !senha) return erro(400, "Informe e-mail e senha");
  const u = await sbSelectOne("usuarios", { email: `eq.${String(email).trim().toLowerCase()}`, select: "id,senha_hash" });
  if (!u || !confereSenha(senha, u.senha_hash)) return erro(401, "E-mail ou senha incorretos");
  return abrirSessao(NextResponse.json({ ok: true }), u.id);
}
