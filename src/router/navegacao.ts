export interface ItemNav {
  nome: string
  rotulo: string
  curto?: string
  papel?: "admin" | "comum"
  celular?: boolean
}

export const OPERACAO: ItemNav[] = [
  { nome: "vender", rotulo: "Registrar venda", curto: "Vender", celular: true },
  { nome: "contas", rotulo: "Contas em aberto", curto: "Contas", celular: true },
  {
    nome: "relatorio",
    rotulo: "Relatório do dia",
    curto: "Relatório",
    papel: "admin",
    celular: true,
  },
  // sem papel: vendedor precisa saber o que ainda tem, mesmo sem poder ajustar
  { nome: "estoque", rotulo: "Estoque", celular: true },
]

export const CADASTROS: ItemNav[] = [
  { nome: "produtos", rotulo: "Produtos" },
  { nome: "clientes", rotulo: "Clientes" },
  { nome: "vendedores", rotulo: "Vendedores" },
]
