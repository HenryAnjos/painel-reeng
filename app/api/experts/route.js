import { NextResponse } from "next/server";
import { sbSelect, sbInsert, sbCount } from "../../../lib/supabase";
import { contexto, erro } from "../../../lib/auth";
import { plano } from "../../../lib/planos";
import { CAMPOS_LISTA, exibir } from "../../../lib/experts";

export async function GET() {
  const c = await contexto();
  if (c.erro) return c.erro;
  const rows = await sbSelect("experts", {
    workspace_id: `eq.${c.workspace.id}`, select: `${CAMPOS_LISTA},session_string`, order: "id.asc",
  });
  return NextResponse.json(rows.map(exibir));
}

export async function POST(req) {
  const c = await contexto("admin");
  if (c.erro) return c.erro;
  const body = await req.json();
  const slug = String(body.slug || "").trim();
  if (!slug) return erro(400, "Informe o slug");

  const ws = c.workspace.id;
  const lim = plano(c.workspace.plano).experts;
  if ((await sbCount("experts", { workspace_id: `eq.${ws}` })) >= lim) {
    return erro(402, `Seu plano permite até ${lim} experts. Faça upgrade para adicionar mais.`);
  }
  try {
    const [row] = await sbInsert("experts", {
      workspace_id: ws,
      slug,
      nome: body.nome || slug,
      ativo: true,
      canal_telegram: true,
      canal_email: true,
    });
    return NextResponse.json(exibir(row));
  } catch (e) {
    if (e.code === "23505") return erro(409, "Já existe um expert com este slug");
    throw e;
  }
}
