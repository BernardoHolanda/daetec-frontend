import api from "./api"
import type { Vendedor } from "../types/api"

export async function listarVendedores(): Promise<Vendedor[]> {
  const { data } = await api.get<Vendedor[]>("/vendedores")
  return data
}

export async function criarVendedor(nome: string): Promise<Vendedor> {
  const { data } = await api.post<Vendedor>("/vendedores", { nome })
  return data
}

export async function atualizarVendedor(id: number, nome: string): Promise<Vendedor> {
  const { data } = await api.put<Vendedor>(`/vendedores/${id}`, { nome })
  return data
}
