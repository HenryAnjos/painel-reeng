import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { sbSelectOne } from "../../../../../lib/supabase";
import { contexto, erro } from "../../../../../lib/auth";
import { BUCKET_MIDIAS } from "../../../../../lib/experts";

// Gera uma URL assinada para o navegador subir o arquivo direto no Storage
// (sem passar pelo servidor do painel, que limita o tamanho do corpo).
// O arquivo fica em "<workspace_id>/<expert_id>/<aleatorio>-<nome>".
export async function POST(req, { params }) {
  const c = await contexto("admin");
  if (c.erro) return c.erro;
  const exp = await sbSelectOne("experts", { id: `eq.${params.id}`, workspace_id: `eq.${c.workspace.id}`, select: "id" });
  if (!exp) return erro(404, "Expert não encontrado");

  const b = await req.json();
  const nome = String(b.nome || "arquivo")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^\w.-]+/g, "_").replace(/^\.+/, "").slice(-120) || "arquivo";
  const caminho = `${c.workspace.id}/${exp.id}/${randomBytes(6).toString("hex")}-${nome}`;

  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  const r = await fetch(`${base}/storage/v1/object/upload/sign/${BUCKET_MIDIAS}/${caminho}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: "{}",
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    console.error("upload sign", r.status, t.slice(0, 200));
    return erro(500, "Não foi possível preparar o upload. O bucket 'midias' existe? Rode o schema.sql de novo.");
  }
  const { url } = await r.json();
  return NextResponse.json({ upload_url: `${base}/storage/v1${url}`, arquivo: caminho, nome });
}
