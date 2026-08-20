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

export interface ProdutoResumo {
  id: number
  nome: string
}

export interface ItemVenda {
  id: number
  produto: ProdutoResumo
  vendedor: Vendedor
  quantidade: number
  preco_unitario: string
}

export interface Venda {
  id: number
  data_hora: string
  forma_pagamento: FormaPagamento | null
  cliente_id: number | null
  paga_em: string | null
  cancelada_em: string | null
  registrado_por_id: number
  itens: ItemVenda[]
}

export interface Conta {
  cliente_id: number
  nome: string
  total: string
  vendas: Venda[]
}

export interface ContaAberta {
  cliente_id: number
  nome: string
  total: string
  consumos: number
  primeiro_consumo: string
  ultimo_consumo: string
}

export interface ContasAbertas {
  total: string
  contas: ContaAberta[]
}

export interface Devedor {
  cliente_id: number
  nome: string
  valor: string
}

export interface VendedorRelatorio {
  vendedor_id: number
  nome: string
  recebido_total: string
  // Partial: o GROUP BY do backend só devolve a forma que teve venda
  recebido_por_forma: Partial<Record<FormaPagamento, string>>
  conta_em_aberto: string
  devedores: Devedor[]
}

export interface Relatorio {
  // o escopo pedido, já normalizado pelo backend: é daqui que sai o "hoje" do fuso de Manaus
  inicio: string
  fim: string
  vendedores: VendedorRelatorio[]
}

export interface Produto {
  id: number
  nome: string
  preco: string
  vendedor: Vendedor
  // null = estoque não controlado (vende à vontade); 0 = esgotado
  estoque: number | null
}

export interface ProdutoCreate {
  nome: string
  // string, não number: o backend recebe Decimal e float perderia centavo no caminho
  preco: string
  vendedor_id: number
  estoque: number | null
}
