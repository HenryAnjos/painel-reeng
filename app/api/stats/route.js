import { NextResponse } from "next/server";
import { sbRpc } from "../../../lib/supabase";
import { contexto } from "../../../lib/auth";

// Agregacao feita no banco (funcao stats_workspace), escala com o volume.
export async function GET() {
  const c = await contexto();
  if (c.erro) return c.erro;
  const s = await sbRpc("stats_workspace", { p_ws: c.workspace.id, p_tz: "America/Sao_Paulo" });
  return NextResponse.json(s);
}
