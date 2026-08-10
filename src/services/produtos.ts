import api from "./api"
import type { Produto, ProdutoCreate } from "../types/api"

export async function listarProdutos(): Promise<Produto[]> {
  const { data } = await api.get<Produto[]>("/produtos")
  return data
}

export async function criarProduto(dados: ProdutoCreate): Promise<Produto> {
  const { data } = await api.post<Produto>("/produtos", dados)
  return data
}

export async function atualizarProduto(id: number, dados: ProdutoCreate): Promise<Produto> {
  const { data } = await api.put<Produto>(`/produtos/${id}`, dados)
  return data
}

export async function deletarProduto(id: number): Promise<void> {
  await api.delete(`/produtos/${id}`)
}
