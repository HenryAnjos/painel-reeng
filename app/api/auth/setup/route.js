import { NextResponse } from "next/server";
import { sbCount, sbSelect, sbInsert } from "../../../../lib/supabase";
import { abrirSessao, erro } from "../../../../lib/auth";
import { validarConta, criarUsuario, criarWorkspace } from "../../../../lib/contas";

// Primeiro acesso: so funciona enquanto nao existe nenhum usuario.
// Cria o admin da plataforma e o liga ao workspace migrado ("Principal").
export async function GET() {
  return NextResponse.json({ pendente: (await sbCount("usuarios", {})) === 0 });
}

export async function POST(req) {
  if ((await sbCount("usuarios", {})) > 0) return erro(403, "Setup já concluído");
  const body = await req.json();
  const invalido = validarConta(body);
  if (invalido) return erro(400, invalido);

  const u = await criarUsuario(body, true);
  const [orfao] = await sbSelect("workspaces", { select: "id", order: "criado_em.asc", limit: 1 });
  let wsId;
  if (orfao) {
    await sbInsert("membros", { workspace_id: orfao.id, usuario_id: u.id, papel: "dono" });
    wsId = orfao.id;
  } else {
    wsId = (await criarWorkspace(body.workspace || "Principal", u.id, "scale")).id;
  }
  return abrirSessao(NextResponse.json({ ok: true }), u.id, wsId);
}
