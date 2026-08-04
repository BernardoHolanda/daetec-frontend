export interface ItemNav {
  nome: string
  rotulo: string
  curto?: string
  papel?: "admin" | "comum"
  celular?: boolean
}

export const OPERACAO: ItemNav[] = [
  { nome: "vender", rotulo: "Registrar venda", curto: "Vender", celular: true },
  {
    nome: "minhas-vendas",
    rotulo: "Minhas vendas",
    curto: "Vendas",
    papel: "comum",
    celular: true,
  },
  { nome: "contas", rotulo: "Contas em aberto", curto: "Contas", celular: true },
  {
    nome: "relatorio",
    rotulo: "Relatório do dia",
    curto: "Relatório",
    papel: "admin",
    celular: true,
  },
]

export const CADASTROS: ItemNav[] = [
  { nome: "produtos", rotulo: "Produtos" },
  { nome: "clientes", rotulo: "Clientes" },
  { nome: "vendedores", rotulo: "Vendedores" },
]
