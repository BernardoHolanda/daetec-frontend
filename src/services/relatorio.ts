import api from "./api"
import type { Relatorio } from "../types/api"

/** `dia` em ISO (`"2026-08-10"`); sem ele o backend usa o hoje do fuso de Manaus. */
export async function obterRelatorio(dia?: string): Promise<Relatorio> {
  // axios descarta param undefined, então a URL sai limpa quando não há dia
  const { data } = await api.get<Relatorio>("/relatorio", { params: { dia } })
  return data
}
