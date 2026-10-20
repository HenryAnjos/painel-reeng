// Autenticacao do painel: usuarios proprios (senha com scrypt) e sessao em
// cookie assinado com HMAC (AUTH_SECRET). Roda so no servidor (Node).
import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sbSelect, sbSelectOne } from "./supabase";

const SECRET = process.env.AUTH_SECRET || "";
const DIAS = 7;
export const COOKIE_SESSAO = "sessao";
export const COOKIE_WS = "ws";

const PESO = { leitor: 1, admin: 2, dono: 3 };

// ---------- senha ----------
export function hashSenha(senha) {
  const sal = crypto.randomBytes(16);
  const h = crypto.scryptSync(senha, sal, 64);
  return `scrypt$${sal.toString("base64")}$${h.toString("base64")}`;
}

export function confereSenha(senha, guardado) {
  const [alg, sal, h] = String(guardado || "").split("$");
  if (alg !== "scrypt" || !sal || !h) return false;
  const esperado = Buffer.from(h, "base64");
  const calc = crypto.scryptSync(senha, Buffer.from(sal, "base64"), esperado.length);
  return crypto.timingSafeEqual(calc, esperado);
}

// ---------- sessao ----------
function assinar(payload) {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function criarToken(usuarioId) {
  const exp = Math.floor(Date.now() / 1000) + DIAS * 86400;
  const payload = `${usuarioId}.${exp}`;
  return `${payload}.${assinar(payload)}`;
}

export function lerToken(token) {
  if (!SECRET || !token) return null;
  const partes = token.split(".");
  if (partes.length !== 3) return null;
  const [uid, exp, sig] = partes;
  const ok = assinar(`${uid}.${exp}`);
  if (sig.length !== ok.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(ok))) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  return uid;
}

export function abrirSessao(res, usuarioId, wsId) {
  const opts = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: DIAS * 86400 };
  res.cookies.set(COOKIE_SESSAO, criarToken(usuarioId), opts);
  if (wsId) res.cookies.set(COOKIE_WS, wsId, opts);
  return res;
}

// ---------- chave de API do motor ----------
export function novaChaveApi() {
  const chave = `rk_${crypto.randomBytes(24).toString("base64url")}`;
  return { chave, hash: sha256(chave), prefixo: chave.slice(0, 9) };
}

export function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export function tokenAleatorio() {
  return crypto.randomBytes(24).toString("base64url");
}

// ---------- respostas ----------
export const erro = (status, msg) => NextResponse.json({ erro: msg }, { status });

// Usuario logado (ou null)
export async function usuarioAtual() {
  const uid = lerToken(cookies().get(COOKIE_SESSAO)?.value);
  if (!uid) return null;
  return sbSelectOne("usuarios", { id: `eq.${uid}`, select: "id,email,nome,admin_plataforma" });
}

// Contexto de toda rota de dados: usuario + workspace atual + papel.
// Retorna { erro: Response } se nao autorizado.
export async function contexto(papelMinimo = "leitor") {
  const usuario = await usuarioAtual();
  if (!usuario) return { erro: erro(401, "nao autenticado") };

  const membros = await sbSelect("membros", {
    usuario_id: `eq.${usuario.id}`,
    select: "papel,workspace:workspaces(*)",
    order: "criado_em.asc",
  });
  if (membros.length === 0) return { erro: erro(403, "sem workspace"), usuario };

  const wsCookie = cookies().get(COOKIE_WS)?.value;
  const m = membros.find((x) => x.workspace.id === wsCookie) || membros[0];
  if (PESO[m.papel] < PESO[papelMinimo]) return { erro: erro(403, "sem permissao") };

  return { usuario, workspace: m.workspace, papel: m.papel, membros };
}

export function podeGerir(papel) {
  return PESO[papel] >= PESO.admin;
}

// Workspace sem campos sensiveis, pronto para ir ao navegador.
export function wsPublico(ws) {
  const { api_key_hash, ...resto } = ws;
  return resto;
}
