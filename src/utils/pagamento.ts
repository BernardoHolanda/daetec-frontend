import type { FormaPagamento, OpcaoPagamento } from "../types/api"

/** Ordem canônica das formas à vista — a mesma no seletor e nas colunas do relatório. */
export const FORMAS: FormaPagamento[] = ["pix", "debito", "credito", "dinheiro"]

export const ROTULO_PAGAMENTO: Record<OpcaoPagamento, string> = {
  pix: "Pix",
  debito: "Débito",
  credito: "Crédito",
  dinheiro: "Dinheiro",
  conta: "Conta",
}

/** Estreita o tipo: "conta" não é forma de pagamento, é dívida. */
export function ehFormaAVista(opcao: OpcaoPagamento): opcao is FormaPagamento {
  return opcao !== "conta"
}
