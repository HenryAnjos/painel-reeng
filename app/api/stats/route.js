import { NextResponse } from "next/server";
import { sbSelect } from "../../../lib/supabase";

// Status que contam como falha de envio. duplicado/expert_inativo/canal_desligado
// sao descartes intencionais e ficam em "ignorados".
const FALHAS = ["erro", "flood", "peer_flood", "bloqueado", "nao_resolvido", "sem_sessao", "pausado"];
const TZ = "America/Sao_Paulo";

function diaSP(d) {
  return new Date(d).toLocaleDateString("en-CA", { timeZone: TZ });
}

export async function GET() {
  const desde = new Date(Date.now() - 7 * 864e5).toISOString();
  const [envios, experts] = await Promise.all([
    sbSelect("envios", `select=expert,canal,status,criado_em&criado_em=gte.${desde}&order=criado_em.desc&limit=20000`),
    sbSelect("experts", "select=id,slug,nome,ativo,session_string"),
  ]);

  const hoje = diaSP(Date.now());
  const dias = [];
  for (let i = 6; i >= 0; i--) dias.push(diaSP(Date.now() - i * 864e5));
  const porDia = Object.fromEntries(dias.map((d) => [d, { enviados: 0, falhas: 0 }]));

  const h = { enviados: 0, falhas: 0, ignorados: 0, telegram: 0, email: 0 };
  const porExpert = {};

  for (const e of envios) {
    const d = diaSP(e.criado_em);
    const falha = FALHAS.includes(e.status);
    if (porDia[d]) {
      if (e.status === "enviado") porDia[d].enviados++;
      else if (falha) porDia[d].falhas++;
    }
    if (d !== hoje) continue;
    if (e.status === "enviado") {
      h.enviados++;
      if (e.canal === "telegram") h.telegram++;
      else if (e.canal === "email") h.email++;
    } else if (falha) h.falhas++;
    else h.ignorados++;
    const x = (porExpert[e.expert] ||= { expert: e.expert, enviados: 0, falhas: 0 });
    if (e.status === "enviado") x.enviados++;
    else if (falha) x.falhas++;
  }

  return NextResponse.json({
    hoje: h,
    serie: dias.map((d) => ({ dia: d, ...porDia[d] })),
    porExpert: Object.values(porExpert).sort((a, b) => b.enviados - a.enviados),
    experts: {
      total: experts.length,
      ativos: experts.filter((e) => e.ativo).length,
      semSessao: experts.filter((e) => e.ativo && !e.session_string).map((e) => e.slug),
    },
  });
}
