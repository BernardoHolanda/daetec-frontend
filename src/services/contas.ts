import api from "./api"
import type { ContasAbertas } from "../types/api"

export async function listarContas(): Promise<ContasAbertas> {
  const { data } = await api.get<ContasAbertas>("/contas")
  return data
}
