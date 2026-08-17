import type { Produto, Vendedor } from "../types/api"

export type Disponibilidade = "em-estoque" | "esgotado" | "todos"

export interface FiltroProduto {
  disponibilidade: Disponibilidade
  vendedorId: number | null
}

/** `estoque` null é produto sem controle: vende à vontade, então nunca está esgotado. */
export function filtrarProdutos(produtos: Produto[], filtro: FiltroProduto): Produto[] {
  return produtos.filter((produto) => {
    if (filtro.vendedorId !== null && produto.vendedor.id !== filtro.vendedorId) return false
    if (filtro.disponibilidade === "esgotado") return produto.estoque === 0
    if (filtro.disponibilidade === "em-estoque") return produto.estoque !== 0
    return true
  })
}

/** Donos tirados da própria lista: vendedor sem produto só ofereceria um filtro vazio. */
export function vendedoresComProduto(produtos: Produto[]): Vendedor[] {
  const porId = new Map(produtos.map((produto) => [produto.vendedor.id, produto.vendedor]))
  return [...porId.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
}
