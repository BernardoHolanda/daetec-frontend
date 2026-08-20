import api from "./api"
import type { Relatorio } from "../types/api"

/**
 * Escopo em ISO (`"2026-08-10"`). Sem nenhuma ponta o backend responde o hoje de Manaus —
 * é assim que a primeira carga descobre que dia é hoje sem confiar no relógio do navegador.
 */
export async function obterRelatorio(inicio?: string, fim?: string): Promise<Relatorio> {
  // axios descarta param undefined, então a URL sai limpa na primeira carga
  const { data } = await api.get<Relatorio>("/relatorio", { params: { inicio, fim } })
  return data
}
