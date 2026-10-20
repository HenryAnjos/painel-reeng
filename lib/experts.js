// Campos seguros para listar (credenciais nunca saem do servidor)
export const CAMPOS_LISTA = "id,slug,nome,ativo,canal_telegram,canal_email,criado_em";

export function exibir(e) {
  const { session_string, api_hash, ...resto } = e;
  return { ...resto, tem_sessao: !!session_string, tem_api_hash: !!api_hash };
}

// ---------- sequencia de mensagens do Telegram ----------
export const BUCKET_MIDIAS = "midias";
export const TIPOS_MSG = ["texto", "imagem", "video", "audio", "voz", "arquivo"];
export const MAX_MSGS = 10;
const MAX_TEXTO = 4096;   // limite do Telegram para mensagem
const MAX_LEGENDA = 1024; // limite do Telegram para legenda de midia

// Valida a lista vinda do navegador. Arquivo enviado so pode apontar para a
// pasta do proprio workspace (o motor confere de novo). Lanca Error com a
// mensagem para o usuario.
export function limparMensagens(lista, wsId) {
  if (!Array.isArray(lista)) throw new Error("Mensagens inválidas");
  if (lista.length > MAX_MSGS) throw new Error(`No máximo ${MAX_MSGS} mensagens`);
  return lista.map((m, i) => {
    const n = i + 1;
    const tipo = String(m?.tipo || "");
    if (!TIPOS_MSG.includes(tipo)) throw new Error(`Mensagem ${n}: tipo inválido`);
    const texto = String(m.texto || "").trim();
    if (tipo === "texto") {
      if (!texto) throw new Error(`Mensagem ${n}: escreva o texto`);
      if (texto.length > MAX_TEXTO) throw new Error(`Mensagem ${n}: texto passa de ${MAX_TEXTO} caracteres`);
      return { tipo, texto };
    }
    if (texto.length > MAX_LEGENDA) throw new Error(`Mensagem ${n}: legenda passa de ${MAX_LEGENDA} caracteres`);
    const item = { tipo, texto };
    if (m.arquivo) {
      const arquivo = String(m.arquivo);
      if (!arquivo.startsWith(`${wsId}/`) || arquivo.includes("..")) throw new Error(`Mensagem ${n}: arquivo inválido`);
      item.arquivo = arquivo;
      item.nome = String(m.nome || arquivo.split("/").pop()).slice(0, 200);
    } else if (m.url) {
      const url = String(m.url).trim();
      if (!/^https?:\/\//i.test(url)) throw new Error(`Mensagem ${n}: a URL tem que começar com http(s)://`);
      item.url = url;
    } else {
      throw new Error(`Mensagem ${n}: envie um arquivo ou informe uma URL`);
    }
    return item;
  });
}
