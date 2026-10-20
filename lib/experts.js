// Campos seguros para listar (credenciais nunca saem do servidor)
export const CAMPOS_LISTA = "id,slug,nome,ativo,canal_telegram,canal_email,criado_em";

export function exibir(e) {
  const { session_string, api_hash, ...resto } = e;
  return { ...resto, tem_sessao: !!session_string, tem_api_hash: !!api_hash };
}
