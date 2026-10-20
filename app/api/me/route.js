import { NextResponse } from "next/server";
import { contexto, wsPublico } from "../../../lib/auth";
import { plano } from "../../../lib/planos";

export async function GET() {
  const c = await contexto();
  if (c.erro) {
    // logado mas sem nenhum workspace: o front oferece criar um
    if (c.usuario) return NextResponse.json({ usuario: c.usuario, workspaces: [], workspace: null });
    return c.erro;
  }
  return NextResponse.json({
    usuario: c.usuario,
    papel: c.papel,
    workspace: { ...wsPublico(c.workspace), limites: plano(c.workspace.plano) },
    workspaces: c.membros.map((m) => ({ id: m.workspace.id, nome: m.workspace.nome, plano: m.workspace.plano, papel: m.papel })),
  });
}
