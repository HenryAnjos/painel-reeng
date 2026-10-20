import { NextResponse } from "next/server";
import { sbRpc } from "../../../../lib/supabase";
import { usuarioAtual, erro } from "../../../../lib/auth";

export async function GET() {
  const u = await usuarioAtual();
  if (!u?.admin_plataforma) return erro(403, "Somente admin da plataforma");
  return NextResponse.json(await sbRpc("stats_plataforma"));
}
