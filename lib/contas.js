// Criacao de usuarios e workspaces (cadastro, setup e convites).
import { sbInsert, sbSelectOne } from "./supabase";
import { hashSenha, novaChaveApi } from "./auth";

export function validarConta({ nome, email, senha }) {
  if (!nome || !String(nome).trim()) return "Informe seu nome";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim())) return "E-mail inválido";
  if (!senha || String(senha).length < 8) return "A senha precisa ter pelo menos 8 caracteres";
  return null;
}

export async function criarUsuario({ nome, email, senha }, admin = false) {
  const em = String(email).trim().toLowerCase();
  if (await sbSelectOne("usuarios", { email: `eq.${em}`, select: "id" })) {
    const e = new Error("Já existe uma conta com este e-mail");
    e.publico = true;
    throw e;
  }
  const [u] = await sbInsert("usuarios", {
    nome: String(nome).trim(), email: em, senha_hash: hashSenha(senha), admin_plataforma: admin,
  });
  return u;
}

export async function criarWorkspace(nome, donoId, plano = "starter") {
  const { hash, prefixo } = novaChaveApi();
  const [ws] = await sbInsert("workspaces", {
    nome: String(nome).trim(), plano, api_key_hash: hash, api_key_prefixo: prefixo,
  });
  await sbInsert("membros", { workspace_id: ws.id, usuario_id: donoId, papel: "dono" });
  return ws;
}
