import { NextResponse } from "next/server";
import { sbSelect, sbUpdate } from "../../../../lib/supabase";

export async function GET(_req, { params }) {
  const rows = await sbSelect("experts", `id=eq.${params.id}&select=*`);
  if (!rows.length) return NextResponse.json({ erro: "nao encontrado" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PATCH(req, { params }) {
  const body = await req.json();
  // so os campos editaveis
  const campos = [
    "nome", "api_id", "api_hash", "session_string",
    "texto", "audio_url", "canal_telegram", "canal_email", "ativo",
  ];
  const data = { atualizado_em: new Date().toISOString() };
  for (const c of campos) if (c in body) data[c] = body[c];
  const row = await sbUpdate("experts", `id=eq.${params.id}`, data);
  return NextResponse.json(row[0]);
}
