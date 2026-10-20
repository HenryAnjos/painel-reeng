import { NextResponse } from "next/server";
import { sbUpdate } from "../../../../lib/supabase";
import { contexto, novaChaveApi } from "../../../../lib/auth";

// Gera uma nova chave de API do motor. A chave so aparece nesta resposta:
// no banco fica apenas o hash. A chave anterior para de funcionar.
export async function POST() {
  const c = await contexto("admin");
  if (c.erro) return c.erro;
  const { chave, hash, prefixo } = novaChaveApi();
  await sbUpdate("workspaces", { id: `eq.${c.workspace.id}` }, { api_key_hash: hash, api_key_prefixo: prefixo });
  return NextResponse.json({ chave, prefixo });
}
