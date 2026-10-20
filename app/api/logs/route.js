import { NextResponse } from "next/server";
import { sbSelect } from "../../../lib/supabase";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const partes = ["select=*", "order=criado_em.desc", "limit=200"];
  const expert = searchParams.get("expert");
  const canal = searchParams.get("canal");
  const status = searchParams.get("status");
  if (expert) partes.push(`expert=eq.${expert}`);
  if (canal) partes.push(`canal=eq.${canal}`);
  if (status) partes.push(`status=eq.${status}`);
  const rows = await sbSelect("envios", partes.join("&"));
  return NextResponse.json(rows);
}
