export type Papel = "admin" | "comum"

export interface Usuario {
  id: number
  username: string
  email: string
  papel: Papel
}

export interface Vendedor {
  id: number
  nome: string
}

export interface Cliente {
  id: number
  nome: string
}

export type FormaPagamento = "pix" | "dinheiro" | "debito" | "credito"

export type OpcaoPagamento = FormaPagamento | "conta"

export interface ItemVendaCreate {
  produto_id: number
  quantidade: number
}

export interface VendaCreate {
  forma_pagamento?: FormaPagamento
  cliente_id?: number
  itens: ItemVendaCreate[]
}

export interface Venda {
  id: number
  data_hora: string
  forma_pagamento: FormaPagamento | null
  cliente_id: number | null
  paga_em: string | null
  registrado_por_id: number
}

export interface Produto {
  id: number
  nome: string
  preco: string
  vendedor: Vendedor
}
