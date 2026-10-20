import { NextResponse } from "next/server";
import { sbSelect, sbInsert, sbCount } from "../../../lib/supabase";
import { contexto, erro, tokenAleatorio } from "../../../lib/auth";
import { plano } from "../../../lib/planos";

export async function GET() {
  const c = await contexto();
  if (c.erro) return c.erro;
  const ws = c.workspace.id;
  const [membros, convites] = await Promise.all([
    sbSelect("membros", { workspace_id: `eq.${ws}`, select: "papel,criado_em,usuario:usuarios(id,nome,email)", order: "criado_em.asc" }),
    c.papel === "leitor" ? [] : sbSelect("convites", {
      workspace_id: `eq.${ws}`, aceito_em: "is.null", expira_em: `gt.${new Date().toISOString()}`,
      select: "id,email,papel,token,expira_em", order: "criado_em.desc",
    }),
  ]);
  return NextResponse.json({ membros, convites, eu: c.usuario.id, papel: c.papel });
}

// Cria um convite e devolve o link (o painel nao envia e-mail: copie e mande).
export async function POST(req) {
  const c = await contexto("admin");
  if (c.erro) return c.erro;
  const { email, papel } = await req.json();
  const em = String(email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return erro(400, "E-mail inválido");
  if (!["admin", "leitor"].includes(papel)) return erro(400, "Papel inválido");

  const ws = c.workspace.id;
  const [membros, pendentes] = await Promise.all([
    sbCount("membros", { workspace_id: `eq.${ws}` }, "usuario_id"),
    sbCount("convites", { workspace_id: `eq.${ws}`, aceito_em: "is.null", expira_em: `gt.${new Date().toISOString()}` }),
  ]);
  const lim = plano(c.workspace.plano).membros;
  if (membros + pendentes >= lim) return erro(402, `Seu plano permite até ${lim} pessoas. Faça upgrade para convidar mais.`);

  const [conv] = await sbInsert("convites", { workspace_id: ws, email: em, papel, token: tokenAleatorio() });
  return NextResponse.json(conv);
}
