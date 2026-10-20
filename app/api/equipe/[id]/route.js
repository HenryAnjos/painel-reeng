import { NextResponse } from "next/server";
import { sbSelectOne, sbUpdate, sbDelete } from "../../../../lib/supabase";
import { contexto, erro } from "../../../../lib/auth";

// [id] = usuario_id do membro, ou id do convite com ?convite=1
async function alvo(c, id) {
  return sbSelectOne("membros", { workspace_id: `eq.${c.workspace.id}`, usuario_id: `eq.${id}`, select: "papel" });
}

export async function PATCH(req, { params }) {
  const c = await contexto("admin");
  if (c.erro) return c.erro;
  const { papel } = await req.json();
  if (!["admin", "leitor"].includes(papel)) return erro(400, "Papel inválido");
  const m = await alvo(c, params.id);
  if (!m) return erro(404, "Membro não encontrado");
  if (m.papel === "dono") return erro(403, "O dono não pode ter o papel alterado");
  if (m.papel === "admin" && c.papel !== "dono") return erro(403, "Só o dono altera administradores");
  await sbUpdate("membros", { workspace_id: `eq.${c.workspace.id}`, usuario_id: `eq.${params.id}` }, { papel });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  const c = await contexto("admin");
  if (c.erro) return c.erro;
  const ws = c.workspace.id;
  if (new URL(req.url).searchParams.get("convite")) {
    await sbDelete("convites", { workspace_id: `eq.${ws}`, id: `eq.${params.id}` });
    return NextResponse.json({ ok: true });
  }
  const m = await alvo(c, params.id);
  if (!m) return erro(404, "Membro não encontrado");
  if (m.papel === "dono") return erro(403, "O dono não pode ser removido");
  if (m.papel === "admin" && c.papel !== "dono") return erro(403, "Só o dono remove administradores");
  await sbDelete("membros", { workspace_id: `eq.${ws}`, usuario_id: `eq.${params.id}` });
  return NextResponse.json({ ok: true });
}
