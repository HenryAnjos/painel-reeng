import { NextResponse } from "next/server";
import { sbSelect, sbInsert } from "../../../lib/supabase";

export async function GET() {
  const rows = await sbSelect("experts", "select=*&order=id.asc");
  return NextResponse.json(rows);
}

export async function POST(req) {
  const body = await req.json();
  const data = {
    slug: body.slug,
    nome: body.nome || body.slug,
    texto: body.texto || null,
    ativo: body.ativo ?? true,
    canal_telegram: body.canal_telegram ?? true,
    canal_email: body.canal_email ?? true,
  };
  const row = await sbInsert("experts", data);
  return NextResponse.json(row[0]);
}
