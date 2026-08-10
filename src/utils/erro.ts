import { isAxiosError } from "axios"

/**
 * Texto que o backend mandou (400/409), ou o padrão.
 * O 422 do Pydantic manda uma lista de erros de campo, não uma frase — não serve pra tela.
 */
export function mensagemDoErro(erro: unknown, padrao: string): string {
  if (isAxiosError(erro)) {
    const detalhe = erro.response?.data?.detail
    if (typeof detalhe === "string") return detalhe
  }
  return padrao
}
