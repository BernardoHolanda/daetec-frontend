export function paraCentavos(valor: string): number {
  return Math.round(Number(valor) * 100)
}

/**
 * Texto digitado por gente → centavos. `null` quando não sobra dígito nenhum.
 *
 * O último separador seguido de 1–2 dígitos é o decimal; os outros são milhar. Assim
 * `"R$ 1.234,56"`, `"2,5"` e `"2.50"` caem todos no lugar certo, e `"1.234"` continua
 * valendo mil duzentos e trinta e quatro reais.
 */
export function centavosDigitados(texto: string): number | null {
  const limpo = texto.replace(/[^\d,.]/g, "")
  if (!/\d/.test(limpo)) return null

  const decimal = limpo.match(/[.,](\d{1,2})$/)
  const inteiro = (decimal ? limpo.slice(0, decimal.index) : limpo).replace(/[.,]/g, "")
  const centavos = decimal ? decimal[1].padEnd(2, "0") : "00"

  return Number(inteiro || "0") * 100 + Number(centavos)
}

/** `14850` → `"148,50"`, sem o R$ — pra tabela em que a coluna já diz que é dinheiro. */
export function formatarValor(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatarBRL(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}
