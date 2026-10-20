import { NextResponse } from "next/server";
import { sbSelectOne, sbSelect, sbInsert, sbUpdate } from "../../../../../lib/supabase";
import { abrirSessao, erro, usuarioAtual } from "../../../../../lib/auth";
import { validarConta, criarUsuario } from "../../../../../lib/contas";

async function convitePendente(token) {
  const c = await sbSelectOne("convites", {
    token: `eq.${token}`, aceito_em: "is.null", select: "id,email,papel,expira_em,workspace:workspaces(id,nome)",
  });
  if (!c || new Date(c.expira_em) < new Date()) return null;
  return c;
}

export async function GET(_req, { params }) {
  const c = await convitePendente(params.token);
  if (!c) return erro(404, "Convite inválido ou expirado");
  const u = await usuarioAtual();
  return NextResponse.json({ email: c.email, papel: c.papel, workspace: c.workspace.nome, logado: u ? u.email : null });
}

// Aceita o convite: com sessao ativa entra direto; senao cria a conta.
export async function POST(req, { params }) {
  const c = await convitePendente(params.token);
  if (!c) return erro(404, "Convite inválido ou expirado");

  let u = await usuarioAtual();
  if (!u) {
    const body = await req.json();
    const dados = { ...body, email: c.email };
    const invalido = validarConta(dados);
    if (invalido) return erro(400, invalido);
    try {
      u = await criarUsuario(dados);
    } catch (e) {
      if (e.publico) return erro(409, "Já existe uma conta com este e-mail. Entre e abra o link de novo.");
      throw e;
    }
  }

  const ja = await sbSelect("membros", { workspace_id: `eq.${c.workspace.id}`, usuario_id: `eq.${u.id}`, select: "papel" });
  if (ja.length === 0) {
    await sbInsert("membros", { workspace_id: c.workspace.id, usuario_id: u.id, papel: c.papel });
  }
  await sbUpdate("convites", { id: `eq.${c.id}` }, { aceito_em: new Date().toISOString() });
  return abrirSessao(NextResponse.json({ ok: true }), u.id, c.workspace.id);
}
