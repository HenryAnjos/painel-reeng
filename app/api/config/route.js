import { NextResponse } from "next/server";
import { sbSelect, sbUpdate } from "../../../lib/supabase";

export async function GET() {
  const rows = await sbSelect("config", "id=eq.1&select=*");
  return NextResponse.json(rows[0] || {});
}

export async function PATCH(req) {
  const body = await req.json();
  const campos = [
    "espera_minutos", "dedup_horas", "limite_diario",
    "intervalo_min", "email_remetente", "email_assunto",
  ];
  const data = {};
  for (const c of campos) if (c in body) data[c] = body[c];
  const row = await sbUpdate("config", "id=eq.1", data);
  return NextResponse.json(row[0]);
}
