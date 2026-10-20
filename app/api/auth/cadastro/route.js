import { NextResponse } from "next/server";
import { abrirSessao, erro } from "../../../../lib/auth";
import { validarConta, criarUsuario, criarWorkspace } from "../../../../lib/contas";

// Cadastro publico: cria a conta e um workspace novo (plano starter).
// Desligue com CADASTRO_ABERTO=false para operar so por convite.
export async function POST(req) {
  if (process.env.CADASTRO_ABERTO === "false") return erro(403, "Cadastro fechado. Peça um convite.");
  const body = await req.json();
  const invalido = validarConta(body);
  if (invalido) return erro(400, invalido);
  if (!body.workspace || !String(body.workspace).trim()) return erro(400, "Informe o nome da empresa");
  try {
    const u = await criarUsuario(body);
    const ws = await criarWorkspace(body.workspace, u.id);
    return abrirSessao(NextResponse.json({ ok: true }), u.id, ws.id);
  } catch (e) {
    if (e.publico) return erro(409, e.message);
    throw e;
  }
}
