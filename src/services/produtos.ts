import api from "./api"
import type { Produto } from "../types/api"

export async function listarProdutos(): Promise<Produto[]> {
  const { data } = await api.get<Produto[]>("/produtos")
  return data
}
