import { NextResponse } from "next/server";
import { sbPage } from "../../../lib/supabase";
import { contexto } from "../../../lib/auth";

const POR_PAGINA = 50;

export async function GET(req) {
  const c = await contexto();
  if (c.erro) return c.erro;
  const sp = new URL(req.url).searchParams;
  const pagina = Math.max(1, Number(sp.get("pagina")) || 1);
  const por = Math.min(200, Math.max(1, Number(sp.get("por")) || POR_PAGINA));

  const q = { workspace_id: `eq.${c.workspace.id}`, select: "*", order: "criado_em.desc,id.desc" };
  if (sp.get("expert")) q.expert = `eq.${sp.get("expert")}`;
  if (sp.get("canal")) q.canal = `eq.${sp.get("canal")}`;
  if (sp.get("status")) q.status = `eq.${sp.get("status")}`;
  const datas = [];
  if (sp.get("de")) datas.push(`gte.${sp.get("de")}T00:00:00-03:00`);
  if (sp.get("ate")) datas.push(`lte.${sp.get("ate")}T23:59:59-03:00`);
  if (datas.length) q.criado_em = datas;
  // busca por username, e-mail ou user_id (remove caracteres de sintaxe do PostgREST)
  const busca = (sp.get("q") || "").replace(/[,()*:"\\]/g, "").trim();
  if (busca) q.or = `(username.ilike.*${busca}*,email.ilike.*${busca}*,user_id.eq.${busca})`;

  const { rows, total } = await sbPage("envios", q, (pagina - 1) * por, por);
  return NextResponse.json({ rows, total, pagina, por });
}
