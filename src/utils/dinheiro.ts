/* Dinheiro é tratado em CENTAVOS (número inteiro) do começo ao fim.*/

/** `"6.00"` (como o backend manda) → `600` */
export function paraCentavos(valor: string): number {
  return Math.round(Number(valor) * 100)
}

/** `1650` → `"R$ 16,50"` */
export function formatarBRL(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}
