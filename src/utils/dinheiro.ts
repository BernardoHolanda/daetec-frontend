export function paraCentavos(valor: string): number {
  return Math.round(Number(valor) * 100)
}

export function formatarBRL(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}
