import { NextResponse } from "next/server";
import { sbSelectOne, sbUpdate, sbDelete } from "../../../../lib/supabase";
import { contexto, erro } from "../../../../lib/auth";
import { exibir } from "../../../../lib/experts";

const doWs = (c, id) => ({ id: `eq.${id}`, workspace_id: `eq.${c.workspace.id}` });

export async function GET(_req, { params }) {
  const c = await contexto();
  if (c.erro) return c.erro;
  const row = await sbSelectOne("experts", { ...doWs(c, params.id), select: "*" });
  if (!row) return erro(404, "Expert não encontrado");
  return NextResponse.json(exibir(row));
}

export async function PATCH(req, { params }) {
  const c = await contexto("admin");
  if (c.erro) return c.erro;
  const b = await req.json();
  const data = {};
  for (const k of ["nome", "texto", "audio_url"]) if (b[k] !== undefined) data[k] = b[k] || null;
  for (const k of ["canal_telegram", "canal_email", "ativo"]) if (b[k] !== undefined) data[k] = !!b[k];
  if (b.api_id !== undefined) data.api_id = b.api_id ? Number(b.api_id) : null;
  // credenciais: so grava se vier valor novo (o painel nunca recebe as atuais)
  if (b.api_hash) data.api_hash = String(b.api_hash).trim();
  if (b.session_string) data.session_string = String(b.session_string).trim();
  if (b.limpar_sessao) data.session_string = null;

  const rows = await sbUpdate("experts", doWs(c, params.id), data);
  if (rows.length === 0) return erro(404, "Expert não encontrado");
  return NextResponse.json(exibir(rows[0]));
}

export async function DELETE(_req, { params }) {
  const c = await contexto("admin");
  if (c.erro) return c.erro;
  await sbDelete("experts", doWs(c, params.id));
  return NextResponse.json({ ok: true });
}
