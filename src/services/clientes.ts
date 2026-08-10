import api from "./api"
import type { Cliente } from "../types/api"

export async function listarClientes(): Promise<Cliente[]> {
  const { data } = await api.get<Cliente[]>("/clientes")
  return data
}

export async function criarCliente(nome: string): Promise<Cliente> {
  const { data } = await api.post<Cliente>("/clientes", { nome })
  return data
}

export async function atualizarCliente(id: number, nome: string): Promise<Cliente> {
  const { data } = await api.put<Cliente>(`/clientes/${id}`, { nome })
  return data
}

export async function deletarCliente(id: number): Promise<void> {
  await api.delete(`/clientes/${id}`)
}
