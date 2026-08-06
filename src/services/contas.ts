import api from "./api"
import type { Conta, ContasAbertas } from "../types/api"

export async function listarContas(): Promise<ContasAbertas> {
  const { data } = await api.get<ContasAbertas>("/contas")
  return data
}

export async function obterConta(clienteId: number | string): Promise<Conta> {
  const { data } = await api.get<Conta>(`/clientes/${clienteId}/conta`)
  return data
}
