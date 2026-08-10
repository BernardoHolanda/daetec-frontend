export function paraCentavos(valor: string): number {
  return Math.round(Number(valor) * 100)
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
