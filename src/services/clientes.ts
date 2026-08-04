import api from "./api"
import type { Cliente } from "../types/api"

export async function listarClientes(): Promise<Cliente[]> {
  const { data } = await api.get<Cliente[]>("/clientes")
  return data
}
